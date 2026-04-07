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
        { status: 400 },
      );
    }
    chatId = providedChatId || undefined;

    // 2. Extract raw audio bytes from the request body
    const arrayBuffer = await request.arrayBuffer();
    const pcmBuffer = Buffer.from(arrayBuffer);

    if (pcmBuffer.length === 0) {
      return NextResponse.json(
        {
          error: "Audio body is empty. Please provide application/octet-stream",
        },
        { status: 400 },
      );
    }

    // 2.5 Construct WAV Header (16kHz, Mono, 16-bit PCM) for Groq
    // ESP32 sends raw PCM data without a container, so we must build the RIFF/WAVE header ourselves.
    const dataLength = pcmBuffer.length;
    const header = Buffer.alloc(44);

    header.write("RIFF", 0);
    header.writeUInt32LE(36 + dataLength, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size
    header.writeUInt16LE(1, 20); // AudioFormat = 1 (PCM)
    header.writeUInt16LE(1, 22); // NumChannels = 1
    header.writeUInt32LE(16000, 24); // SampleRate = 16000
    header.writeUInt32LE(16000 * 1 * 2, 28); // ByteRate = SampleRate * NumChannels * BitsPerSample/8
    header.writeUInt16LE(1 * 2, 32); // BlockAlign = NumChannels * BitsPerSample/8
    header.writeUInt16LE(16, 34); // BitsPerSample = 16
    header.write("data", 36);
    header.writeUInt32LE(dataLength, 40);

    const wavBuffer = Buffer.concat([header, pcmBuffer]);

    // 3. Convert buffer to a File object for Groq SDK
    // The name is arbitrary since we just need the file content
    const audioFile = new File([wavBuffer], "audio.wav", { type: "audio/wav" });

    // 4. Initialize Groq and Transcribe the audio
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const groq = new Groq({ apiKey: groqApiKey });
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo", // Fastest model
      response_format: "text",
      language: "en", // Force English to prevent hallucinating other languages
    });

    const transcribedText =
      typeof transcription === "string" ? transcription : transcription.text;

    if (!transcribedText || transcribedText.trim() === "") {
      return NextResponse.json(
        { error: "Could not detect speech in audio." },
        { status: 400 },
      );
    }

    // --- GEMINI PIPELINE REUSED FROM COMPLETION ENDPOINT ---
    const supabase = supabaseAdmin;

    // Fetch user profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "nickname, response_length, academic_level, major, about_me, custom_model, gemini_api_key, tutor_mode, elevenlabs_voice_id",
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
      let title =
        transcribedText.substring(0, 30) +
        (transcribedText.length > 30 ? "..." : "");

      try {
        const titleModel = genAI.getGenerativeModel({ model: modelName });
        const titleResult = await titleModel.generateContent(
          `Generate a short, descriptive title (max 6 words) for this user query: "${transcribedText}". No quotes.`,
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
          { status: 500 },
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
      "You are a helpful AI assistant. Use LaTeX for mathematical expressions. Wrap inline math in single dollar signs ($) and block math in double dollar signs ($$). Please use english unless asked in another language";

    if (profile) {
      const {
        nickname,
        response_length,
        academic_level,
        major,
        about_me,
        elevenlabs_voice_id,
      } = profile;

      const activeTutorMode = tutorMode || profile.tutor_mode;
      const parts = [];

      if (nickname) parts.push(`The user's nickname is ${nickname}.`);
      if (major)
        parts.push(
          `The user's major/field of study is ${major}. Use relevant analogies.`,
        );
      if (about_me) parts.push(`User info: ${about_me}`);

      const modeConfig = tutorModes.find((m) => m.id === activeTutorMode);
      if (modeConfig) parts.push(modeConfig.prompt);

      const lengthConfig = responseLengths.find(
        (l) => l.id === response_length,
      );
      if (lengthConfig) parts.push(lengthConfig.prompt);

      const levelConfig = academicLevels.find((l) => l.id === academic_level);
      if (levelConfig) parts.push(levelConfig.prompt);

      if (parts.length > 0) {
        systemInstruction += " " + parts.join(" ");
      }
    }

    let responseText: string;
    let action: string | undefined;

    const tools: any = [
      {
        functionDeclarations: [
          {
            name: "take_picture",
            description:
              "Call this tool if the user asks for a photo, to see something, or to describe their surroundings.",
          },
        ],
      },
    ];

    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction,
        tools: tools,
      });

      const chat = model.startChat({
        history: historyForGemini,
        generationConfig: {
          maxOutputTokens: 2000,
        },
      });

      const result = await chat.sendMessage(transcribedText);
      const response = result.response;

      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (call.name === "take_picture") {
          action = "TAKE_PICTURE";
          try {
            responseText = response.text();
            if (!responseText) responseText = "Sure! Get ready.";
          } catch {
            responseText = "Sure! Get ready.";
          }
        } else {
          responseText = response.text() || "Sure.";
        }
      } else {
        responseText = response.text();
      }
    } catch (geminiError) {
      console.warn("Gemini API failed, falling back to proxy:", geminiError);

      const proxyMessages = [];
      if (systemInstruction) {
        proxyMessages.push({ role: "system", content: systemInstruction });
      }
      for (const msg of historyForGemini) {
        proxyMessages.push({
          role: msg.role === "model" ? "assistant" : "user",
          content: msg.parts[0].text,
        });
      }
      proxyMessages.push({ role: "user", content: transcribedText });

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
            tools: [
              {
                type: "function",
                function: {
                  name: "take_picture",
                  description:
                    "Call this tool if the user asks for a photo, to see something, or to describe their surroundings.",
                },
              },
            ],
          }),
        },
      );

      if (!proxyResponse.ok) {
        const errorText = await proxyResponse.text();
        console.error("Proxy fallback failed:", errorText);
        throw new Error("Both Gemini and fallback failed");
      }

      const proxyData = await proxyResponse.json();
      const choice = proxyData.choices[0];

      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        const toolCall = choice.message.tool_calls[0];
        if (toolCall.function.name === "take_picture") {
          action = "TAKE_PICTURE";
          responseText = choice.message.content || "Sure! Get ready.";
        } else {
          responseText = choice.message.content || "Sure.";
        }
      } else {
        responseText = choice.message.content;
      }
    }

    // Save Model Message
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: "model",
      content: responseText,
    });

    let audioUrl: string | null = null;

    return NextResponse.json({
      status: "success",
      transcription: transcribedText,
      text_response: responseText,
      audio_url: audioUrl, // Null if no configured API keys or if failed
      chat_id: chatId,
      ...(action ? { action } : {}),
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
