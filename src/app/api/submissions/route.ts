import { NextResponse } from "next/server";
import { insertSubmission, getAllSubmissions, getStats } from "@/lib/db";
import { checkAdminPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, projectType, unitType, quality, access, sqft, estimateRange, message } = body;
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }
    const id = await insertSubmission({ name, email, phone, projectType, unitType, quality, access, sqft, estimateRange, message });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const password = request.headers.get("x-admin-password");
  if (!checkAdminPassword(password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const submissions = await getAllSubmissions();
    const stats = await getStats();
    return NextResponse.json({ submissions, stats });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
