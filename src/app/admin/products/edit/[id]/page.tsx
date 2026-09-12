"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, AlertTriangle, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import ProductForm, {
  getInitialValues,
  type ProductFormValues,
} from "@/components/ProductForm";
import { useToastStore } from "@/lib/toast-store";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  category: string;
  subcategory?: string;
  stock: number;
  sku: string;
  tags: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  images: string[];
  model3D?: string;
  featured: boolean;
  isNewArrival: boolean;
}

export default function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);

  const [id, setId] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { id: resolvedId } = await params;
        if (cancelled) return;
        setId(resolvedId);
        const res = await fetch(`/api/admin/products/${encodeURIComponent(resolvedId)}`, {
          credentials: "include",
        });
        const data = (await res.json()) as { product?: Product; error?: string };
        if (!res.ok || !data.product) {
          if (!cancelled) setError(data.error || "Product not found.");
          return;
        }
        if (!cancelled) setProduct(data.product);
      } catch {
        if (!cancelled) setError("Could not load this product.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [params]);

  const handleSubmit = async (values: ProductFormValues) => {
    if (!id) return;
    setSubmitting(true);
    setError("");

    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      price: parseFloat(values.price) || 0,
      oldPrice: values.oldPrice !== "" ? parseFloat(values.oldPrice) : undefined,
      category: values.category,
      subcategory: values.subcategory.trim(),
      stock: parseInt(values.stock || "0", 10) || 0,
      sku: values.sku.trim().toUpperCase(),
      tags: values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      sizes: values.sizes,
      colors: values.colors,
      images: values.images,
      model3D: values.model3D.trim(),
      featured: values.featured,
      isNewArrival: values.isNewArrival,
    };

    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error || "Could not update product.");
        return;
      }

      addToast("Product updated successfully", "success");
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error. Could not update product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout active="products">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl">
            <Package size={26} className="text-[var(--color-primary-light)]" />
            Edit Cloth / Product
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Update cloth colors, sizes, photos, and prices with instant live preview.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="glass-card h-64 p-6">
              <div className="skeleton h-6 w-48" />
              <div className="skeleton mt-5 h-4 w-3/4" />
              <div className="skeleton mt-3 h-4 w-1/2" />
              <div className="skeleton mt-3 h-4 w-2/3" />
            </div>
            <div className="glass-card h-40 p-6">
              <div className="skeleton h-6 w-32" />
              <div className="skeleton mt-5 h-10 w-full" />
              <div className="skeleton mt-3 h-10 w-full" />
            </div>
          </div>
        ) : error || !product ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <AlertTriangle size={30} className="mb-4 text-[var(--color-secondary)]" />
            <h2 className="text-xl font-black">Could not load product</h2>
            <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">{error}</p>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="btn btn-primary mt-6"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        ) : (
          <ProductForm
            key={product._id}
            mode="edit"
            initialValues={getInitialValues(product)}
            submitting={submitting}
            error={error}
            externalSubmit={handleSubmit}
          />
        )}
      </div>
    </AdminLayout>
  );
}
