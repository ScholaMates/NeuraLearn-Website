import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/*>
Handles POST requests to process and analyze raw image binary data via a vision AI model and persists the conversation to the database.
*/
export async function POST(request: Request) {
  try {
    // ── Native Binary Ingestion (Zero-Copy Architecture) ──────────────────────
    // The App Router's built-in Request.arrayBuffer() pushes ingestion down into
    // V8/Node.js C++ bindings. No manual chunk loops, no UTF-8 mis-parsing of
    // raw binary pixel data. The framework handles the raw TCP stream perfectly.
    const arrayBuffer = await request.arrayBuffer();
    const imageBytes = Buffer.from(arrayBuffer);

    // Read metadata from query string (ESP32 passes these as URL params)
    const url = new URL(request.url);
    const userId = url.searchParams.get("user_id");
    const chatId = url.searchParams.get("chat_id") ?? null;
    const mimeType = request.headers.get("content-type") ?? "image/jpeg";

    //> Ensures that both image data and user identifier are provided, failing early if either is missing
    if (!imageBytes.length || !userId) {
      return NextResponse.json(
        { error: "Image bytes and user_id are required" },
        { status: 400 },
      );
    }

    const supabase = supabaseAdmin;

    // ── Upload raw bytes to Supabase Storage ──────────────────────────────────
    const ext = mimeType.split("/")[1]?.split(";")[0] ?? "jpg";
    const fileName = `${userId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-images")
      .upload(fileName, imageBytes, {
        contentType: mimeType,
        upsert: false,
      });

    //> Throws an error to abort execution if uploading the image to Supabase storage fails
    if (uploadError) {
      throw new Error("Supabase Storage Error: " + uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from("chat-images")
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    // ── Call Vision Model via inline Base64 data URI ──────────────────────────
    // Using a Base64 data URI means we don't need to wait for Supabase's CDN to
    // propagate the URL — the model receives the pixels directly in the request.
    const base64Image = imageBytes.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    const prompt =
      "Analyze this image and explain the academic concept or solve the problem shown. Be helpful and clear.";

    const proxyMessages = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: dataUri },
          },
        ],
      },
    ];

    const proxyResponse = await fetch(
      "https://ai.hackclub.com/proxy/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HACKCLUB_AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: proxyMessages,
        }),
      },
    );

    //> Checks if the proxy API generated an error, logs it, and halts the process by throwing an exception
    if (!proxyResponse.ok) {
      const errorText = await proxyResponse.text();
      console.error("Vision proxy failed:", errorText);
      throw new Error("Vision generation failed");
    }

    const proxyData = await proxyResponse.json();
    const responseText = proxyData.choices[0].message.content;

    // ── Persist conversation to DB ─────────────────────────────────────────────
    let finalChatId = chatId;

    //> Creates a new chat session in the database if an existing chat ID wasn't provided for this interaction
    if (!finalChatId) {
      const { data: newChat } = await supabase
        .from("chats")
        .insert({ user_id: userId, title: "Image Analysis" })
        .select()
        .single();
      if (newChat) finalChatId = newChat.id;
    }

    //> If a valid chat ID exists, saves both the user's uploaded image URL and the vision model's response to the database messages table
    if (finalChatId) {
      await supabase.from("messages").insert({
        chat_id: finalChatId,
        role: "user",
        content: `[Image Uploaded] ${imageUrl}`,
      });

      await supabase.from("messages").insert({
        chat_id: finalChatId,
        role: "model",
        content: responseText,
      });
    }

    return NextResponse.json({
      text: responseText,
      chat_id: finalChatId,
      image_url: imageUrl,
    });
  } catch (error) {
    //> Catches any internal or API errors that occurred during processing to ensure a graceful server error response is returned
    console.error("Vision API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
