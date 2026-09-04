import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getServerSession } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: existing } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.userId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    await supabase.from("addresses").delete().eq("id", existing.id);

    return NextResponse.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/addresses/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}