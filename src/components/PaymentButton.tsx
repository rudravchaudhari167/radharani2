"use client";

import { useState } from "react";
import { ShieldCheck, Lock } from "lucide-react";

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
const THEME_COLOR = "#2D4A6B"; // Luxury royal blue accent

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window !== "undefined" && window.Razorpay) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
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
      onFailure("Unable to initialise payment. Please check required details.");
      return;
    }

    setLoading(true);

    if (sandbox) {
      // Dev Sandbox simulation when test credentials are placeholders
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const orderId =
        propOrderId ||
        String(
          (typeof window !== "undefined" &&
            (window as unknown as Record<string, unknown>).__vrindavOrderId) ||
            `sandbox_${Date.now()}`
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
        onFailure("Could not load the payment gateway. Please check your internet connection.");
        setLoading(false);
        return;
      }

      const options: Record<string, unknown> = {
        key: keyId,
        amount: amountInPaise,
        currency: "INR",
        name: "Radha Rani",
        description: orderDetails.description || "Divine Style. Eternal Bond.",
        order_id: propOrderId || undefined, // Binds payment to server order for UPI/Cards/NetBanking
        prefill: {
          name: orderDetails.prefill.name || "",
          email: orderDetails.prefill.email || "",
          contact: orderDetails.prefill.contact || "",
        },
        theme: {
          color: THEME_COLOR,
          backdrop_color: "#FAF9F6",
        },
        modal: {
          ondismiss: () => {
            onFailure("Payment was cancelled by the user.");
          },
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
            onFailure("Payment could not be verified. Please check your account or contact support.");
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch {
      onFailure("An error occurred while opening the payment gateway. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (invalid) {
    return null;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-8 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-sm transition-all hover:bg-[var(--color-accent-light)] disabled:opacity-60"
      >
        {loading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Lock size={14} />
            <span>Pay ₹{amount.toLocaleString("en-IN")} via Razorpay</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-3 text-[11px] text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1">
          <ShieldCheck size={13} className="text-[var(--color-accent)]" />
          UPI, Cards, NetBanking, Wallets
        </span>
        <span>&bull;</span>
        <span>256-Bit SSL Encrypted</span>
      </div>
    </div>
  );
}
