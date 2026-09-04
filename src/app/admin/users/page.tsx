"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Ban,
  CheckCircle2,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useToastStore } from "@/lib/toast-store";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  orderCount: number;
  totalSpending: number;
}

interface Pagination {
  page: number;
  total: number;
  totalPages: number;
}

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDate(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const addToast = useToastStore((s) => s.addToast);

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async (targetPage: number) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: "20",
        });
        if (search.trim()) params.set("search", search.trim());
        const res = await fetch(`/api/admin/users?${params.toString()}`, {
          credentials: "include",
        });
        const data = (await res.json()) as {
          users?: User[];
          pagination?: Pagination;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.users) {
          setError(data.error || "Could not load users.");
          return;
        }
        setUsers(data.users);
        setPagination(data.pagination || null);
      } catch {
        if (!cancelled) setError("Network error. Could not load users.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (search.trim()) {
      timer = setTimeout(() => {
        if (page !== 1) {
          setPage(1);
        } else {
          load(1);
        }
      }, 400);
    } else {
      load(page);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [page, search, reloadKey]);

  const toggleActive = async (user: User) => {
    setTogglingId(user._id);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        addToast(data.error || "Could not update user.", "error");
        return;
      }
      addToast(
        user.isActive ? `${user.name} has been disabled` : `${user.name} has been enabled`,
        "success"
      );
      setReloadKey((k) => k + 1);
    } catch {
      addToast("Network error. Could not update user.", "error");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <AdminLayout active="users">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl">
            <Users size={26} className="text-[var(--color-primary-light)]" />
            Users
          </h1>
          {pagination && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {pagination.total.toLocaleString("en-IN")} users
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card flex items-center gap-4 p-4">
              <div className="skeleton h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <AlertTriangle size={30} className="mb-4 text-[var(--color-secondary)]" />
          <h2 className="text-xl font-black">Could not load users</h2>
          <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">{error}</p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="btn btn-primary mt-6"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <Users size={36} className="mb-4 text-[var(--color-text-muted)]" />
          <h2 className="text-lg font-bold">No users found</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Try a different search.
          </p>
        </div>
      ) : (
        <>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Orders</th>
                    <th className="px-5 py-4">Spending</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Registered</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {users.map((user) => (
                    <tr key={user._id} className="transition-colors hover:bg-white/5">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-sm font-bold text-white">
                            {getInitials(user.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[160px] truncate font-semibold">
                              {user.name}
                            </p>
                            <p className="max-w-[200px] truncate text-xs text-[var(--color-text-muted)]">
                              {user.email}
                              {user.phone ? ` · ${user.phone}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            user.role === "ADMIN"
                              ? "bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]"
                              : "bg-white/10 text-[var(--color-text-muted)]"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[var(--color-text-muted)]">
                        {user.orderCount}
                      </td>
                      <td className="px-5 py-3 font-bold">{inr(user.totalSpending)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            user.isActive
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]"
                          }`}
                        >
                          {user.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--color-text-muted)]">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          disabled={
                            togglingId === user._id || user.role === "ADMIN"
                          }
                          onClick={() => toggleActive(user)}
                          title={
                            user.role === "ADMIN"
                              ? "Admin accounts cannot be modified"
                              : user.isActive
                                ? "Disable user"
                                : "Enable user"
                          }
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all disabled:opacity-40 ${
                            user.isActive
                              ? "border-[var(--color-border)] bg-white/5 text-[var(--color-text-muted)] hover:border-[var(--color-secondary)]/40 hover:text-[var(--color-secondary)]"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:text-emerald-300"
                          }`}
                        >
                          {togglingId === user._id ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : user.isActive ? (
                            <Ban size={13} />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          {user.isActive ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-[var(--color-border)] bg-white/5 p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-[var(--color-text-muted)]">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="rounded-xl border border-[var(--color-border)] bg-white/5 p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
