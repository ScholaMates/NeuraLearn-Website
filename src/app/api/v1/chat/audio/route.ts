import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabase-admin";
import tutorModes from "@/config/tutorModes.json";
import responseLengths from "@/config/responseLengths.json";
import academicLevels from "@/config/academicLevels.json";
import Groq from "groq-sdk";

export async function POST(request: Request) {
  let chatId: string | undefined;

  try {
    // 1. Extract required headers instead of JSON body
    const userId = request.headers.get("x-user-id");
    const providedChatId = request.headers.get("x-chat-id");
    const tutorMode = request.headers.get("x-tutor-mode");

    if (!userId) {
      return NextResponse.json(
        { error: "x-user-id header is required" },
        { status: 400 }
      );
    }
    chatId = providedChatId || undefined;

    // 2. Extract raw audio bytes from the request body
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "Audio body is empty. Please provide application/octet-stream" },
        { status: 400 }
      );
    }

    // 3. Convert buffer to a File object for Groq SDK
    // The name is arbitrary since we just need the file content
    const audioFile = new File([buffer], "audio.wav", { type: "audio/wav" });

    // 4. Initialize Groq and Transcribe the audio
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey: groqApiKey });
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo", // Fastest model
      response_format: "text",
    });

    const transcribedText = typeof transcription === "string" ? transcription : transcription.text;
    
    if (!transcribedText || transcribedText.trim() === "") {
        return NextResponse.json(
            { error: "Could not detect speech in audio." },
            { status: 400 }
        );
    }

    // --- GEMINI PIPELINE REUSED FROM COMPLETION ENDPOINT ---
    const supabase = supabaseAdmin;

    // Fetch user profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "nickname, response_length, academic_level, major, about_me, custom_model, gemini_api_key, tutor_mode"
      )
      .eq("id", userId)
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
      let title = transcribedText.substring(0, 30) + (transcribedText.length > 30 ? "..." : "");

      try {
        const titleModel = genAI.getGenerativeModel({ model: modelName });
        const titleResult = await titleModel.generateContent(
          `Generate a short, descriptive title (max 6 words) for this user query: "${transcribedText}". No quotes.`
        );
        title = titleResult.response.text().trim();
      } catch (ignored) {}

      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({
          user_id: userId,
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

    // Save User Message (The transribed text)
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: "user",
      content: transcribedText,
    });

    let systemInstruction =
      "You are a helpful AI assistant. Use LaTeX for mathematical expressions. Wrap inline math in single dollar signs ($) and block math in double dollar signs ($$).";

    if (profile) {
      const { nickname, response_length, academic_level, major, about_me } =
        profile;

      const activeTutorMode = tutorMode || profile.tutor_mode;
      const parts = [];

      if (nickname) parts.push(`The user's nickname is ${nickname}.`);
      if (major) parts.push(`The user's major/field of study is ${major}. Use relevant analogies.`);
      if (about_me) parts.push(`User info: ${about_me}`);

      const modeConfig = tutorModes.find((m) => m.id === activeTutorMode);
      if (modeConfig) parts.push(modeConfig.prompt);

      const lengthConfig = responseLengths.find((l) => l.id === response_length);
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

    const result = await chat.sendMessage(transcribedText);
    const responseText = result.response.text();

    // Save Model Message
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: "model",
      content: responseText,
    });

    return NextResponse.json({
      text: responseText,
      transcribed_text: transcribedText,
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
