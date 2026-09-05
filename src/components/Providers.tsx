"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/lib/store";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  const fetchCart = useCartStore((s) => s.fetchCart);
  const setCartItems = useCartStore((s) => s.setItems);

  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const setWishlistItems = useWishlistStore((s) => s.setItems);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
      const rawError =
        url.searchParams.get("error_description") ||
        url.searchParams.get("error") ||
        hashParams.get("error_description") ||
        hashParams.get("error");

      if (rawError) {
        const decoded = decodeURIComponent(rawError);
        // Clean URL parameters
        url.searchParams.delete("error");
        url.searchParams.delete("error_code");
        url.searchParams.delete("error_description");
        url.searchParams.delete("sb");
        window.history.replaceState(
          {},
          "",
          url.pathname + (url.search ? url.search : "")
        );

        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/register"
        ) {
          window.location.href = `/login?error=${encodeURIComponent(decoded)}`;
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchCart();
      fetchWishlist();
    } else if (initialized) {
      setCartItems([]);
      setWishlistItems([]);
    }
  }, [
    user,
    initialized,
    fetchCart,
    fetchWishlist,
    setCartItems,
    setWishlistItems,
  ]);

  return <ToastProvider>{children}</ToastProvider>;
}