import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    const { data: session, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: user_id,
        status: "focused",
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Pomodoro Start Error:", error);
      return NextResponse.json(
        { error: "Failed to start session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ session_id: session.id, status: "started" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
