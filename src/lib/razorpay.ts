import crypto from "crypto";
import Razorpay from "razorpay";
import type { Orders } from "razorpay/dist/types/orders";

const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

/**
 * Lazily-initialized Razorpay client instance. Throws only when actually
 * invoked (never at module import) so builds are not broken by missing keys.
 */
let razorpayInstance: Razorpay | null = null;

export function getRazorpayInstance(): Razorpay {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error(
      "Please define NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables inside .env.local"
    );
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: KEY_ID,
      key_secret: KEY_SECRET,
    });
  }
  return razorpayInstance;
}

/**
 * Dev-only sandbox gate. Returns true when real Razorpay keys are NOT
 * configured (i.e. keys are the `.env.example` placeholders) so that the
 * full user journey can be tested locally without live payment provider
 * credentials. Never activates when real keys are present.
 */
export function isPaymentSandbox(): boolean {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  const placeholder = /xxxxxxxx/i;
  return placeholder.test(keyId) || placeholder.test(secret) || !keyId || !secret;
}

/**
 * Creates a new Razorpay order for the given amount (in paise) and receipt id.
 */
export async function createRazorpayOrder(
  amount: number,
  receipt: string
): Promise<Orders.RazorpayOrder> {
  const razorpay = getRazorpayInstance();

  const order = (await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt,
    payment_capture: true,
  } as Orders.RazorpayOrderCreateRequestBody)) as Orders.RazorpayOrder;

  return order;
}

/**
 * Verifies a Razorpay payment signature using the Razorpay webhook secret
 * validation algorithm. Returns true when valid, false otherwise.
 */
export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  const expectedSignature = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return safeTimingSafeEqual(expectedSignature, signature);
}

/**
 * Performs a string comparison that is safe against timing attacks while
 * guarding against length mismatches.
 */
function safeTimingSafeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}
