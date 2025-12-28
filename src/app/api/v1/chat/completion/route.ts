import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabase-admin";
import tutorModes from "@/config/tutorModes.json";
import responseLengths from "@/config/responseLengths.json";
import academicLevels from "@/config/academicLevels.json";

const API = process.env.GEMINI_API_KEY!;

export async function POST(request: Request) {
  let chatId: string | undefined;

  try {
    const body = await request.json();
    /*
          Input:
          - text: string, required
          - tutor_mode: string, optional
          - user_id: string, required (UUID)
          - chat_id: string, optional (to continue conversation)
         */
    const { text, tutor_mode, user_id, chat_id: providedChatId } = body;
    chatId = providedChatId;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // Note: For device API, we are trusting the user_id passed from the device (which should have authenticated via /register first)
    // Ideally we would validate a session token here.

    // Fetch user profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "nickname, response_length, academic_level, major, about_me, custom_model, gemini_api_key, tutor_mode"
      )
      .eq("id", user_id)
      .single();

    const apiKey = profile?.gemini_api_key || process.env.GEMINI_API_KEY!;
    const modelName =
      profile?.custom_model ||
      process.env.GEMINI_AI_MODEL ||
      "gemini-1.5-flash";

    const genAI = new GoogleGenerativeAI(apiKey);

    // Fetch history if this is an existing chat
    let historyForGemini: { role: string; parts: { text: string }[] }[] = [];
    if (providedChatId) {
      const { data: previousMessages } = await supabase
        .from("messages")
        .select("role, content")
        .eq("chat_id", providedChatId)
        .order("created_at", { ascending: true });

      if (previousMessages) {
        historyForGemini = previousMessages.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        }));
      }
    }

    // Create new chat if no ID provided
    if (!chatId) {
      let title = text.substring(0, 30) + (text.length > 30 ? "..." : "");

      // Try to generate a better title
      try {
        const titleModel = genAI.getGenerativeModel({ model: modelName });
        const titleResult = await titleModel.generateContent(
          `Generate a short, descriptive title (max 6 words) for this user query: "${text}". No quotes.`
        );
        title = titleResult.response.text().trim();
      } catch (ignored) {}

      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({
          user_id: user_id,
          title: title,
        })
        .select()
        .single();

      if (chatError || !newChat) {
        console.error("Error creating chat:", chatError);
        return NextResponse.json(
          { error: "Failed to create chat session" },
          { status: 500 }
        );
      }
      chatId = newChat.id;
    }

    // Save User Message
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: "user",
      content: text,
    });

    let systemInstruction =
      "You are a helpful AI assistant. Use LaTeX for mathematical expressions. Wrap inline math in single dollar signs ($) and block math in double dollar signs ($$).";

    if (profile) {
      const { nickname, response_length, academic_level, major, about_me } =
        profile;

      // Use passed tutor_mode or fallback to profile
      const activeTutorMode = tutor_mode || profile.tutor_mode;

      const parts = [];

      if (nickname) parts.push(`The user's nickname is ${nickname}.`);

      if (major)
        parts.push(
          `The user's major/field of study is ${major}. Use relevant analogies.`
        );
      if (about_me) parts.push(`User info: ${about_me}`);

      const modeConfig = tutorModes.find((m) => m.id === activeTutorMode);
      if (modeConfig) parts.push(modeConfig.prompt);

      const lengthConfig = responseLengths.find(
        (l) => l.id === response_length
      );
      if (lengthConfig) parts.push(lengthConfig.prompt);

      const levelConfig = academicLevels.find((l) => l.id === academic_level);
      if (levelConfig) parts.push(levelConfig.prompt);

      if (parts.length > 0) {
        systemInstruction += " " + parts.join(" ");
      }
    }

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction,
    });

    const chat = model.startChat({
      history: historyForGemini,
      generationConfig: {
        maxOutputTokens: 2000,
      },
    });

    const result = await chat.sendMessage(text);
    const responseText = result.response.text();

    // Save Model Message
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: "model",
      content: responseText,
    });

    return NextResponse.json({
      text: responseText,
      chat_id: chatId,
      audio_url: null, // Placeholder for future TTS
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
