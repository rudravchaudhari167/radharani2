"use client";

import { useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export interface PaymentOrderDetails {
  description?: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

interface PaymentButtonProps {
  amount: number;
  orderDetails: PaymentOrderDetails;
  razorpayOrderId?: string;
  sandbox?: boolean;
  onSuccess: (payload: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }) => void;
  onFailure: (message: string) => void;
}

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const THEME_COLOR = "#7c3aed";

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window !== "undefined" && window.Razorpay) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentButton({
  amount,
  orderDetails,
  razorpayOrderId: propOrderId = "",
  sandbox = false,
  onSuccess,
  onFailure,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const keyId =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      : "";

  const amountInPaise = Math.round(amount * 100);

  const invalid =
    (!sandbox && (!keyId || !Number.isFinite(amount) || amount <= 0)) ||
    !orderDetails?.prefill;

  const handlePayment = async () => {
    if (invalid) {
      onFailure("Unable to initialise payment. Please try again.");
      return;
    }

    setLoading(true);

    if (sandbox) {
      // Development sandbox — simulates the payment provider handshake so the
      // full journey is testable without live Razorpay credentials.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const orderId =
        propOrderId ||
        String(
          (typeof window !== "undefined" &&
            (window as unknown as Record<string, unknown>).__vrindavOrderId) ||
            "",
        );
      onSuccess({
        razorpayPaymentId: `sandbox_pay_${Date.now()}`,
        razorpayOrderId: orderId,
        razorpaySignature: `sandbox_sig_${Date.now()}`,
      });
      setLoading(false);
      return;
    }

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        onFailure(
          "Could not load the payment gateway. Please check your connection.",
        );
        return;
      }

      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: "INR",
        name: "Radha Rani",
        description:
          orderDetails.description || "Your divine order at Radha Rani",
        prefill: {
          name: orderDetails.prefill.name || "",
          email: orderDetails.prefill.email || "",
          contact: orderDetails.prefill.contact || "",
        },
        theme: {
          color: THEME_COLOR,
        },
        handler: (response: {
          razorpay_payment_id?: string;
          razorpay_order_id?: string;
          razorpay_signature?: string;
        }) => {
          if (
            response?.razorpay_payment_id &&
            response?.razorpay_order_id &&
            response?.razorpay_signature
          ) {
            onSuccess({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
          } else {
            onFailure(
              "Payment could not be verified. Please check your transactions.",
            );
          }
        },
        modal: {
          ondismiss: () => {
            onFailure("Payment was cancelled.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch {
      onFailure(
        "A network error occurred while processing your payment. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (invalid) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={loading}
      className="btn btn-primary h-12 w-full rounded-2xl text-base font-bold disabled:opacity-70"
    >
      {loading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Processing payment...
        </>
      ) : sandbox ? (
        <>Simulate Test Payment (₹{amount.toLocaleString("en-IN")})</>
      ) : (
        <>Pay ₹{amount.toLocaleString("en-IN")} securely</>
      )}
    </button>
  );
}
