"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  X,
  LoaderCircle,
  Package,
} from "lucide-react";
import { useToastStore } from "@/lib/toast-store";

export interface IColor {
  name: string;
  hex: string;
}

export interface ProductFormValues {
  name: string;
  description: string;
  price: string;
  oldPrice: string;
  category: string;
  stock: string;
  sku: string;
  tags: string;
  sizes: string[];
  colors: IColor[];
  images: string[];
  model3D: string;
  featured: boolean;
  isNewArrival: boolean;
}

const EMPTY_VALUES: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  oldPrice: "",
  category: "",
  stock: "0",
  sku: "",
  tags: "",
  sizes: [],
  colors: [],
  images: [],
  model3D: "",
  featured: false,
  isNewArrival: false,
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const CATEGORIES = ["MEN", "WOMEN", "UNISEX", "KIDS", "ACCESSORIES"];

export function getInitialValues(product?: {
  name?: string;
  description?: string;
  price?: number;
  oldPrice?: number;
  category?: string;
  stock?: number;
  sku?: string;
  tags?: string[];
  sizes?: string[];
  colors?: IColor[];
  images?: string[];
  model3D?: string;
  featured?: boolean;
  isNewArrival?: boolean;
}): ProductFormValues {
  if (!product) return EMPTY_VALUES;
  return {
    name: product.name || "",
    description: product.description || "",
    price: product.price !== undefined ? String(product.price) : "",
    oldPrice: product.oldPrice !== undefined ? String(product.oldPrice) : "",
    category: product.category || "",
    stock: product.stock !== undefined ? String(product.stock) : "0",
    sku: product.sku || "",
    tags: (product.tags || []).join(", "),
    sizes: product.sizes || [],
    colors: product.colors || [],
    images: product.images || [],
    model3D: product.model3D || "",
    featured: Boolean(product.featured),
    isNewArrival: Boolean(product.isNewArrival),
  };
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label} {required && <span className="text-[var(--color-secondary)]">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40";

export default function ProductForm({
  mode,
  initialValues = EMPTY_VALUES,
  submitting,
  error,
  externalSubmit,
}: {
  mode: "create" | "edit";
  initialValues?: ProductFormValues;
  submitting: boolean;
  error: string;
  externalSubmit: (values: ProductFormValues) => void;
}) {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newImage, setNewImage] = useState("");
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#7c3aed");

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  const toggleSize = (size: string) => {
    setValues((v) => ({
      ...v,
      sizes: v.sizes.includes(size)
        ? v.sizes.filter((s) => s !== size)
        : [...v.sizes, size],
    }));
  };

  const addImage = () => {
    const url = newImage.trim();
    if (!url) return;
    if (values.images.includes(url)) {
      addToast("This image URL is already added", "error");
      return;
    }
    set("images", [...values.images, url]);
    setNewImage("");
  };

  const removeImage = (index: number) => {
    set("images", values.images.filter((_, i) => i !== index));
  };

  const addColor = () => {
    const name = newColorName.trim();
    if (!name) return;
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(newColorHex)) {
      addToast("Enter a valid hex color", "error");
      return;
    }
    set("colors", [...values.colors, { name, hex: newColorHex }]);
    setNewColorName("");
    setNewColorHex("#7c3aed");
  };

  const removeColor = (index: number) => {
    set("colors", values.colors.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!values.name.trim()) errors.name = "Product name is required";
    const price = parseFloat(values.price);
    if (isNaN(price) || price <= 0) errors.price = "Price must be greater than 0";
    if (!values.category) errors.category = "Category is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    externalSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 noValidate">
      {/* Basic info */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
          <Package size={18} className="text-[var(--color-primary-light)]" />
          Basic Information
        </h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <Field label="Product Name" required>
              <input
                type="text"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Radha Krishna Silk Kurta"
                className={`${inputClass} ${
                  fieldErrors.name ? "border-[var(--color-secondary)]/60" : ""
                }`}
              />
              {fieldErrors.name && (
                <p className="mt-1.5 text-xs text-[var(--color-secondary)]">{fieldErrors.name}</p>
              )}
            </Field>
          </div>

          <div className="lg:col-span-2">
            <Field label="Description" required>
              <textarea
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                placeholder="Describe the product…"
                className={`${inputClass} resize-none`}
              />
            </Field>
          </div>

          <Field label="Price (₹)" required>
            <input
              type="number"
              min="0"
              step="0.01"
              value={values.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="0.00"
              className={`${inputClass} ${
                fieldErrors.price ? "border-[var(--color-secondary)]/60" : ""
              }`}
            />
            {fieldErrors.price && (
              <p className="mt-1.5 text-xs text-[var(--color-secondary)]">{fieldErrors.price}</p>
            )}
          </Field>

          <Field label="Old Price (₹)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={values.oldPrice}
              onChange={(e) => set("oldPrice", e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </Field>

          <Field label="Category" required>
            <select
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              className={`${inputClass} ${
                fieldErrors.category ? "border-[var(--color-secondary)]/60" : ""
              }`}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[var(--color-bg-secondary)]">
                  {c}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className="mt-1.5 text-xs text-[var(--color-secondary)]">
                {fieldErrors.category}
              </p>
            )}
          </Field>

          <Field label="Stock" required hint="Stock cannot be negative.">
            <input
              type="number"
              min="0"
              value={values.stock}
              onChange={(e) => set("stock", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="SKU" required hint="Unique product identifier.">
            <input
              type="text"
              value={values.sku}
              onChange={(e) => set("sku", e.target.value)}
              placeholder="e.g. RK-KURTA-001"
              className={inputClass}
            />
          </Field>

          <Field label="Tags" hint="Comma-separated, e.g. silk, festive, new">
            <input
              type="text"
              value={values.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="silk, festive, kurta"
              className={inputClass}
            />
          </Field>
        </div>
      </motion.section>

      {/* Sizes */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-6"
      >
        <h2 className="mb-4 text-lg font-bold">Sizes</h2>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => {
            const active = values.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                aria-pressed={active}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "border-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white"
                    : "border-[var(--color-border)] bg-white/5 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* Colors */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h2 className="mb-4 text-lg font-bold">Colors</h2>
        <div className="flex flex-wrap gap-3">
          {values.colors.map((color, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/5 py-1.5 pl-1.5 pr-2.5"
            >
              <span
                className="h-6 w-6 rounded-lg border border-white/10"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-sm font-semibold">{color.name}</span>
              <button
                type="button"
                onClick={() => removeColor(index)}
                aria-label={`Remove ${color.name}`}
                className="rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-secondary)]"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Color Name
            </label>
            <input
              type="text"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              placeholder="e.g. Royal Purple"
              className={inputClass}
            />
          </div>
          <div className="min-w-[90px]">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Hex
            </label>
            <input
              type="color"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              className="h-11 w-full cursor-pointer rounded-xl border border-[var(--color-border)] bg-white/5"
            />
          </div>
          <button
            type="button"
            onClick={addColor}
            className="btn flex items-center gap-1.5 rounded-xl"
          >
            <Plus size={15} />
            Add
          </button>
        </div>
      </motion.section>

      {/* Images */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-6"
      >
        <h2 className="mb-4 text-lg font-bold">Images</h2>
        {values.images.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {values.images.map((url, index) => (
              <div
                key={index}
                className="relative h-24 w-24 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Product image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label={`Remove image ${index + 1}`}
                  className="absolute right-1 top-1 rounded-md bg-black/70 p-1 text-white transition-colors hover:bg-[var(--color-secondary)]"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <input
            type="url"
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addImage();
              }
            }}
            placeholder="Paste image URL…"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addImage}
            className="btn flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus size={15} />
            Add URL
          </button>
        </div>
      </motion.section>

      {/* 3D model + flags */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h2 className="mb-4 text-lg font-bold">Extras</h2>
        <div className="space-y-5">
          <Field label="3D Model URL">
            <input
              type="url"
              value={values.model3D}
              onChange={(e) => set("model3D", e.target.value)}
              placeholder="Optional .glb model URL"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white/5 p-4">
              <input
                type="checkbox"
                checked={values.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              <div>
                <p className="text-sm font-semibold">Featured</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Show on home page highlights
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white/5 p-4">
              <input
                type="checkbox"
                checked={values.isNewArrival}
                onChange={(e) => set("isNewArrival", e.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              <div>
                <p className="text-sm font-semibold">New Arrival</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Mark as new arrival
                </p>
              </div>
            </label>
          </div>
        </div>
      </motion.section>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-4 py-3 text-sm text-[var(--color-secondary)]"
        >
          {error}
        </motion.p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary flex-1 sm:flex-none sm:px-10"
        >
          {submitting ? (
            <>
              <LoaderCircle size={16} className="animate-spin" />
              {mode === "create" ? "Creating…" : "Saving…"}
            </>
          ) : mode === "create" ? (
            <>
              <Plus size={16} />
              Create Product
            </>
          ) : (
            <>
              <Package size={16} />
              Save Changes
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="btn btn-ghost"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
