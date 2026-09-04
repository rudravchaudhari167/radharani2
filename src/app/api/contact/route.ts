import { NextRequest, NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = body;

    const errors: Record<string, string> = {};

    if (typeof name !== "string" || name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    if (
      typeof email !== "string" ||
      !email.trim() ||
      !EMAIL_REGEX.test(email.trim())
    ) {
      errors.email = "Please provide a valid email";
    }
    if (typeof subject !== "string" || subject.trim().length < 3) {
      errors.subject = "Subject must be at least 3 characters";
    }
    if (typeof message !== "string" || message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Validation failed", fields: errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Message received" });
  } catch (error) {
    console.error("Error in POST /api/contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
