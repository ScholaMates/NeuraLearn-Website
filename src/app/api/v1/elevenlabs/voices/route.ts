import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey,
      },
      next: {
        revalidate: 3600, // Cache for 1 hour to prevent hitting rate limits
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API returned ${response.status}`);
    }

    const data = await response.json();

    // Map to just the clean data we need for the dropdown UI securely
    const voices = data.voices.map((v: any) => ({
      id: v.voice_id,
      name: v.name,
      preview_url: v.preview_url,
    }));

    return NextResponse.json({ voices });
  } catch (error) {
    console.error("Error fetching ElevenLabs voices:", error);
    return NextResponse.json(
      { error: "Failed to fetch voices" },
      { status: 500 }
    );
  }
}
