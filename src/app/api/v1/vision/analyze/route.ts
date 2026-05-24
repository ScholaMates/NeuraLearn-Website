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

    // Read metadata from headers or query string (ESP32 passes these as URL params or headers)
    const url = new URL(request.url);
    const userId = request.headers.get("x-user-id") || url.searchParams.get("user_id");
    const chatId = request.headers.get("x-chat-id") || url.searchParams.get("chat_id") || null;
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
      "Analyze this image and explain the academic concept or solve the problem shown. Be helpful and clear. Please use english unless asked in another language, CRITICAL: Never speak more than 3 sentences. Keep responses brief, As vercel will cut off the connection if its too long" +
      "If the image contains handwritten text, transcribe it. If it contains a math problem, solve it step by step. If it contains a diagram, describe its components and relationships. Focus on educational content and be concise, You can add on a sentence at the end saying to ask them if they want you to continue explaining the next part'";

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
        content: `![Uploaded Image](${imageUrl})`,
      });

      await supabase.from("messages").insert({
        chat_id: finalChatId,
        role: "model",
        content: responseText,
      });
    }

    let audioUrl: string | null = null;

    // --- TTS PIPELINE ---
    try {
      if (process.env.ELEVENLABS_API_KEY) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("elevenlabs_voice_id")
          .eq("id", userId)
          .single();

        const voiceId =
          profile?.elevenlabs_voice_id ||
          process.env.ELEVENLABS_VOICE_ID ||
          "cgSgspJ2msm6clMCkdW9";

        const ttsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=pcm_16000`,
          {
            method: "POST",
            headers: {
              "xi-api-key": process.env.ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: responseText,
              model_id: "eleven_turbo_v2_5",
            }),
          },
        );

        if (!ttsResponse.ok) {
          throw new Error(
            "ElevenLabs API failed: " + (await ttsResponse.text()),
          );
        }

        const rawArrayBuffer = await ttsResponse.arrayBuffer();
        const int16Data = new Int16Array(rawArrayBuffer);
        const pcmBuffer = Buffer.from(int16Data.buffer);

        const dataLength = pcmBuffer.length;
        const wavHeader = Buffer.alloc(44);
        const sampleRate = 16000;
        const numChannels = 1;
        const bitsPerSample = 16;

        wavHeader.write("RIFF", 0);
        wavHeader.writeUInt32LE(36 + dataLength, 4);
        wavHeader.write("WAVE", 8);
        wavHeader.write("fmt ", 12);
        wavHeader.writeUInt32LE(16, 16);
        wavHeader.writeUInt16LE(1, 20);
        wavHeader.writeUInt16LE(numChannels, 22);
        wavHeader.writeUInt32LE(sampleRate, 24);
        wavHeader.writeUInt32LE(
          sampleRate * numChannels * (bitsPerSample / 8),
          28,
        );
        wavHeader.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
        wavHeader.writeUInt16LE(bitsPerSample, 34);
        wavHeader.write("data", 36);
        wavHeader.writeUInt32LE(dataLength, 40);

        const finalAudioBuffer = Buffer.concat([wavHeader, pcmBuffer]);

        const fileName = `${userId}-${Date.now()}.wav`;
        const { data, error } = await supabase.storage
          .from("audio-responses")
          .upload(fileName, finalAudioBuffer, {
            contentType: "audio/wav",
            upsert: false,
          });

        if (error) throw new Error("Supabase Storage Error: " + error.message);

        const { data: publicUrlData } = supabase.storage
          .from("audio-responses")
          .getPublicUrl(fileName);

        audioUrl = publicUrlData.publicUrl;
      } else if (process.env.OPENAI_API_KEY) {
        const ttsResponse = await fetch(
          "https://api.openai.com/v1/audio/speech",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "tts-1",
              input: responseText,
              voice: "alloy",
              response_format: "wav",
            }),
          },
        );

        if (!ttsResponse.ok) {
          throw new Error("OpenAI API failed: " + (await ttsResponse.text()));
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        const audioBufferNode = Buffer.from(audioBuffer);

        const fileName = `${userId}-${Date.now()}.wav`;
        const { data, error } = await supabase.storage
          .from("audio-responses")
          .upload(fileName, audioBufferNode, {
            contentType: "audio/wav",
            upsert: false,
          });

        if (error) throw new Error("Supabase Storage Error: " + error.message);

        const { data: publicUrlData } = supabase.storage
          .from("audio-responses")
          .getPublicUrl(fileName);

        audioUrl = publicUrlData.publicUrl;
      } else {
        console.warn("No TTS API key configured. Skipping TTS generation.");
      }
    } catch (ttsError) {
      console.error("TTS or Upload pipeline failed:", ttsError);
    }

    return NextResponse.json({
      text: responseText,
      chat_id: finalChatId,
      image_url: imageUrl,
      audio_url: audioUrl,
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
