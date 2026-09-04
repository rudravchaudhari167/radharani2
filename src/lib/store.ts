import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "USER" | "ADMIN";
}

type ApiUser = {
  userId?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
};

function normalizeUser(raw: unknown): User | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const user = raw as ApiUser;

  if (typeof user.name !== "string" || typeof user.email !== "string") {
    return null;
  }

  return {
    id: String(user.userId ?? user._id ?? user.email),
    name: user.name,
    email: user.email,
    phone: typeof user.phone === "string" ? user.phone : "",
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
  };
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  setUser: (user) => set({ user, initialized: true }),

  login: (user) => set({ user, initialized: true }),

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Ignore network errors; local state is still cleared below.
    } finally {
      set({ user: null, initialized: true });
    }
  },

  fetchUser: async () => {
    set({ loading: true });

    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        set({ user: null, initialized: true });
        return null;
      }

      const data = (await res.json()) as { user?: unknown };
      const user = normalizeUser(data?.user);
      set({ user, initialized: true });
      return user;
    } catch {
      set({ user: null, initialized: true });
      return null;
    } finally {
      set({ loading: false });
    }
  },
}));