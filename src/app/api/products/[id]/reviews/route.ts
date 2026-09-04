import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getServerSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: rows, error } = await supabase
      .from("reviews")
      .select("id, user_id, product_id, rating, comment, created_at, updated_at")
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const userIds = [...new Set((rows || []).map((r) => r.user_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, name")
      .in("id", userIds.length ? userIds : [""]);

    const nameMap = new Map<string, string>(
      (users || []).map((u) => [u.id, u.name])
    );

    const reviews = (rows || []).map((r) => ({
      _id: r.id,
      userId: { _id: r.user_id, name: nameMap.get(r.user_id) || "" },
      productId: r.product_id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error in GET /api/products/[id]/reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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
        { error: "Product ID is required" },
        { status: 400 }
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

    const { rating, comment } = body;

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    if (typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 }
      );
    }

    if (comment.trim().length > 2000) {
      return NextResponse.json(
        { error: "Comment cannot exceed 2000 characters" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_id", id)
      .eq("user_id", session.userId)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 }
      );
    }

    const reviewRating = Math.round(rating);

    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert({
        user_id: session.userId,
        product_id: id,
        rating: reviewRating,
        comment: comment.trim(),
      })
      .select("id, user_id, product_id, rating, comment, created_at, updated_at")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "You have already reviewed this product" },
          { status: 409 }
        );
      }
      throw insertError;
    }

    const { data: allReviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", id);

    const ratings = (allReviews || []).map((r) => r.rating);
    const totalRating = ratings.reduce((sum, r) => sum + r, 0);
    const avgRating =
      ratings.length > 0 ? totalRating / ratings.length : reviewRating;

    await supabase
      .from("products")
      .update({
        rating: Math.round(avgRating * 10) / 10,
        review_count: ratings.length,
      })
      .eq("id", id);

    return NextResponse.json(
      {
        message: "Review added successfully",
        review: {
          _id: review.id,
          userId: session.userId,
          productId: review.product_id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.created_at,
          updatedAt: review.updated_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/products/[id]/reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}