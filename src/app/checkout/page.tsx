"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Home,
  Briefcase,
  MapPin,
  LoaderCircle,
  Tag,
  Truck,
  Zap,
  Plus,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  X,
  Check,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useCartStore, type CartItem } from "@/lib/cart-store";
import { useToastStore } from "@/lib/toast-store";
import PaymentButton, {
  type PaymentOrderDetails,
} from "@/components/PaymentButton";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FREE_SHIPPING_THRESHOLD = 1999;
const STANDARD_SHIPPING = 99;
const EXPRESS_SHIPPING = 199;

interface Address {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  type: "HOME" | "WORK" | "OTHER";
  isDefault?: boolean;
}

type ShippingMethod = "STANDARD" | "EXPRESS";

interface CouponResult {
  valid: boolean;
  code?: string;
  discount?: number;
  description?: string;
}

interface NewAddressForm {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  type: "HOME" | "WORK" | "OTHER";
  isDefault: boolean;
}

const EMPTY_FORM: NewAddressForm = {
  fullName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  type: "HOME",
  isDefault: false,
};

type CheckoutPhase =
  | "details"
  | "payment"
  | "creating"
  | "processing"
  | "confirming";

function inr(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDateRange(method: ShippingMethod): string {
  const now = new Date();
  const min = new Date(now);
  const max = new Date(now);
  const [minDays, maxDays] = method === "EXPRESS" ? [1, 3] : [3, 7];
  min.setDate(min.getDate() + minDays);
  max.setDate(max.getDate() + maxDays);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${fmt(min)} – ${fmt(max)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);

  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  const cartItems = useCartStore((s) => s.items);
  const cartLoading = useCartStore((s) => s.loading);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [form, setForm] = useState<NewAddressForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [savingAddress, setSavingAddress] = useState(false);

  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("STANDARD");

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [phase, setPhase] = useState<CheckoutPhase>("details");
  const [verifying, setVerifying] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    razorpayOrderId: string;
    amount: number;
    key: string;
    sandbox: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loggedIn = Boolean(user);
  const gateLoading = !initialized;

  const subtotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cartItems],
  );

  const discount = coupon?.valid ? coupon.discount || 0 : 0;

  const shipping = useMemo(() => {
    if (shippingMethod === "EXPRESS") return EXPRESS_SHIPPING;
    if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
    return STANDARD_SHIPPING;
  }, [shippingMethod, subtotal]);

  const total = Math.max(0, subtotal - discount + shipping);

  const applyCartPrefill = useCallback(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        fullName: f.fullName || user.name || "",
        email: f.email || user.email || "",
        phone: f.phone || user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (gateLoading) return;
    if (!loggedIn) {
      router.replace("/login?redirect=/checkout");
      return;
    }
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateLoading, loggedIn]);

  useEffect(() => {
    if (!loggedIn || gateLoading) return;
    const load = async () => {
      setAddressesLoading(true);
      try {
        const res = await fetch("/api/addresses", { credentials: "include" });
        if (!res.ok) {
          setAddresses([]);
          return;
        }
        const data = (await res.json()) as { addresses?: Address[] };
        const list = data.addresses || [];
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSelectedAddressId(def._id);
        setShowAddressForm(list.length === 0);
      } catch {
        setAddresses([]);
        setShowAddressForm(true);
      } finally {
        setAddressesLoading(false);
        applyCartPrefill();
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, gateLoading]);

  const setField = (key: keyof NewAddressForm, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFormErrors((e) => {
      const next = { ...e };
      delete next[String(key)];
      return next;
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.fullName.trim()) errors.fullName = "Full name is required";
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(phoneDigits))
      errors.phone = "Enter a valid 10-digit phone number";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!EMAIL_REGEX.test(form.email.trim()))
      errors.email = "Enter a valid email address";
    if (!form.addressLine1.trim())
      errors.addressLine1 = "Street address is required";
    if (!form.city.trim()) errors.city = "City is required";
    if (!form.state.trim()) errors.state = "State is required";
    if (!/^\d{6}$/.test(form.pincode.trim()))
      errors.pincode = "Enter a valid 6-digit pincode";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveAddress = async () => {
    if (!validateForm()) return;
    setSavingAddress(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as {
        address?: Address;
        error?: string;
        fields?: Record<string, string>;
      };
      if (!res.ok || !data.address) {
        if (data.fields) setFormErrors(data.fields);
        addToast(data.error || "Could not save address", "error");
        return;
      }
      const created = data.address;
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created._id);
      setShowAddressForm(false);
      setForm(EMPTY_FORM);
      addToast("Address saved successfully", "success");
    } catch {
      addToast("Network error while saving address", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      addToast("Enter a coupon code", "info");
      return;
    }
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code, subtotal }),
      });
      const data = (await res.json()) as {
        valid?: boolean;
        discount?: number;
        error?: string;
        coupon?: { code?: string; description?: string };
      };
      if (!res.ok || !data.valid) {
        setCoupon(null);
        addToast(data.error || "Invalid coupon code", "error");
        return;
      }
      setCoupon({
        valid: true,
        code: data.coupon?.code || code.toUpperCase(),
        discount: data.discount,
        description: data.coupon?.description,
      });
      addToast("Coupon applied successfully", "success");
    } catch {
      addToast("Network error while applying coupon", "error");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
  };

  const proceedToPayment = async () => {
    setErrorMessage("");
    if (!selectedAddressId) {
      setErrorMessage("Please select or add a delivery address.");
      addToast("Please select a delivery address", "error");
      return;
    }
    setPhase("creating");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          addressId: selectedAddressId,
          shippingMethod,
          couponCode: coupon?.valid ? coupon.code : "",
        }),
      });
      const data = (await res.json()) as {
        razorpayOrderId?: string;
        amount?: number;
        key?: string;
        sandbox?: boolean;
        error?: string;
      };
      if (!res.ok || !data.razorpayOrderId || !data.amount || !data.key) {
        setPhase("details");
        setErrorMessage(data.error || "Could not start checkout. Please try again.");
        addToast(data.error || "Could not start checkout", "error");
        return;
      }
      setCheckoutData({
        razorpayOrderId: data.razorpayOrderId,
        amount: data.amount,
        key: data.key,
        sandbox: Boolean(data.sandbox),
      });
      if (data.sandbox && typeof window !== "undefined") {
        (window as unknown as Record<string, unknown>).__vrindavOrderId =
          data.razorpayOrderId;
      }
      setPhase("payment");
    } catch {
      setPhase("details");
      setErrorMessage("Network error while creating your order.");
      addToast("Network error while creating your order", "error");
    }
  };

  const handlePaymentSuccess = useCallback(
    async (payload: {
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature: string;
    }) => {
      setPhase("confirming");
      setVerifying(true);
      try {
        const res = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            razorpayOrderId: payload.razorpayOrderId,
            razorpayPaymentId: payload.razorpayPaymentId,
            razorpaySignature: payload.razorpaySignature,
          }),
        });
        const data = (await res.json()) as {
          order?: { orderId?: string };
          error?: string;
        };
        if (!res.ok || !data.order?.orderId) {
          setPhase("payment");
          setVerifying(false);
          setErrorMessage(
            data.error || "Payment verification failed. Please contact support.",
          );
          addToast(data.error || "Payment verification failed", "error");
          return;
        }
        const { clearCart } = useCartStore.getState();
        await clearCart();
        addToast("Payment successful! Order placed", "success");
        router.push(`/order-success?orderId=${encodeURIComponent(data.order.orderId)}`);
      } catch {
        setPhase("payment");
        setVerifying(false);
        setErrorMessage("Could not confirm your order. Please contact support.");
        addToast("Could not confirm your order", "error");
      }
    },
    [addToast, router],
  );

  const handlePaymentFailure = useCallback((message: string) => {
    setPhase("details");
    setVerifying(false);
    setErrorMessage(message);
    addToast(message, "error");
  }, [addToast]);

  const selectedAddress = addresses.find((a) => a._id === selectedAddressId);
  const paymentPrefill: PaymentOrderDetails = useMemo(
    () => ({
      description: `Order of ${cartItems.length} piece(s) from VRINDAV`,
      prefill: {
        name: selectedAddress?.fullName || user?.name || "",
        email: selectedAddress?.email || user?.email || "",
        contact: selectedAddress?.phone || user?.phone || "",
      },
    }),
    [cartItems.length, selectedAddress, user],
  );

  if (gateLoading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center px-4 pt-28 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle size={32} className="animate-spin text-[#2D4A6B]" />
          <p className="text-xs uppercase tracking-[0.25em] text-[#666666]">
            Securing Checkout…
          </p>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return null;
  }

  if (!cartLoading && cartItems.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-4 pt-28 text-center sm:px-6 lg:px-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F4F1EA] text-[#171717]">
          <ShoppingBag size={32} strokeWidth={1.5} />
        </div>
        <h1 className="font-serif text-2xl font-light text-[#171717] sm:text-3xl">
          Your shopping bag is empty
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[#666666]">
          You have no garments or accessories selected for checkout. Explore the
          latest collection and discover pieces crafted for eternity.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 bg-[#171717] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all hover:bg-[#2D4A6B]"
        >
          Explore Collection
          <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-28 pt-24 text-[#171717]">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header & Breadcrumb */}
        <div className="mb-10 border-b border-[#E7E3DC] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2D4A6B]">
                <ShieldCheck size={14} />
                Encrypted & Secure Checkout
              </p>
              <h1 className="mt-2 font-serif text-3xl font-light tracking-tight text-[#171717] sm:text-4xl">
                Checkout
              </h1>
            </div>
            {/* Step numbers */}
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-[#666666]">
              <span
                className={`flex items-center gap-1.5 font-medium ${
                  phase === "details" ? "text-[#171717] font-semibold" : ""
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#171717] text-[10px] text-white">
                  1
                </span>
                Shipping
              </span>
              <span className="h-px w-6 bg-[#E7E3DC]" />
              <span
                className={`flex items-center gap-1.5 font-medium ${
                  phase === "payment" ? "text-[#171717] font-semibold" : ""
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    phase === "payment"
                      ? "bg-[#171717] text-white"
                      : "bg-[#E7E3DC] text-[#666666]"
                  }`}
                >
                  2
                </span>
                Payment
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_420px]">
          {/* LEFT column */}
          <div className="space-y-10">
            {/* 1. Delivery Information */}
            <section className="rounded-sm border border-[#E7E3DC] bg-white p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E3DC] pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF9F6] text-xs font-semibold text-[#171717]">
                    1
                  </span>
                  <h2 className="font-serif text-lg font-medium text-[#171717]">
                    Delivery Address
                  </h2>
                </div>
                {!showAddressForm && addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(true);
                      setFormErrors({});
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#2D4A6B] hover:underline"
                  >
                    <Plus size={14} />
                    Add New Address
                  </button>
                )}
              </div>

              {addressesLoading ? (
                <div className="space-y-3">
                  <div className="h-20 w-full animate-pulse rounded bg-[#F4F1EA]" />
                  <div className="h-20 w-full animate-pulse rounded bg-[#F4F1EA]" />
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {!showAddressForm && addresses.length > 0 && (
                      <motion.div
                        key="address-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                      >
                        {addresses.map((addr) => {
                          const active = selectedAddressId === addr._id;
                          const TypeIcon =
                            addr.type === "WORK"
                              ? Briefcase
                              : addr.type === "OTHER"
                              ? MapPin
                              : Home;
                          return (
                            <label
                              key={addr._id}
                              className={`relative flex cursor-pointer flex-col justify-between rounded-sm border p-4 transition-all ${
                                active
                                  ? "border-[#171717] bg-[#FAF9F6] shadow-sm"
                                  : "border-[#E7E3DC] bg-white hover:border-[#CCCCCC]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="address"
                                    value={addr._id}
                                    checked={active}
                                    onChange={() => setSelectedAddressId(addr._id)}
                                    className="accent-[#171717]"
                                  />
                                  <p className="text-sm font-semibold text-[#171717]">
                                    {addr.fullName}
                                  </p>
                                </div>
                                <span className="flex items-center gap-1 rounded bg-[#F4F1EA] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#666666]">
                                  <TypeIcon size={11} />
                                  {addr.type}
                                </span>
                              </div>

                              <p className="mt-3 text-xs leading-relaxed text-[#666666]">
                                {addr.addressLine1}
                                {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                                {addr.landmark ? ` (${addr.landmark})` : ""}
                                <br />
                                {addr.city}, {addr.state} – {addr.pincode}
                              </p>

                              <div className="mt-3 flex items-center justify-between border-t border-[#E7E3DC] pt-2 text-[11px] text-[#666666]">
                                <span>{addr.phone}</span>
                                {addr.isDefault && (
                                  <span className="font-semibold uppercase tracking-wider text-[#2D4A6B]">
                                    Default
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showAddressForm && (
                      <motion.div
                        key="address-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-sm border border-[#E7E3DC] bg-[#FAF9F6] p-6">
                          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#171717]">
                            Enter Delivery Address
                          </h3>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <InputField
                              label="Full Name"
                              value={form.fullName}
                              onChange={(v) => setField("fullName", v)}
                              placeholder="e.g. Meera Sharma"
                              error={formErrors.fullName}
                            />
                            <InputField
                              label="Phone Number"
                              value={form.phone}
                              onChange={(v) =>
                                setField("phone", v.replace(/\D/g, "").slice(0, 10))
                              }
                              placeholder="10-digit mobile number"
                              error={formErrors.phone}
                              inputMode="numeric"
                            />
                            <InputField
                              label="Email"
                              value={form.email}
                              onChange={(v) => setField("email", v)}
                              placeholder="you@example.com"
                              error={formErrors.email}
                              className="sm:col-span-2"
                            />
                            <InputField
                              label="Street Address / Flat / Floor"
                              value={form.addressLine1}
                              onChange={(v) => setField("addressLine1", v)}
                              placeholder="House or flat number, building name, street"
                              error={formErrors.addressLine1}
                              className="sm:col-span-2"
                            />
                            <InputField
                              label="Apartment, Suite, Area (Optional)"
                              value={form.addressLine2}
                              onChange={(v) => setField("addressLine2", v)}
                              placeholder="Colony, sector, locality"
                              className="sm:col-span-2"
                            />
                            <InputField
                              label="Landmark (Optional)"
                              value={form.landmark}
                              onChange={(v) => setField("landmark", v)}
                              placeholder="Nearby landmark"
                            />
                            <InputField
                              label="City"
                              value={form.city}
                              onChange={(v) => setField("city", v)}
                              placeholder="e.g. New Delhi"
                              error={formErrors.city}
                            />
                            <InputField
                              label="State"
                              value={form.state}
                              onChange={(v) => setField("state", v)}
                              placeholder="e.g. Delhi"
                              error={formErrors.state}
                            />
                            <InputField
                              label="Pincode"
                              value={form.pincode}
                              onChange={(v) =>
                                setField("pincode", v.replace(/\D/g, "").slice(0, 6))
                              }
                              placeholder="6-digit postal code"
                              error={formErrors.pincode}
                              inputMode="numeric"
                            />
                          </div>

                          <div className="mt-5 flex flex-wrap items-center gap-6">
                            <label className="flex items-center gap-2 text-xs font-medium text-[#666666]">
                              <span className="uppercase tracking-wider">Type:</span>
                              <select
                                value={form.type}
                                onChange={(e) =>
                                  setField(
                                    "type",
                                    e.target.value as "HOME" | "WORK" | "OTHER",
                                  )
                                }
                                className="rounded border border-[#E7E3DC] bg-white px-3 py-1.5 text-xs text-[#171717] focus:border-[#171717] focus:outline-none"
                              >
                                <option value="HOME">Home</option>
                                <option value="WORK">Work</option>
                                <option value="OTHER">Other</option>
                              </select>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-[#666666]">
                              <input
                                type="checkbox"
                                checked={form.isDefault}
                                onChange={(e) => setField("isDefault", e.target.checked)}
                                className="h-4 w-4 accent-[#171717]"
                              />
                              Save as default address
                            </label>
                          </div>

                          <div className="mt-6 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={saveAddress}
                              disabled={savingAddress}
                              className="inline-flex items-center gap-2 bg-[#171717] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#2D4A6B] disabled:opacity-50"
                            >
                              {savingAddress ? (
                                <>
                                  <LoaderCircle size={14} className="animate-spin" />
                                  Saving…
                                </>
                              ) : (
                                "Save & Use Address"
                              )}
                            </button>
                            {addresses.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddressForm(false);
                                  setFormErrors({});
                                }}
                                className="border border-[#E7E3DC] px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-[#666666] hover:text-[#171717]"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </section>

            {/* 2. Shipping Method */}
            <section className="rounded-sm border border-[#E7E3DC] bg-white p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3 border-b border-[#E7E3DC] pb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF9F6] text-xs font-semibold text-[#171717]">
                  2
                </span>
                <h2 className="font-serif text-lg font-medium text-[#171717]">
                  Shipping Method
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ShippingCard
                  active={shippingMethod === "STANDARD"}
                  onClick={() => setShippingMethod("STANDARD")}
                  icon={<Truck size={18} />}
                  title="Standard Delivery"
                  sub="3–7 business days"
                  price={
                    subtotal >= FREE_SHIPPING_THRESHOLD &&
                    shippingMethod === "STANDARD"
                      ? "FREE"
                      : "₹99"
                  }
                  meta={formatDateRange("STANDARD")}
                />
                <ShippingCard
                  active={shippingMethod === "EXPRESS"}
                  onClick={() => setShippingMethod("EXPRESS")}
                  icon={<Zap size={18} />}
                  title="Express Priority"
                  sub="1–3 business days"
                  price="₹199"
                  meta={formatDateRange("EXPRESS")}
                />
              </div>
              <p className="mt-3 text-[11px] text-[#666666]">
                Estimated delivery window: {formatDateRange(shippingMethod)}. Free
                standard delivery on orders over {inr(FREE_SHIPPING_THRESHOLD)}.
              </p>
            </section>

            {/* 3. Payment Step */}
            <section className="rounded-sm border border-[#E7E3DC] bg-white p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3 border-b border-[#E7E3DC] pb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF9F6] text-xs font-semibold text-[#171717]">
                  3
                </span>
                <h2 className="font-serif text-lg font-medium text-[#171717]">
                  Payment Method
                </h2>
              </div>

              <AnimatePresence mode="wait">
                {phase !== "payment" ? (
                  <motion.div
                    key="step-proceed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center justify-between rounded-sm border border-[#E7E3DC] bg-[#FAF9F6] p-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-[#666666]">
                          Payable Amount
                        </p>
                        <p className="mt-0.5 text-2xl font-semibold text-[#171717]">
                          {inr(total)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#666666]">
                        <CreditCard size={16} />
                        <span>UPI / Cards / NetBanking</span>
                      </div>
                    </div>

                    {errorMessage && phase !== "creating" && (
                      <p className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        {errorMessage}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={proceedToPayment}
                      disabled={phase === "creating"}
                      className="inline-flex h-13 w-full items-center justify-center gap-2 bg-[#171717] px-8 text-xs font-semibold uppercase tracking-[0.22em] text-white transition-all hover:bg-[#2D4A6B] disabled:opacity-60"
                    >
                      {phase === "creating" ? (
                        <>
                          <LoaderCircle size={16} className="animate-spin" />
                          Initiating Order…
                        </>
                      ) : (
                        <>
                          Proceed to Payment ({inr(total)})
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step-razorpay"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {verifying ? (
                      <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-[#E7E3DC] bg-[#FAF9F6] py-10 text-center">
                        <LoaderCircle size={28} className="animate-spin text-[#2D4A6B]" />
                        <p className="text-xs uppercase tracking-[0.2em] text-[#666666]">
                          Verifying Payment with Bank…
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-sm border border-[#2D4A6B]/30 bg-[#2D4A6B]/5 p-4 text-xs text-[#2D4A6B]">
                          <p className="font-semibold uppercase tracking-wider">
                            Ready to pay {inr(total)}
                          </p>
                          <p className="mt-1 text-[#666666]">
                            Complete your transaction securely via Razorpay (UPI,
                            Credit/Debit Cards, NetBanking, or Wallets).
                          </p>
                        </div>

                        {errorMessage && (
                          <p className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                            {errorMessage}
                          </p>
                        )}

                        <PaymentButton
                          amount={
                            checkoutData?.amount
                              ? checkoutData.amount / 100
                              : total
                          }
                          razorpayOrderId={checkoutData?.razorpayOrderId}
                          sandbox={Boolean(checkoutData?.sandbox)}
                          orderDetails={paymentPrefill}
                          onSuccess={handlePaymentSuccess}
                          onFailure={handlePaymentFailure}
                        />

                        {checkoutData?.sandbox && (
                          <p className="text-center text-[11px] text-[#666666]">
                            Sandbox Mode Active — Test transaction only.
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setPhase("details");
                            setVerifying(false);
                            setCheckoutData(null);
                            setErrorMessage("");
                          }}
                          className="w-full text-center text-xs font-medium uppercase tracking-[0.15em] text-[#666666] hover:text-[#171717]"
                        >
                          ← Change Address or Shipping
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>

          {/* RIGHT column: Order Summary */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-sm border border-[#E7E3DC] bg-white p-6 sm:p-7">
              <h2 className="border-b border-[#E7E3DC] pb-4 font-serif text-lg font-medium text-[#171717]">
                Order Summary
              </h2>

              {/* Items */}
              <div className="max-h-72 space-y-4 overflow-y-auto py-4">
                {cartItems.map((item) => (
                  <SummaryItem
                    key={`${item.productId}-${item.size}-${item.color}`}
                    item={item}
                  />
                ))}
              </div>

              {/* Coupon */}
              <div className="border-t border-[#E7E3DC] pt-5">
                {coupon?.valid ? (
                  <div className="flex items-center justify-between rounded-sm border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                        <Tag size={13} />
                        {coupon.code} Applied
                      </p>
                      {coupon.description && (
                        <p className="text-[11px] text-emerald-700">
                          {coupon.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      aria-label="Remove coupon"
                      className="p-1 text-emerald-700 hover:text-emerald-900"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      placeholder="Promotional code"
                      className="w-full rounded-sm border border-[#E7E3DC] bg-[#FAF9F6] px-3.5 py-2 text-xs uppercase tracking-wider text-[#171717] placeholder:normal-case placeholder:tracking-normal placeholder:text-[#999999] focus:border-[#171717] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading}
                      className="border border-[#171717] px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-[#171717] hover:bg-[#171717] hover:text-white disabled:opacity-50"
                    >
                      {couponLoading ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 border-t border-[#E7E3DC] pt-5 text-xs">
                <div className="flex justify-between text-[#666666]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#171717]">
                    {inr(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[#666666]">
                  <span>
                    Shipping (
                    {shippingMethod === "EXPRESS" ? "Express" : "Standard"})
                  </span>
                  <span className="font-medium text-[#171717]">
                    {shipping === 0 ? (
                      <span className="font-semibold text-emerald-600">
                        FREE
                      </span>
                    ) : (
                      inr(shipping)
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Promotional Discount</span>
                    <span className="font-semibold">-{inr(discount)}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t border-[#E7E3DC] pt-4">
                  <span className="font-serif text-base font-medium text-[#171717]">
                    Total
                  </span>
                  <span className="text-xl font-semibold text-[#171717]">
                    {inr(total)}
                  </span>
                </div>
              </div>

              {/* Trust Footer */}
              <div className="mt-6 border-t border-[#E7E3DC] pt-4 text-center">
                <p className="text-[11px] text-[#666666]">
                  Complimentary luxury gift packaging on all orders.
                  <br />
                  Easy 7-day exchanges & returns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Local components ------------------------- */

function InputField({
  label,
  value,
  onChange,
  placeholder,
  error,
  className = "",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  inputMode?: "text" | "numeric";
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-sm border bg-white px-3.5 py-2.5 text-xs text-[#171717] placeholder:text-[#999999] focus:outline-none ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-[#E7E3DC] focus:border-[#171717]"
        }`}
      />
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

function ShippingCard({
  active,
  onClick,
  icon,
  title,
  sub,
  price,
  meta,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  sub: string;
  price: string;
  meta: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-sm border p-4 text-left transition-all ${
        active
          ? "border-[#171717] bg-[#FAF9F6] shadow-sm"
          : "border-[#E7E3DC] bg-white hover:border-[#CCCCCC]"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          active
            ? "bg-[#171717] text-white"
            : "bg-[#F4F1EA] text-[#666666]"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#171717]">{title}</span>
          <span
            className={`text-xs font-bold ${
              price === "FREE" ? "text-emerald-600" : "text-[#171717]"
            }`}
          >
            {price}
          </span>
        </div>
        <span className="mt-0.5 block text-[11px] text-[#666666]">{sub}</span>
        <span className="mt-1 block text-[10px] uppercase tracking-wider text-[#2D4A6B]">
          Est: {meta}
        </span>
      </div>
    </button>
  );
}

function SummaryItem({ item }: { item: CartItem }) {
  return (
    <div className="flex gap-3">
      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-sm border border-[#E7E3DC] bg-[#FAF9F6]">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#666666]">
            <ShoppingBag size={16} />
          </div>
        )}
        <span className="absolute bottom-0 right-0 flex h-4 min-w-4 items-center justify-center bg-[#171717] px-1 text-[9px] font-bold text-white">
          {item.quantity}×
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-[#171717]">
          {item.name}
        </p>
        <p className="text-[11px] text-[#666666]">
          {item.size && `Size ${item.size}`}
          {item.size && item.color ? " · " : ""}
          {item.color}
        </p>
        <p className="mt-1 text-xs font-semibold text-[#171717]">
          {inr(item.price * item.quantity)}
        </p>
      </div>
    </div>
  );
}
