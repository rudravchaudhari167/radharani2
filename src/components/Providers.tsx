"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/lib/store";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";

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

  return <>{children}</>;
}