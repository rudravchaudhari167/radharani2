"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Shield,
  Bell,
  LogOut,
  LoaderCircle,
} from "lucide-react";
import AccountLayout from "@/components/AccountLayout";
import { useAuthStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast-store";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function SettingsPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const logout = useAuthStore((s) => s.logout);

  const loggedIn = Boolean(user);
  const gateLoading = !initialized;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);

  useEffect(() => {
    if (gateLoading) return;
    if (!loggedIn) {
      router.replace("/login?redirect=/account/settings");
    }
  }, [loggedIn, gateLoading, router]);

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      addToast("New password must be at least 8 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }
    if (!currentPassword) {
      addToast("Current password is required", "error");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        addToast(data.error || "Failed to change password", "error");
        return;
      }
      addToast("Password updated successfully", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      addToast("Network error. Please try again.", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    await logout();
    router.push("/");
  };

  if (gateLoading) {
    return (
      <AccountLayout activeKey="settings">
        <div className="space-y-6">
          <div className="skeleton h-8 w-48" />
          <div className="glass-card p-6">
            <div className="skeleton h-6 w-40" />
            <div className="mt-4 space-y-3">
              <div className="skeleton h-14 w-full" />
              <div className="skeleton h-14 w-full" />
            </div>
          </div>
        </div>
      </AccountLayout>
    );
  }

  if (!loggedIn || !user) return null;

  return (
    <AccountLayout activeKey="settings">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-primary-light)]">
          <Shield size={13} />
          Account Settings
        </p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Settings
        </h1>
      </motion.div>

      <div className="space-y-6">
        {/* Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card overflow-hidden"
        >
          <div className="border-b border-[var(--color-border)] px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <User size={18} className="text-[var(--color-primary-light)]" />
              Profile
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-xl font-bold text-white shadow-lg shadow-[var(--color-primary)]/30">
                {getInitials(user.name)}
              </div>
              <div>
                <p className="text-lg font-bold">{user.name}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  <User size={12} className="mr-1 inline" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={user.name}
                  readOnly
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-3 text-sm text-[var(--color-text-muted)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  <Mail size={12} className="mr-1 inline" />
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-3 text-sm text-[var(--color-text-muted)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  <Phone size={12} className="mr-1 inline" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={user.phone || "Not set"}
                  readOnly
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-3 text-sm text-[var(--color-text-muted)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Role
                </label>
                <input
                  type="text"
                  value={user.role}
                  readOnly
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-3 text-sm text-[var(--color-text-muted)]"
                />
              </div>
            </div>

            <p className="mt-4 text-xs text-[var(--color-text-muted)]">
              Contact support to update your profile information.
            </p>
          </div>
        </motion.section>

        {/* Security Section */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card overflow-hidden"
        >
          <div className="border-b border-[var(--color-border)] px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Lock size={18} className="text-[var(--color-primary-light)]" />
              Security
            </h2>
          </div>
          <div className="p-6">
            <h3 className="mb-4 text-sm font-semibold">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-3 pr-12 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary-light)]"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-3 pr-12 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary-light)]"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-3 pr-12 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary-light)]"
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                className="btn btn-primary"
              >
                {passwordLoading ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Lock size={16} />
                )}
                Update Password
              </button>
            </div>
          </div>
        </motion.section>

        {/* Notification Preferences */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card overflow-hidden"
        >
          <div className="border-b border-[var(--color-border)] px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Bell size={18} className="text-[var(--color-primary-light)]" />
              Notifications
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-5">
              {[
                { label: "Email notifications", desc: "Receive order updates via email", value: notifEmail, onChange: setNotifEmail },
                { label: "SMS notifications", desc: "Get text messages for delivery updates", value: notifSms, onChange: setNotifSms },
                { label: "Order status updates", desc: "Track your orders in real-time", value: notifOrders, onChange: setNotifOrders },
                { label: "Promotional offers", desc: "Get notified about sales and deals", value: notifPromos, onChange: setNotifPromos },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{pref.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => pref.onChange(!pref.value)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      pref.value
                        ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
                        : "bg-white/10"
                    }`}
                  >
                    <motion.span
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm ${
                        pref.value ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Danger Zone */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card overflow-hidden"
        >
          <div className="border-b border-[var(--color-secondary)]/20 px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--color-secondary)]">
              <Shield size={18} />
              Danger Zone
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Log out of all devices</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  This will sign you out from every browser and device.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogoutAll}
                className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--color-secondary)]/40 bg-[var(--color-secondary)]/10 px-5 py-2.5 text-sm font-semibold text-[var(--color-secondary)] transition-all hover:bg-[var(--color-secondary)]/20"
              >
                <LogOut size={16} />
                Log Out All Devices
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </AccountLayout>
  );
}
