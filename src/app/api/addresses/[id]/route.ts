import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Address from "@/models/Address";
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

    await dbConnect();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    const address = await Address.findOneAndDelete({
      _id: id,
      userId: session.userId,
    });

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/addresses/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
