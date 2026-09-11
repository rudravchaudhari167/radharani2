"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Store,
  Shield,
  FileClock,
  AlertTriangle,
  RefreshCw,
  LoaderCircle,
  KeyRound,
  Palette,
  Eye,
  EyeOff,
  Tag,
  Truck,
  Zap,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useToastStore } from "@/lib/toast-store";

interface AuditLog {
  _id: string;
  adminEmail: string;
  action: string;
  target: string;
  details: Record<string, unknown>;
  createdAt: string;
}

const inputClass =
  "w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40";

function StorePriceRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-[var(--color-primary-light)]">
          <Icon size={16} />
        </div>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <span className="text-sm font-bold text-[var(--color-primary-light)]">{value}</span>
    </div>
  );
}

const BRAND_SWATCHES = [
  { name: "Primary", hex: "#7c3aed" },
  { name: "Primary Light", hex: "#a78bfa" },
  { name: "Secondary", hex: "#ec4899" },
  { name: "Accent", hex: "#c084fc" },
  { name: "Gold", hex: "#d4a574" },
];

export default function AdminSettingsPage() {
  const addToast = useToastStore((s) => s.addToast);

  // Admin email
  const [adminEmail, setAdminEmail] = useState("");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changeFormError, setChangeFormError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Audit logs
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState("");
  const [logsReloadKey, setLogsReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadAdmin = async () => {
      try {
        const res = await fetch("/api/admin/auth/me", { credentials: "include" });
        const data = (await res.json()) as { admin?: { email?: string } };
        if (!cancelled && data.admin?.email) setAdminEmail(data.admin.email);
      } catch {
        // ignore
      }
    };
    loadAdmin();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadLogs = async () => {
      setLogsLoading(true);
      setLogsError("");
      try {
        const res = await fetch("/api/admin/audit?limit=25", { credentials: "include" });
        const data = (await res.json()) as { logs?: AuditLog[]; error?: string };
        if (cancelled) return;
        if (!res.ok || !data.logs) {
          setLogsError(data.error || "Could not load audit logs.");
          return;
        }
        setLogs(data.logs);
      } catch {
        if (!cancelled) setLogsError("Network error. Could not load audit logs.");
      } finally {
        if (!cancelled) setLogsLoading(false);
      }
    };
    loadLogs();
    return () => {
      cancelled = true;
    };
  }, [logsReloadKey]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeFormError("");

    if (!currentPassword) {
      setChangeFormError("Current password is required.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setChangeFormError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeFormError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setChangeFormError(data.error || "Could not update password.");
        return;
      }
      addToast("Password updated successfully", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setChangeFormError("Network error. Could not update password.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <AdminLayout active="settings">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl">
            <Shield size={26} className="text-[var(--color-primary-light)]" />
            Settings
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Store configuration and admin account management
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Store settings */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
              <Store size={18} className="text-[var(--color-primary-light)]" />
              Store Settings
            </h2>
            <p className="mb-5 text-xs text-[var(--color-text-muted)]">
              Shipping configuration for Radha Rani
            </p>

            <div className="mb-5 flex items-center gap-3 rounded-xl border border-[var(--color-primary-light)]/20 bg-[var(--color-primary)]/5 px-4 py-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-base font-black text-white">
                R
              </div>
              <div>
                <p className="text-sm font-black tracking-[0.2em]">RADHA RANI</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Free shipping threshold ₹1,999
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <StorePriceRow icon={Tag} label="Free Shipping Threshold" value="₹1,999" />
              <StorePriceRow icon={Truck} label="Standard Shipping" value="₹99" />
              <StorePriceRow icon={Zap} label="Express Shipping" value="₹199" />
            </div>

            {/* Brand theme preview */}
            <h2 className="mb-3 mt-6 flex items-center gap-2 text-lg font-bold">
              <Palette size={18} className="text-[var(--color-primary-light)]" />
              Brand Theme
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {BRAND_SWATCHES.map((swatch) => (
                <div
                  key={swatch.name}
                  className="flex flex-col items-center rounded-xl border border-[var(--color-border)] bg-white/5 p-3"
                >
                  <span
                    className="h-10 w-10 rounded-xl border border-white/10"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <p className="mt-2 text-center text-[10px] font-semibold text-[var(--color-text-muted)]">
                    {swatch.name}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Admin account */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-6"
          >
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
              <Shield size={18} className="text-[var(--color-primary-light)]" />
              Admin Account
            </h2>

            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Admin Email
              </p>
              <p className="mt-1 font-mono text-sm font-semibold">
                {adminEmail || "…"}
              </p>
            </div>

            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <KeyRound size={15} />
              Change Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4 noValidate">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label="Toggle current password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
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
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label="Toggle new password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
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
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label="Toggle confirm password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {changeFormError && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-4 py-3 text-sm text-[var(--color-secondary)]"
                >
                  {changeFormError}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={changingPassword}
                className="btn btn-primary w-full"
              >
                {changingPassword ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Updating…
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    Update Password
                  </>
                )}
              </button>
            </form>
          </motion.section>
        </div>

        {/* Audit logs */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card mt-6 overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <FileClock size={18} className="text-[var(--color-primary-light)]" />
              Audit Logs
            </h2>
            <button
              type="button"
              onClick={() => setLogsReloadKey((k) => k + 1)}
              className="rounded-lg border border-[var(--color-border)] bg-white/5 p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              aria-label="Refresh audit logs"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {logsLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-12 w-full" />
              ))}
            </div>
          ) : logsError ? (
            <div className="p-8 text-center">
              <AlertTriangle size={26} className="mx-auto mb-3 text-[var(--color-secondary)]" />
              <p className="text-sm text-[var(--color-text-muted)]">{logsError}</p>
            </div>
          ) : logs.length === 0 ? (
            <p className="px-6 py-8 text-sm text-[var(--color-text-muted)]">
              No audit log entries yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Admin</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Target</th>
                    <th className="px-6 py-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {logs.map((log) => (
                    <tr key={log._id} className="align-top transition-colors hover:bg-white/5">
                      <td className="whitespace-nowrap px-6 py-3 text-xs text-[var(--color-text-muted)]">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-3 text-xs text-[var(--color-text-muted)]">
                        {log.adminEmail}
                      </td>
                      <td className="px-6 py-3">
                        <span className="rounded-full bg-[var(--color-primary)]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary-light)]">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-[var(--color-text-muted)]">
                        {log.target}
                      </td>
                      <td className="px-6 py-3">
                        <span className="block max-w-[180px] truncate text-xs text-[var(--color-text-muted)]">
                          {Object.keys(log.details || {}).length > 0
                            ? JSON.stringify(log.details).slice(0, 80)
                            : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>
      </div>
    </AdminLayout>
  );
}
