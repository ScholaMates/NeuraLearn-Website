import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // { battery_level: 80, status: 'idle', wifi_signal: -50 }

    console.log("[Device Status Heartbeat]:", body);

    // TODO: Save to database if live tracking is needed

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
