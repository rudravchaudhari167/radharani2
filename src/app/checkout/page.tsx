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
  const [minDays, maxDays] =
    method === "EXPRESS" ? [1, 3] : [3, 7];
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
      errors.email = "Enter a valid email";
    if (!form.addressLine1.trim())
      errors.addressLine1 = "Address line 1 is required";
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
      addToast("Address added successfully", "success");
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
      addToast("Coupon applied", "success");
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
      setErrorMessage("Please select a delivery address.");
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
          addToast(
            data.error || "Payment verification failed",
            "error",
          );
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
      description: `Order of ${cartItems.length} item(s) from Radha Rani`,
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
          <LoaderCircle size={40} className="animate-spin text-[var(--color-primary-light)]" />
          <div className="skeleton h-6 w-48" />
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return null;
  }

  if (!cartLoading && cartItems.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 pt-28 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] shadow-[0_0_40px_rgba(124,58,237,0.4)]"
        >
          <ShoppingBag size={44} className="text-white" />
        </motion.div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          Your cart is empty
        </h1>
        <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
          You have no items in your cart to checkout. Explore our divine
          collection and add something special.
        </p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Continue Shopping
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-primary-light)]">
          <ShieldCheck size={13} />
          Secure Checkout
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Complete your order
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
        {/* LEFT column */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="space-y-8"
        >
          {/* Delivery information */}
          <section className="glass-card p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <MapPin size={18} className="text-[var(--color-primary-light)]" />
                Delivery Information
              </h2>
              {!showAddressForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressForm(true);
                    setFormErrors({});
                  }}
                  className="btn btn-ghost gap-1.5 text-sm text-[var(--color-primary-light)]"
                >
                  <Plus size={15} />
                  Add new address
                </button>
              )}
            </div>

            {addressesLoading ? (
              <div className="space-y-3">
                <div className="skeleton h-24 w-full" />
                <div className="skeleton h-24 w-full" />
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
                      className="space-y-3"
                    >
                      {addresses.map((addr) => {
                        const active = selectedAddressId === addr._id;
                        const TypeIcon =
                          addr.type === "WORK" ? Briefcase : addr.type === "OTHER" ? MapPin : Home;
                        return (
                          <label
                            key={addr._id}
                            className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition-all ${
                              active
                                ? "border-[var(--color-primary-light)]/60 bg-[var(--color-primary)]/10 shadow-[0_0_20px_rgba(124,58,237,0.15)]"
                                : "border-[var(--color-border)] bg-white/[0.02] hover:border-[var(--color-border)] hover:bg-white/[0.05]"
                            }`}
                          >
                            <input
                              type="radio"
                              name="address"
                              value={addr._id}
                              checked={active}
                              onChange={() => setSelectedAddressId(addr._id)}
                              className="mt-1 accent-[var(--color-primary)]"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold">{addr.fullName}</p>
                                <span className="flex items-center gap-1 rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary-light)]">
                                  <TypeIcon size={11} />
                                  {addr.type}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                {addr.addressLine1}
                                {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                                {addr.landmark ? ` (${addr.landmark})` : ""}
                              </p>
                              <p className="text-sm text-[var(--color-text-muted)]">
                                {addr.city}, {addr.state} – {addr.pincode}
                              </p>
                              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                {addr.phone} · {addr.email}
                              </p>
                              {addr.isDefault && (
                                <span className="mt-2 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
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
                      transition={{ duration: 0.35 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-[var(--color-border)] bg-white/[0.02] p-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <InputField
                            label="Full Name"
                            value={form.fullName}
                            onChange={(v) => setField("fullName", v)}
                            placeholder="Enter full name"
                            error={formErrors.fullName}
                          />
                          <InputField
                            label="Phone"
                            value={form.phone}
                            onChange={(v) =>
                              setField("phone", v.replace(/\D/g, "").slice(0, 10))
                            }
                            placeholder="98765 43210"
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
                            label="Address Line 1"
                            value={form.addressLine1}
                            onChange={(v) => setField("addressLine1", v)}
                            placeholder="House no, street"
                            error={formErrors.addressLine1}
                            className="sm:col-span-2"
                          />
                          <InputField
                            label="Address Line 2 (optional)"
                            value={form.addressLine2}
                            onChange={(v) => setField("addressLine2", v)}
                            placeholder="Apartment, area"
                            className="sm:col-span-2"
                          />
                          <InputField
                            label="Landmark (optional)"
                            value={form.landmark}
                            onChange={(v) => setField("landmark", v)}
                            placeholder="Near..."
                          />
                          <InputField
                            label="City"
                            value={form.city}
                            onChange={(v) => setField("city", v)}
                            placeholder="City"
                            error={formErrors.city}
                          />
                          <InputField
                            label="State"
                            value={form.state}
                            onChange={(v) => setField("state", v)}
                            placeholder="State"
                            error={formErrors.state}
                          />
                          <InputField
                            label="Pincode"
                            value={form.pincode}
                            onChange={(v) =>
                              setField("pincode", v.replace(/\D/g, "").slice(0, 6))
                            }
                            placeholder="6-digit pincode"
                            error={formErrors.pincode}
                            inputMode="numeric"
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-4">
                          <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                            <select
                              value={form.type}
                              onChange={(e) =>
                                setField(
                                  "type",
                                  e.target.value as "HOME" | "WORK" | "OTHER",
                                )
                              }
                              className="rounded-lg border border-[var(--color-border)] bg-white/5 px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]"
                            >
                              <option value="HOME">HOME</option>
                              <option value="WORK">WORK</option>
                              <option value="OTHER">OTHER</option>
                            </select>
                          </label>
                          <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                            <input
                              type="checkbox"
                              checked={form.isDefault}
                              onChange={(e) => setField("isDefault", e.target.checked)}
                              className="h-4 w-4 accent-[var(--color-primary)]"
                            />
                            Set as default
                          </label>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={saveAddress}
                            disabled={savingAddress}
                            className="btn btn-primary"
                          >
                            {savingAddress ? (
                              <>
                                <LoaderCircle size={15} className="animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Plus size={15} />
                                Save Address
                              </>
                            )}
                          </button>
                          {addresses.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddressForm(false);
                                setFormErrors({});
                              }}
                              className="btn btn-ghost"
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

          {/* Shipping method */}
          <section className="glass-card p-6 sm:p-8">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
              <Truck size={18} className="text-[var(--color-primary-light)]" />
              Shipping Method
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ShippingOption
                active={shippingMethod === "STANDARD"}
                onClick={() => setShippingMethod("STANDARD")}
                icon={<Truck size={18} />}
                title="Standard"
                sub="3-7 business days"
                price={
                  subtotal >= FREE_SHIPPING_THRESHOLD && shippingMethod === "STANDARD"
                    ? "FREE"
                    : "₹99"
                }
                meta={formatDateRange("STANDARD")}
              />
              <ShippingOption
                active={shippingMethod === "EXPRESS"}
                onClick={() => setShippingMethod("EXPRESS")}
                icon={<Zap size={18} />}
                title="Express"
                sub="1-3 business days"
                price="₹199"
                meta={formatDateRange("EXPRESS")}
              />
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              Estimated delivery: {formatDateRange(shippingMethod)}
            </p>
          </section>

          {/* Payment */}
          <section className="glass-card p-6 sm:p-8">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
              <CreditCard size={18} className="text-[var(--color-primary-light)]" />
              Payment
            </h2>

            <AnimatePresence mode="wait">
              {phase !== "payment" ? (
                <motion.div
                  key="pay-button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mb-5 flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white/[0.03] p-4">
                    <span className="text-sm text-[var(--color-text-muted)]">
                      Order Total
                    </span>
                    <span className="text-2xl font-black text-[var(--color-text)]">
                      {inr(total)}
                    </span>
                  </div>

                  {errorMessage && phase !== "creating" && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 rounded-xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-4 py-3 text-sm text-[var(--color-secondary)]"
                    >
                      {errorMessage}
                    </motion.p>
                  )}

                  <button
                    type="button"
                    onClick={proceedToPayment}
                    disabled={phase === "creating"}
                    className="btn btn-primary h-12 w-full rounded-2xl text-base font-bold disabled:opacity-70"
                  >
                    {phase === "creating" ? (
                      <>
                        <LoaderCircle size={17} className="animate-spin" />
                        Creating order...
                      </>
                    ) : (
                      <>
                        Proceed to Pay {inr(total)}
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="razorpay"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {verifying ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white/[0.03] px-4 py-8 text-center">
                      <LoaderCircle size={28} className="animate-spin text-[var(--color-primary-light)]" />
                      <p className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        Confirming your order...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
                        <p className="font-semibold">Order ready for payment</p>
                        <p className="mt-1 text-emerald-300/80">
                          Total payable: {inr(total)} · Pay securely via UPI,
                          Card or Netbanking
                        </p>
                      </div>

                      {errorMessage && (
                        <motion.p
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-4 py-3 text-sm text-[var(--color-secondary)]"
                        >
                          {errorMessage}
                        </motion.p>
                      )}

                      <PaymentButton
                        amount={checkoutData?.amount ? checkoutData.amount / 100 : total}
                        razorpayOrderId={checkoutData?.razorpayOrderId}
                        sandbox={Boolean(checkoutData?.sandbox)}
                        orderDetails={paymentPrefill}
                        onSuccess={handlePaymentSuccess}
                        onFailure={handlePaymentFailure}
                      />
                      {checkoutData?.sandbox && (
                        <p className="mt-2 text-center text-xs text-[var(--color-text-muted)]">
                          Sandbox mode active — using placeholder payment keys.
                          No real charge will be made.
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
                        className="btn btn-ghost w-full text-sm"
                      >
                        Back to details
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </motion.div>

        {/* RIGHT column: Order summary */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:sticky lg:top-28 lg:self-start"
        >
          <div className="glass-card overflow-hidden">
            <div className="border-b border-[var(--color-border)] px-6 py-5">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <ShoppingBag size={18} className="text-[var(--color-primary-light)]" />
                Order Summary
              </h2>
            </div>

            <div className="max-h-72 space-y-4 overflow-y-auto px-6 py-5">
              {cartItems.map((item) => (
                <SummaryItem key={`${item.productId}-${item.size}-${item.color}`} item={item} />
              ))}
            </div>

            <div className="space-y-3 border-t border-[var(--color-border)] px-6 py-5">
              {/* Coupon */}
              {coupon?.valid ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                      <Tag size={14} />
                      {coupon.code}
                    </p>
                    {coupon.description && (
                      <p className="mt-0.5 text-xs text-emerald-300/80">
                        {coupon.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label="Remove coupon"
                    className="rounded-lg p-1 text-emerald-300 transition-colors hover:bg-emerald-500/20 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      placeholder="Coupon code"
                      className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 py-2.5 pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading}
                    className="btn btn-outline text-sm disabled:opacity-50"
                  >
                    {couponLoading ? (
                      <LoaderCircle size={15} className="animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              )}

              <div className="space-y-2 pt-1 text-sm">
                <div className="flex justify-between text-[var(--color-text-muted)]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[var(--color-text)]">
                    {inr(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--color-text-muted)]">
                  <span>Shipping ({shippingMethod === "EXPRESS" ? "Express" : "Standard"})</span>
                  <span className="font-medium text-[var(--color-text)]">
                    {shipping === 0 ? (
                      <span className="text-emerald-400">FREE</span>
                    ) : (
                      inr(shipping)
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span className="font-semibold">-{inr(discount)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                <span className="text-base font-bold">Total</span>
                <span className="bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-secondary)] bg-clip-text text-2xl font-black text-transparent">
                  {inr(total)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
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
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-xl border bg-white/5 px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 ${
          error
            ? "border-[var(--color-secondary)]/60 focus:border-[var(--color-secondary)] focus:ring-[var(--color-secondary)]/40"
            : "border-[var(--color-border)] focus:border-[var(--color-primary-light)] focus:ring-[var(--color-primary-light)]/40"
        }`}
      />
      {error && (
        <p className="mt-1.5 text-xs text-[var(--color-secondary)]">{error}</p>
      )}
    </div>
  );
}

function ShippingOption({
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
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
        active
          ? "border-[var(--color-primary-light)]/60 bg-[var(--color-primary)]/10 shadow-[0_0_20px_rgba(124,58,237,0.15)]"
          : "border-[var(--color-border)] bg-white/[0.02] hover:border-[var(--color-border)] hover:bg-white/[0.05]"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          active
            ? "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white"
            : "bg-white/5 text-[var(--color-text-muted)]"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-semibold">{title}</span>
          <span className={`text-sm font-bold ${active ? "text-[var(--color-primary-light)]" : "text-[var(--color-text)]"}`}>
            {price}
          </span>
        </span>
        <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">
          {sub}
        </span>
        <span className="mt-1 block text-[11px] text-[var(--color-text-muted)]">
          Est. {meta}
        </span>
      </span>
    </button>
  );
}

function SummaryItem({ item }: { item: CartItem }) {
  return (
    <div className="flex gap-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white/5">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
            <ShoppingBag size={18} />
          </div>
        )}
        <span className="absolute -right-0 bottom-0 flex h-5 min-w-5 items-center justify-center rounded-tl-lg bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white">
          {item.quantity}×
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.name}</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {item.size && `Size ${item.size}`}
          {item.size && item.color ? " · " : ""}
          {item.color}
        </p>
        <p className="mt-1 text-sm font-bold">
          {inr(item.price * item.quantity)}
        </p>
      </div>
    </div>
  );
}
