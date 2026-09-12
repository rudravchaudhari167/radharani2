"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import ProductForm, { type ProductFormValues } from "@/components/ProductForm";
import { useToastStore } from "@/lib/toast-store";

export default function AdminNewProductPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (values: ProductFormValues) => {
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
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error || "Could not create product.");
        return;
      }

      addToast("Cloth published successfully", "success");
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error. Could not create product.");
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
            Add New Cloth / Product
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Create a new apparel listing with colors, sizes, fabric details, and real-time live preview.
          </p>
        </div>

        <ProductForm
          mode="create"
          submitting={submitting}
          error={error}
          externalSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  );
}
