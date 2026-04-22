import { NextResponse } from "next/server";

/*>
Fetches the list of available voices from ElevenLabs API and securely maps the response to only return necessary data for the client UI.
*/
export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    //> Intercepts the request and returns an error if the ElevenLabs API key is missing from the server configuration
    if (!apiKey) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY is not configured on the server." },
        { status: 500 },
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

    //> Throws a descriptive error if the external API request fails, preventing further processing
    if (!response.ok) {
      throw new Error(`ElevenLabs API returned ${response.status}`);
    }

    const data = await response.json();

    // Map to just the clean data we need for the dropdown UI securely
    //> Iterates through the raw external voice data and extracts only the non-sensitive fields required for the UI selector
    const voices = data.voices.map((v: any) => ({
      id: v.voice_id,
      name: v.name,
      preview_url: v.preview_url,
    }));

    return NextResponse.json({ voices });
  } catch (error) {
    //> Catches any unhandled errors from the fetch or mapping operations to gracefully return a server error status
    console.error("Error fetching ElevenLabs voices:", error);
    return NextResponse.json(
      { error: "Failed to fetch voices" },
      { status: 500 },
    );
  }
}
