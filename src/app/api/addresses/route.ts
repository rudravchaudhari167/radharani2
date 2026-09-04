import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Address from "@/models/Address";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();

    const addresses = await Address.find({ userId: session.userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Error in GET /api/addresses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      fullName,
      phone,
      email,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      landmark,
      type,
      isDefault,
    } = body;

    const errors: Record<string, string> = {};

    if (typeof fullName !== "string" || !fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (typeof phone !== "string" || !phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^[+]?[\d\s-]{8,15}$/.test(phone.trim())) {
      errors.phone = "Invalid phone number";
    }

    if (typeof email !== "string" || !email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Invalid email";
    }

    if (typeof addressLine1 !== "string" || !addressLine1.trim()) {
      errors.addressLine1 = "Address line 1 is required";
    }

    if (typeof city !== "string" || !city.trim()) {
      errors.city = "City is required";
    }

    if (typeof state !== "string" || !state.trim()) {
      errors.state = "State is required";
    }

    if (typeof pincode !== "string" || !pincode.trim()) {
      errors.pincode = "Pincode is required";
    } else if (!/^[0-9]{4,10}$/.test(pincode.trim())) {
      errors.pincode = "Invalid pincode";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Validation failed", fields: errors },
        { status: 400 }
      );
    }

    const validTypes = ["HOME", "WORK", "OTHER"];
    const addressType = validTypes.includes(type as string)
      ? (type as "HOME" | "WORK" | "OTHER")
      : "HOME";

    const address = await Address.create({
      userId: session.userId,
      fullName: (fullName as string).trim(),
      phone: (phone as string).trim(),
      email: (email as string).trim(),
      addressLine1: (addressLine1 as string).trim(),
      addressLine2: typeof addressLine2 === "string" ? addressLine2.trim() : "",
      city: (city as string).trim(),
      state: (state as string).trim(),
      pincode: (pincode as string).trim(),
      landmark: typeof landmark === "string" ? landmark.trim() : "",
      type: addressType,
      isDefault: isDefault === true,
    });

    if (isDefault === true) {
      await Address.updateMany(
        { userId: session.userId, _id: { $ne: address._id } },
        { isDefault: false }
      );
    }

    return NextResponse.json(
      { message: "Address added successfully", address },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/addresses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { addressId, ...fields } = body;

    if (typeof addressId !== "string" || !addressId.trim()) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    const address = await Address.findOne({
      _id: addressId.trim(),
      userId: session.userId,
    });

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    if (typeof fields.fullName === "string") address.fullName = fields.fullName.trim();
    if (typeof fields.phone === "string") address.phone = fields.phone.trim();
    if (typeof fields.email === "string") address.email = fields.email.trim();
    if (typeof fields.addressLine1 === "string") address.addressLine1 = fields.addressLine1.trim();
    if (typeof fields.addressLine2 === "string") address.addressLine2 = fields.addressLine2.trim();
    if (typeof fields.city === "string") address.city = fields.city.trim();
    if (typeof fields.state === "string") address.state = fields.state.trim();
    if (typeof fields.pincode === "string") address.pincode = fields.pincode.trim();
    if (typeof fields.landmark === "string") address.landmark = fields.landmark.trim();

    const validTypes = ["HOME", "WORK", "OTHER"];
    if (typeof fields.type === "string" && validTypes.includes(fields.type)) {
      address.type = fields.type as "HOME" | "WORK" | "OTHER";
    }

    if (typeof fields.isDefault === "boolean") {
      address.isDefault = fields.isDefault;
      if (fields.isDefault) {
        await Address.updateMany(
          { userId: session.userId, _id: { $ne: address._id } },
          { isDefault: false }
        );
      }
    }

    await address.save();

    return NextResponse.json({ message: "Address updated successfully", address });
  } catch (error) {
    console.error("Error in PUT /api/addresses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
