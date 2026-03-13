import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const userId = formData.get("user_id") as string;
    const chatId = formData.get("chat_id") as string | null;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "Image and User ID are required" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    const prompt =
      "Analyze this image and explain the academic concept or solve the problem shown. Be helpful and clear.";

    const originalName = file.name || "image.jpg";
    const fileName = `${userId}-${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    
    // Upload image to Supabase
    const { error: uploadError } = await supabase.storage
      .from("chat-images")
      .upload(fileName, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      throw new Error("Supabase Storage Error: " + uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from("chat-images")
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    const proxyMessages = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ];

    const proxyResponse = await fetch("https://ai.hackclub.com/proxy/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HACKCLUB_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: proxyMessages,
      })
    });

    if (!proxyResponse.ok) {
      const errorText = await proxyResponse.text();
      console.error("Vision proxy failed:", errorText);
      throw new Error("Vision generation failed");
    }

    const proxyData = await proxyResponse.json();
    const responseText = proxyData.choices[0].message.content;

    // Save conversation to DB
    let finalChatId = chatId;

    if (!finalChatId) {
      // Create new chat
      const { data: newChat } = await supabase
        .from("chats")
        .insert({
          user_id: userId,
          title: "Image Analysis",
        })
        .select()
        .single();
      if (newChat) finalChatId = newChat.id;
    }

    if (finalChatId) {
      // 1. User Message (We can't store image buffer in text content easily, so we say [Image Upload])
      // Ideally we upload image to storage bucket and link it. For MVP, we just note it.
      await supabase.from("messages").insert({
        chat_id: finalChatId,
        role: "user",
        content: "[Image Uploaded] " + prompt,
      });

      // 2. Model Message
      await supabase.from("messages").insert({
        chat_id: finalChatId,
        role: "model",
        content: responseText,
      });
    }

    return NextResponse.json({
      text: responseText,
      chat_id: finalChatId,
    });
  } catch (error) {
    console.error("Vision API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
