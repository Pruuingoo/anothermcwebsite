import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ success: true });
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("newsletter_subscribers").insert({ email });
    if (error && error.code !== "23505") throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json({ error: "Could not save your subscription right now." }, { status: 500 });
  }
}
