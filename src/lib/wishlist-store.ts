import { create } from "zustand";

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  slug?: string;
  stock?: number;
  addedAt?: string;
}

const WISHLIST_STORAGE_KEY = "radharani_wishlist_items";

function getLocalWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalWishlist(items: WishlistItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore localStorage quota errors
  }
}

function mapWishlistItems(raw: unknown): WishlistItem[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  const wishlist = raw as { products?: Array<Record<string, unknown>> };

  if (!Array.isArray(wishlist.products)) {
    return [];
  }

  return wishlist.products
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
        slug: typeof product?.slug === "string" ? product.slug : undefined,
        stock: typeof product?.stock === "number" ? product.stock : undefined,
        addedAt: typeof item.addedAt === "string" ? item.addedAt : undefined,
      };
    });
}

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  totalItems: number;
  setItems: (items: WishlistItem[]) => void;
  fetchWishlist: () => Promise<void>;
  toggleItem: (
    productId: string,
    productData?: Partial<WishlistItem>
  ) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
}

const initialLocalItems = getLocalWishlist();

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: initialLocalItems,
  loading: false,
  totalItems: initialLocalItems.length,

  setItems: (items) => {
    saveLocalWishlist(items);
    set({ items, totalItems: items.length });
  },

  fetchWishlist: async () => {
    set({ loading: true });

    try {
      const res = await fetch("/api/wishlist", { credentials: "include" });
      if (!res.ok) {
        const local = getLocalWishlist();
        set({ items: local, totalItems: local.length });
        return;
      }

      const data = (await res.json()) as { wishlist?: unknown };
      const items = mapWishlistItems(data?.wishlist);
      saveLocalWishlist(items);
      set({ items, totalItems: items.length });
    } catch {
      const local = getLocalWishlist();
      set({ items: local, totalItems: local.length });
    } finally {
      set({ loading: false });
    }
  },

  toggleItem: async (productId, productData) => {
    const current = get().items;
    const exists = current.some(
      (item) => String(item.productId) === String(productId)
    );

    // 1. Instant optimistic update: update state synchronously in 0ms!
    let nextItems: WishlistItem[];
    if (exists) {
      nextItems = current.filter(
        (item) => String(item.productId) !== String(productId)
      );
    } else {
      const newItem: WishlistItem = {
        productId: String(productId),
        name: productData?.name || "",
        price: Number(productData?.price) || 0,
        image: productData?.image || "",
        slug: productData?.slug,
        addedAt: new Date().toISOString(),
      };
      nextItems = [newItem, ...current];
    }

    // Set state immediately so heart turns red right now!
    set({ items: nextItems, totalItems: nextItems.length });
    saveLocalWishlist(nextItems);

    // 2. Sync with server in the background
    try {
      if (exists) {
        await fetch("/api/wishlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ productId }),
        });
      } else {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            productId,
            name: productData?.name,
            price: productData?.price,
            image: productData?.image,
          }),
        });
      }
    } catch {
      // Retain optimistic local state if network or unauthenticated
    }

    return true;
  },

  removeFromWishlist: async (productId) => {
    const current = get().items;
    const nextItems = current.filter(
      (item) => String(item.productId) !== String(productId)
    );
    set({ items: nextItems, totalItems: nextItems.length });
    saveLocalWishlist(nextItems);

    try {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId }),
      });
    } catch {
      // Keep optimistic removal
    }
    return true;
  },

  isInWishlist: (productId) =>
    get().items.some((item) => String(item.productId) === String(productId)),
}));