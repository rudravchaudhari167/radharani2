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
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,
  totalItems: 0,

  setItems: (items) =>
    set({ items, totalItems: items.length }),

  fetchWishlist: async () => {
    set({ loading: true });

    try {
      const res = await fetch("/api/wishlist", { credentials: "include" });
      if (!res.ok) {
        set({ items: [], totalItems: 0 });
        return;
      }

      const data = (await res.json()) as { wishlist?: unknown };
      const items = mapWishlistItems(data?.wishlist);
      set({ items, totalItems: items.length });
    } catch {
      set({ items: [], totalItems: 0 });
    } finally {
      set({ loading: false });
    }
  },

  toggleItem: async (productId, productData) => {
    const exists = get().isInWishlist(productId);

    try {
      if (exists) {
        const res = await fetch("/api/wishlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ productId }),
        });

        if (!res.ok) {
          return false;
        }

        const data = (await res.json()) as { wishlist?: unknown };
        const items = mapWishlistItems(data?.wishlist);
        set({ items, totalItems: items.length });
        return true;
      }

      const res = await fetch("/api/wishlist", {
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

      if (!res.ok) {
        return false;
      }

      const data = (await res.json()) as { wishlist?: unknown };
      const items = mapWishlistItems(data?.wishlist);
      set({ items, totalItems: items.length });
      return true;
    } catch {
      return false;
    }
  },

  isInWishlist: (productId) =>
    get().items.some((item) => String(item.productId) === String(productId)),
}));