import { create } from "zustand";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  stock?: number;
  slug?: string;
}

interface RawApiItem {
  productId: unknown;
  name?: string;
  price?: number;
  image?: string;
  size?: string;
  color?: string;
  quantity?: number;
}

function mapCartItems(raw: unknown): CartItem[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  const cart = raw as { items?: RawApiItem[] };

  if (!Array.isArray(cart.items)) {
    return [];
  }

  return cart.items
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const product =
        typeof item.productId === "object" && item.productId !== null
          ? (item.productId as Record<string, unknown>)
          : null;

      const images = Array.isArray(product?.images)
        ? (product.images as string[])
        : [];

      return {
        productId: String(product?._id ?? item.productId ?? ""),
        name:
          typeof product?.name === "string"
            ? product.name
            : typeof item.name === "string"
              ? item.name
              : "",
        price:
          typeof product?.price === "number"
            ? product.price
            : typeof item.price === "number"
              ? item.price
              : 0,
        image:
          typeof images[0] === "string"
            ? images[0]
            : typeof item.image === "string"
              ? item.image
              : "",
        size: typeof item.size === "string" ? item.size : "",
        color: typeof item.color === "string" ? item.color : "",
        quantity: typeof item.quantity === "number" ? item.quantity : 1,
        stock: typeof product?.stock === "number" ? product.stock : undefined,
        slug: typeof product?.slug === "string" ? product.slug : undefined,
      };
    });
}

function deriveTotalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  totalItems: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setItems: (items: CartItem[]) => void;
  fetchCart: () => Promise<void>;
  addItem: (
    productId: string,
    size?: string,
    color?: string,
    qty?: number
  ) => Promise<boolean>;
  removeItem: (
    productId: string,
    size?: string,
    color?: string
  ) => Promise<boolean>;
  updateQuantity: (
    productId: string,
    size?: string,
    color?: string,
    qty?: number
  ) => Promise<boolean>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  totalItems: 0,
  isDrawerOpen: false,

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  setItems: (items) =>
    set({ items, totalItems: deriveTotalItems(items) }),

  fetchCart: async () => {
    set({ loading: true });

    try {
      const res = await fetch("/api/cart", { credentials: "include" });
      if (!res.ok) {
        set({ items: [], totalItems: 0 });
        return;
      }

      const data = (await res.json()) as { cart?: unknown };
      const items = mapCartItems(data?.cart);
      set({ items, totalItems: deriveTotalItems(items) });
    } catch {
      set({ items: [], totalItems: 0 });
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (productId, size = "", color = "", qty = 1) => {
    const quantity = qty > 0 ? qty : 1;

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, size, color, quantity }),
      });

      if (!res.ok) {
        return false;
      }

      const data = (await res.json()) as { cart?: unknown };
      const items = mapCartItems(data?.cart);
      set({ items, totalItems: deriveTotalItems(items), isDrawerOpen: true });
      return true;
    } catch {
      return false;
    }
  },

  removeItem: async (productId, size = "", color = "") => {
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, size, color }),
      });

      if (!res.ok) {
        return false;
      }

      const data = (await res.json()) as { cart?: unknown };
      const items = mapCartItems(data?.cart);
      set({ items, totalItems: deriveTotalItems(items) });
      return true;
    } catch {
      return false;
    }
  },

  updateQuantity: async (productId, size = "", color = "", qty = 1) => {
    const quantity = qty > 0 ? qty : 1;

    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, size, color, quantity }),
      });

      if (!res.ok) {
        return false;
      }

      const data = (await res.json()) as { cart?: unknown };
      const items = mapCartItems(data?.cart);
      set({ items, totalItems: deriveTotalItems(items) });
      return true;
    } catch {
      return false;
    }
  },

  clearCart: async () => {
    const currentItems = get().items;

    await Promise.allSettled(
      currentItems.map((item) =>
        fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            productId: item.productId,
            size: item.size,
            color: item.color,
          }),
        })
      )
    );

    set({ items: [], totalItems: 0 });
  },
}));