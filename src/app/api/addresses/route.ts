import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServer } from "@/lib/supabase-server";
import { addressFromRow, type AddressRow } from "@/lib/supabase-shapes";
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

    const supabase = getSupabaseServer();

    const { data: rows } = await supabase
      .from("addresses")
      .select("id, user_id, full_name, phone, email, address_line1, address_line2, city, state, pincode, landmark, type, is_default, created_at, updated_at")
      .eq("user_id", session.userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    const addresses = ((rows as AddressRow[] | null) || []).map(addressFromRow);

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
      ? ((type as string) as "HOME" | "WORK" | "OTHER")
      : "HOME";

    const makeDefault = isDefault === true;

    const supabase = getSupabaseServer();

    if (makeDefault) {
      await supabase
        .from("addresses")
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq("user_id", session.userId);
    }

    const { data: created, error: insertError } = await supabase
      .from("addresses")
      .insert({
        id: randomUUID(),
        user_id: session.userId,
        full_name: (fullName as string).trim(),
        phone: (phone as string).trim(),
        email: (email as string).trim(),
        address_line1: (addressLine1 as string).trim(),
        address_line2: typeof addressLine2 === "string" ? addressLine2.trim() : "",
        city: (city as string).trim(),
        state: (state as string).trim(),
        pincode: (pincode as string).trim(),
        landmark: typeof landmark === "string" ? landmark.trim() : "",
        type: addressType,
        is_default: makeDefault,
      })
      .select("id, user_id, full_name, phone, email, address_line1, address_line2, city, state, pincode, landmark, type, is_default, created_at, updated_at")
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json(
      { message: "Address added successfully", address: addressFromRow(created as AddressRow) },
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

    const supabase = getSupabaseServer();

    const { data: address } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", addressId.trim())
      .eq("user_id", session.userId)
      .maybeSingle();

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof fields.fullName === "string") update.full_name = fields.fullName.trim();
    if (typeof fields.phone === "string") update.phone = fields.phone.trim();
    if (typeof fields.email === "string") update.email = fields.email.trim();
    if (typeof fields.addressLine1 === "string") update.address_line1 = fields.addressLine1.trim();
    if (typeof fields.addressLine2 === "string") update.address_line2 = fields.addressLine2.trim();
    if (typeof fields.city === "string") update.city = fields.city.trim();
    if (typeof fields.state === "string") update.state = fields.state.trim();
    if (typeof fields.pincode === "string") update.pincode = fields.pincode.trim();
    if (typeof fields.landmark === "string") update.landmark = fields.landmark.trim();

    const validTypes = ["HOME", "WORK", "OTHER"];
    if (typeof fields.type === "string" && validTypes.includes(fields.type)) {
      update.type = fields.type;
    }

    if (typeof fields.isDefault === "boolean") {
      update.is_default = fields.isDefault;
      if (fields.isDefault) {
        await supabase
          .from("addresses")
          .update({ is_default: false, updated_at: new Date().toISOString() })
          .eq("user_id", session.userId)
          .neq("id", address.id);
      }
    }

    await supabase.from("addresses").update(update).eq("id", address.id);

    const { data: updated } = await supabase
      .from("addresses")
      .select("id, user_id, full_name, phone, email, address_line1, address_line2, city, state, pincode, landmark, type, is_default, created_at, updated_at")
      .eq("id", address.id)
      .maybeSingle();

    return NextResponse.json({
      message: "Address updated successfully",
      address: updated ? addressFromRow(updated as AddressRow) : undefined,
    });
  } catch (error) {
    console.error("Error in PUT /api/addresses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}