"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Plus,
  Trash2,
  Pencil,
  Check,
  Home,
  Briefcase,
  X,
  LoaderCircle,
  Phone,
  Mail,
} from "lucide-react";
import AccountLayout from "@/components/AccountLayout";
import { useAuthStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast-store";

interface Address {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  type: "HOME" | "WORK" | "OTHER";
  isDefault?: boolean;
}

type AddressForm = Omit<Address, "_id">;

const EMPTY_FORM: AddressForm = {
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

const TYPE_ICONS: Record<string, typeof Home> = {
  HOME: Home,
  WORK: Briefcase,
  OTHER: MapPin,
};

const TYPE_COLORS: Record<string, string> = {
  HOME: "bg-emerald-500/15 text-emerald-400",
  WORK: "bg-sky-500/15 text-sky-400",
  OTHER: "bg-amber-500/15 text-amber-400",
};

function validateForm(form: AddressForm): string | null {
  if (!form.fullName.trim()) return "Full name is required";
  if (!/^\d{10}$/.test(form.phone)) return "Phone must be 10 digits";
  if (!form.addressLine1.trim()) return "Address line 1 is required";
  if (!form.city.trim()) return "City is required";
  if (!form.state.trim()) return "State is required";
  if (!/^\d{6}$/.test(form.pincode)) return "Pincode must be 6 digits";
  return null;
}

function AddressSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass-card p-6">
          <div className="flex items-start gap-4">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-3">
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-3/4" />
              <div className="skeleton h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AddressFormModal({
  form,
  setForm,
  onSave,
  onClose,
  saving,
  editMode,
}: {
  form: AddressForm;
  setForm: (f: AddressForm) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  editMode: boolean;
}) {
  const [errors, setErrors] = useState<string | null>(null);

  const update = (field: keyof AddressForm, value: string | boolean) => {
    setForm({ ...form, [field]: value });
  };

  const handleSave = () => {
    const err = validateForm(form);
    if (err) {
      setErrors(err);
      return;
    }
    setErrors(null);
    onSave();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-2xl text-[var(--color-text)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <h3 className="text-lg font-bold text-[var(--color-text)]">{editMode ? "Edit Address" : "Add New Address"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>

        {errors && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errors}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Full Name *
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[#FAF9F6] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] outline-none transition-colors focus:bg-white focus:border-[#2D4A6B] focus:ring-1 focus:ring-[#2D4A6B]/30"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Phone *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[#FAF9F6] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] outline-none transition-colors focus:bg-white focus:border-[#2D4A6B] focus:ring-1 focus:ring-[#2D4A6B]/30"
                placeholder="10-digit phone"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Email
            </label>
            <input
              type="email"
              value={form.email || ""}
              onChange={(e) => update("email", e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[#FAF9F6] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] outline-none transition-colors focus:bg-white focus:border-[#2D4A6B] focus:ring-1 focus:ring-[#2D4A6B]/30"
              placeholder="Email (optional)"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Address Line 1 *
            </label>
            <input
              type="text"
              value={form.addressLine1}
              onChange={(e) => update("addressLine1", e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[#FAF9F6] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] outline-none transition-colors focus:bg-white focus:border-[#2D4A6B] focus:ring-1 focus:ring-[#2D4A6B]/30"
              placeholder="House no., Street, Area"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Address Line 2
            </label>
            <input
              type="text"
              value={form.addressLine2 || ""}
              onChange={(e) => update("addressLine2", e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[#FAF9F6] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] outline-none transition-colors focus:bg-white focus:border-[#2D4A6B] focus:ring-1 focus:ring-[#2D4A6B]/30"
              placeholder="Landmark, Colony (optional)"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                City *
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[#FAF9F6] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] outline-none transition-colors focus:bg-white focus:border-[#2D4A6B] focus:ring-1 focus:ring-[#2D4A6B]/30"
                placeholder="City"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                State *
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[#FAF9F6] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] outline-none transition-colors focus:bg-white focus:border-[#2D4A6B] focus:ring-1 focus:ring-[#2D4A6B]/30"
                placeholder="State"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Pincode *
              </label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[#FAF9F6] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] outline-none transition-colors focus:bg-white focus:border-[#2D4A6B] focus:ring-1 focus:ring-[#2D4A6B]/30"
                placeholder="6-digit pincode"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Landmark
              </label>
              <input
                type="text"
                value={form.landmark || ""}
                onChange={(e) => update("landmark", e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[#FAF9F6] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] outline-none transition-colors focus:bg-white focus:border-[#2D4A6B] focus:ring-1 focus:ring-[#2D4A6B]/30"
                placeholder="Near ... (optional)"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Type
              </label>
              <div className="flex gap-2">
                {(["HOME", "WORK", "OTHER"] as const).map((t) => {
                  const Icon = TYPE_ICONS[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update("type", t)}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                        form.type === t
                          ? "bg-[#2D4A6B] text-white shadow-xs"
                          : "border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[#2D4A6B]"
                      }`}
                    >
                      <Icon size={12} />
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                form.isDefault
                  ? "border-[#2D4A6B] bg-[#2D4A6B]"
                  : "border-[var(--color-border)] bg-white"
              }`}
              onClick={() => update("isDefault", !form.isDefault)}
            >
              {form.isDefault && <Check size={12} className="text-white" />}
            </div>
            <span className="text-[var(--color-text)]">Set as default address</span>
          </label>
        </div>

        <div className="mt-6 flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-white py-2.5 text-sm font-medium text-[#666666] transition-colors hover:bg-[#FAF9F6] hover:text-[#171717]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-[#2D4A6B] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3D5A7B] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {editMode ? "Update" : "Save"} Address
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ConfirmDelete({
  onConfirm,
  onCancel,
  deleting,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-white p-6 text-center shadow-2xl text-[var(--color-text)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Trash2 size={24} />
        </div>
        <h3 className="text-lg font-bold text-[var(--color-text)]">Delete Address?</h3>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          This action cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-white py-2.5 text-sm font-medium text-[#666666] transition-colors hover:bg-[#FAF9F6] hover:text-[#171717]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {deleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AddressesPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loggedIn = Boolean(user);
  const gateLoading = !initialized;

  const refreshAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/addresses", { credentials: "include" });
      const data = (await res.json()) as { addresses?: Address[] };
      if (res.ok) setAddresses(data.addresses || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (gateLoading) return;
    if (!loggedIn) {
      router.replace("/login?redirect=/account/addresses");
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/addresses", { credentials: "include" });
        const data = (await res.json()) as { addresses?: Address[] };
        if (active && res.ok) setAddresses(data.addresses || []);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [loggedIn, gateLoading, router]);

  const openAddForm = () => {
    setEditAddress(null);
    setForm({ ...EMPTY_FORM });
    setFormOpen(true);
  };

  const openEditForm = (addr: Address) => {
    setEditAddress(addr);
    setForm({
      fullName: addr.fullName,
      phone: addr.phone,
      email: addr.email || "",
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      landmark: addr.landmark || "",
      type: addr.type,
      isDefault: addr.isDefault || false,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editAddress ? `/api/addresses/${editAddress._id}` : "/api/addresses";
      const method = editAddress ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { address?: Address; error?: string };
      if (!res.ok) {
        addToast(data.error || "Failed to save address", "error");
        return;
      }
      addToast(editAddress ? "Address updated" : "Address added", "success");
      setFormOpen(false);
      refreshAddresses();
    } catch {
      addToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/addresses/${deleteTarget._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        addToast(data.error || "Failed to delete", "error");
        return;
      }
      addToast("Address deleted", "success");
      setDeleteTarget(null);
      refreshAddresses();
    } catch {
      addToast("Network error. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleSetDefault = async (addr: Address) => {
    try {
      const res = await fetch(`/api/addresses/${addr._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...addr, isDefault: true }),
      });
      if (!res.ok) {
        addToast("Failed to update", "error");
        return;
      }
      addToast("Default address updated", "success");
      refreshAddresses();
    } catch {
      addToast("Network error", "error");
    }
  };

  if (gateLoading) {
    return (
      <AccountLayout activeKey="addresses">
        <AddressSkeleton />
      </AccountLayout>
    );
  }

  if (!loggedIn) return null;

  return (
    <AccountLayout activeKey="addresses">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-primary-light)]">
            <MapPin size={13} />
            Delivery Addresses
          </p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            My Addresses
          </h1>
        </div>
        <button type="button" onClick={openAddForm} className="btn btn-primary">
          <Plus size={16} />
          Add Address
        </button>
      </motion.div>

      {loading ? (
        <AddressSkeleton />
      ) : addresses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-card mx-auto max-w-lg p-10 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-secondary)]/20">
            <MapPin size={28} className="text-[var(--color-primary-light)]" />
          </div>
          <h2 className="text-xl font-bold">No addresses saved</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Add a delivery address to make checkout faster.
          </p>
          <button type="button" onClick={openAddForm} className="btn btn-primary mt-6">
            <Plus size={16} />
            Add Your First Address
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((addr, index) => {
            const Icon = TYPE_ICONS[addr.type] || MapPin;
            return (
              <motion.div
                key={addr._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 + index * 0.07 }}
                className={`glass-card relative overflow-hidden p-6 transition-all ${
                  addr.isDefault ? "border-[var(--color-primary-light)]/40 shadow-[0_0_24px_rgba(124,58,237,0.12)]" : ""
                }`}
              >
                {addr.isDefault && (
                  <div className="absolute right-4 top-4">
                    <span className="rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Default
                    </span>
                  </div>
                )}

                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/15">
                    <Icon size={18} className="text-[var(--color-primary-light)]" />
                  </div>
                  <div>
                    <p className="font-semibold">{addr.fullName}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TYPE_COLORS[addr.type] || ""}`}>
                      {addr.type}
                    </span>
                  </div>
                </div>

                <div className="mb-4 space-y-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  <p>{addr.addressLine1}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  {addr.landmark && <p>Near {addr.landmark}</p>}
                  <p>
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                </div>

                <div className="mb-4 flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1">
                    <Phone size={12} />
                    {addr.phone}
                  </span>
                  {addr.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} />
                      {addr.email}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(addr)}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white/5 px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] transition-all hover:border-[var(--color-primary-light)]/40 hover:text-[var(--color-text)]"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr)}
                      className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white/5 px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] transition-all hover:border-[var(--color-primary-light)]/40 hover:text-[var(--color-primary-light)]"
                    >
                      <Check size={12} />
                      Set Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(addr)}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white/5 px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] transition-all hover:border-[var(--color-secondary)]/40 hover:text-[var(--color-secondary)]"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {formOpen && (
          <AddressFormModal
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onClose={() => setFormOpen(false)}
            saving={saving}
            editMode={Boolean(editAddress)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <ConfirmDelete
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            deleting={deleting}
          />
        )}
      </AnimatePresence>
    </AccountLayout>
  );
}
