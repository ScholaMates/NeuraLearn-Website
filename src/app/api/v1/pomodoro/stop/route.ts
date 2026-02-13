import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, status } = body; // status: completed | interrupted

    if (!session_id) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    const { error } = await supabase
      .from("study_sessions")
      .update({
        end_time: new Date().toISOString(),
        status: status || "completed",
      })
      .eq("id", session_id);

    if (error) {
      console.error("Pomodoro Stop Error:", error);
      return NextResponse.json(
        { error: "Failed to stop session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "stopped" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
