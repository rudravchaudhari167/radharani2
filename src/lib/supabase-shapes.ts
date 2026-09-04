/**
 * Mappers between Supabase (snake_case) rows and the camelCase API shape the
 * frontend was built against (previously produced by Mongoose `.lean()`).
 */

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  old_price: number | null;
  category: string;
  subcategory: string;
  images: string[];
  model_3d: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  sku: string;
  rating: number;
  review_count: number;
  tags: string[];
  featured: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function productFromRow(row: ProductRow) {
  return {
    _id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price) || 0,
    oldPrice: row.old_price == null ? undefined : Number(row.old_price),
    category: row.category,
    subcategory: row.subcategory,
    images: row.images || [],
    model3D: row.model_3d || "",
    sizes: row.sizes || [],
    colors: row.colors || [],
    stock: row.stock,
    sku: row.sku,
    rating: Number(row.rating) || 0,
    reviewCount: row.review_count,
    tags: row.tags || [],
    featured: row.featured,
    isNewArrival: row.is_new_arrival,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role: "USER" | "ADMIN";
  is_active: boolean;
  two_factor_enabled: boolean;
  two_factor_secret: string;
  created_at: string;
  updated_at: string;
}

export function userFromRow(row: Pick<UserRow, "id" | "name" | "email" | "phone" | "role" | "is_active" | "created_at" | "updated_at">) {
  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? "",
    role: row.role as "USER" | "ADMIN",
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface AddressRow {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  type: "HOME" | "WORK" | "OTHER";
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function addressFromRow(row: AddressRow) {
  return {
    _id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 ?? "",
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    landmark: row.landmark ?? "",
    type: row.type,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CouponRow {
  id: string;
  code: string;
  description: string;
  discount_type: "PERCENTAGE" | "FIXED";
  discount_value: number;
  minimum_order: number;
  maximum_discount: number;
  expiry_date: string;
  usage_limit: number;
  used_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function couponFromRow(row: CouponRow) {
  return {
    _id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value) || 0,
    minimumOrder: Number(row.minimum_order) || 0,
    maximumDiscount: Number(row.maximum_discount) || 0,
    expiryDate: row.expiry_date,
    usageLimit: row.usage_limit,
    usedCount: row.used_count,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ReviewRow {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

export interface OrderRow {
  id: string;
  order_id: string;
  user_id: string;
  subtotal: number;
  discount: number;
  coupon_code: string;
  shipping: number;
  total: number;
  payment_status: string;
  payment_id: string;
  order_status: string;
  address: Record<string, unknown>;
  shipping_method: string;
  estimated_delivery: string;
  created_at: string;
  updated_at: string;
}

export function orderItemFromRow(row: OrderItemRow) {
  return {
    productId: row.product_id ?? "",
    name: row.name,
    price: Number(row.price) || 0,
    image: row.image ?? "",
    size: row.size ?? "",
    color: row.color ?? "",
    quantity: row.quantity,
  };
}

export function orderFromRow(
  row: OrderRow,
  items: ReturnType<typeof orderItemFromRow>[],
  userIdPopulated?: { _id: string; name: string; email: string; phone: string } | null
) {
  return {
    _id: row.id,
    orderId: row.order_id,
    userId: userIdPopulated ?? row.user_id,
    items,
    subtotal: Number(row.subtotal) || 0,
    discount: Number(row.discount) || 0,
    couponCode: row.coupon_code || "",
    shipping: Number(row.shipping) || 0,
    total: Number(row.total) || 0,
    paymentStatus: row.payment_status,
    paymentId: row.payment_id || "",
    orderStatus: row.order_status,
    address: row.address,
    shippingMethod: row.shipping_method,
    estimatedDelivery: row.estimated_delivery,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string | null;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

export function cartItemFromRow(row: CartItemRow) {
  return {
    productId: row.product_id ?? "",
    name: row.name,
    price: Number(row.price) || 0,
    image: row.image ?? "",
    size: row.size ?? "",
    color: row.color ?? "",
    quantity: row.quantity,
  };
}

export interface CartCheckoutRow {
  cart_id: string;
  address_id: string;
  shipping_method: "STANDARD" | "EXPRESS";
  coupon_code: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  razorpay_order_id: string;
  created_at: string;
}

export function cartCheckoutFromRow(row: CartCheckoutRow) {
  return {
    addressId: row.address_id,
    shippingMethod: row.shipping_method,
    couponCode: row.coupon_code || undefined,
    subtotal: Number(row.subtotal) || 0,
    discount: Number(row.discount) || 0,
    shipping: Number(row.shipping) || 0,
    total: Number(row.total) || 0,
    razorpayOrderId: row.razorpay_order_id,
    createdAt: row.created_at,
  };
}

/** Escape LIKE special characters for ILIKE searches. */
export function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

/** Build a PostgREST `or` filter for ilike search across the given columns. */
export function buildTextSearch(term: string, columns: string[]): string {
  const escaped = escapeLike(term.trim());
  return columns
    .map((col) => `${col}.ilike.%${escaped}%`)
    .join(",");
}