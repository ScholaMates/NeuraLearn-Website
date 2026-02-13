import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { device_id } = body;

    if (!device_id) {
      return NextResponse.json(
        { error: "Device ID is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // 1. Verify Device ID exists in device_ids table
    const { data: validDevice } = await supabase
      .from("device_ids")
      .select("code")
      .eq("code", device_id)
      .single();

    if (!validDevice) {
      return NextResponse.json({ error: "Invalid Device ID" }, { status: 401 });
    }

    // 2. Find which user owns this device
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, nickname")
      .eq("device_id", device_id)
      .single();

    if (!profile) {
      // Device is valid but not linked to a user yet
      return NextResponse.json(
        { error: "Device not active or not linked to a user" },
        { status: 403 }
      );
    }

    // 3. Return session/auth info
    // In a real app, generate a JWT here. For now, we return user_id which the device sends back.
    return NextResponse.json({
      status: "authenticated",
      user_id: profile.id,
      nickname: profile.nickname,
      session_token: "mock-session-token-" + Date.now(),
    });
  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
