import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { admin: null, authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      admin: session,
      authenticated: true,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/auth/me:", error);
    return NextResponse.json(
      { admin: null, authenticated: false },
      { status: 500 }
    );
  }
}