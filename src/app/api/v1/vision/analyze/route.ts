import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("gemini_api_key")
      .eq("id", userId)
      .single();

    const apiKey = profile?.gemini_api_key || process.env.GEMINI_API_KEY!;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use flash for vision as well

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    const prompt =
      "Analyze this image and explain the academic concept or solve the problem shown. Be helpful and clear.";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type || "image/jpeg",
        },
      },
    ]);

    const responseText = result.response.text();

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
