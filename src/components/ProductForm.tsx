"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  X,
  LoaderCircle,
  Package,
  Upload,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
  Tag,
  Palette,
  Layers,
  IndianRupee,
  Sliders,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import ProductCard, { type ProductCardProduct } from "@/components/ProductCard";
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
  subcategory: string;
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
  category: "MEN",
  subcategory: "Kurtas",
  stock: "25",
  sku: "",
  tags: "",
  sizes: ["S", "M", "L", "XL"],
  colors: [],
  images: [],
  model3D: "",
  featured: false,
  isNewArrival: true,
};

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
export const CATEGORIES = ["MEN", "WOMEN", "UNISEX", "KIDS", "ACCESSORIES"];

export const CLOTHING_SUBCATEGORIES: Record<string, string[]> = {
  MEN: ["Kurtas", "Shirts", "Dhotis", "Shawls", "Hoodies", "T-Shirts", "Jackets", "Co-ord Sets", "Accessories"],
  WOMEN: ["Sarees", "Kurtis", "Anarkalis", "Lehengas", "Dresses", "Dupattas", "Tops", "Jackets", "Co-ord Sets", "Accessories"],
  UNISEX: ["Hoodies", "T-Shirts", "Kurtas", "Jackets", "Overshirts", "Shawls", "Scarves"],
  KIDS: ["Kurtas", "Dresses", "T-Shirts", "Sets", "Accessories"],
  ACCESSORIES: ["Shawls", "Dupattas", "Jewelry", "Bags", "Caps", "Footwear"],
};

export const BRAND_COLOR_PRESETS: IColor[] = [
  { name: "Peacock Blue", hex: "#0f3d68" },
  { name: "Midnight Navy", hex: "#1e2a4a" },
  { name: "Lotus Pink", hex: "#f472b6" },
  { name: "Radha Crimson", hex: "#e11d48" },
  { name: "Sacred Saffron", hex: "#f59e0b" },
  { name: "Haldi Gold", hex: "#d4a574" },
  { name: "Vrindavan Green", hex: "#15803d" },
  { name: "Moon White", hex: "#f4f4f8" },
  { name: "Temple Maroon", hex: "#881337" },
  { name: "Charcoal Black", hex: "#18181b" },
];

export const FABRIC_SUGGESTIONS = [
  "Pure Mulberry Silk",
  "Handspun Khadi Cotton",
  "Chanderi Silk Cotton",
  "Organic Linen Blend",
  "Banarasi Brocade",
  "Mulmul Muslin",
  "Heritage Tussar Silk",
  "Velvet & Zari",
];

export function getInitialValues(product?: {
  name?: string;
  description?: string;
  price?: number;
  oldPrice?: number;
  category?: string;
  subcategory?: string;
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
    category: product.category || "MEN",
    subcategory: product.subcategory || "Kurtas",
    stock: product.stock !== undefined ? String(product.stock) : "0",
    sku: product.sku || "",
    tags: (product.tags || []).join(", "),
    sizes: product.sizes || ["S", "M", "L", "XL"],
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
      {hint && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40 transition-colors";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newImage, setNewImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#0f3d68");
  const [customSubcategory, setCustomSubcategory] = useState(false);

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

  const selectAllStandardSizes = () => {
    set("sizes", ["S", "M", "L", "XL", "XXL"]);
  };

  const addColor = (nameToAdd?: string, hexToAdd?: string) => {
    const name = (nameToAdd || newColorName).trim();
    const hex = (hexToAdd || newColorHex).trim();
    if (!name) {
      addToast("Please enter a color name", "info");
      return;
    }
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
      addToast("Enter a valid hex color code (e.g. #1e2a4a)", "error");
      return;
    }
    if (values.colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      addToast(`Color "${name}" is already added`, "info");
      return;
    }
    set("colors", [...values.colors, { name, hex }]);
    setNewColorName("");
    addToast(`Added color swatch "${name}"`, "success");
  };

  const removeColor = (index: number) => {
    set("colors", values.colors.filter((_, i) => i !== index));
  };

  const addImageUrl = () => {
    const url = newImage.trim();
    if (!url) return;
    if (values.images.includes(url)) {
      addToast("This image URL is already in the gallery", "info");
      return;
    }
    set("images", [...values.images, url]);
    setNewImage("");
    addToast("Image URL added", "success");
  };

  const removeImage = (index: number) => {
    set("images", values.images.filter((_, i) => i !== index));
  };

  const makePrimaryImage = (index: number) => {
    if (index === 0) return;
    const target = values.images[index];
    const remaining = values.images.filter((_, i) => i !== index);
    set("images", [target, ...remaining]);
    addToast("Set as primary hero image", "info");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          addToast(data.error || `Failed to upload ${file.name}`, "error");
          continue;
        }

        setValues((prev) => ({
          ...prev,
          images: [...prev.images, data.url],
        }));
        successCount++;
      } catch {
        addToast(`Network error uploading ${file.name}`, "error");
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (successCount > 0) {
      addToast(`Uploaded ${successCount} photo${successCount > 1 ? "s" : ""} to storage!`, "success");
    }
  };

  const autoGenerateSku = () => {
    const catCode = values.category.slice(0, 3).toUpperCase();
    const subCode = (values.subcategory || "CLOTH").slice(0, 4).toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    const sku = `VRN-${catCode}-${subCode}-${randomNum}`;
    set("sku", sku);
    addToast(`Generated SKU: ${sku}`, "info");
  };

  const priceNum = parseFloat(values.price) || 0;
  const oldPriceNum = parseFloat(values.oldPrice) || 0;
  const discountPercent =
    oldPriceNum > priceNum && priceNum > 0
      ? Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100)
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!values.name.trim()) errors.name = "Cloth / Product name is required";
    if (isNaN(priceNum) || priceNum <= 0) errors.price = "Valid price in ₹ is required";
    if (!values.category) errors.category = "Category is required";
    if (!values.sku.trim()) errors.sku = "SKU is required (use Auto-Generate)";
    if (values.colors.length === 0) {
      addToast("Tip: Add at least one color swatch for cloth preview", "info");
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      addToast("Please fill in the required fields marked with *", "error");
      return;
    }

    externalSubmit(values);
  };

  // Preview object for the live card
  const previewProduct: ProductCardProduct = {
    _id: "preview-cloth-id",
    name: values.name.trim() || "Radha Krishna Heritage Silk Kurta",
    slug: "preview-product",
    price: priceNum || 2499,
    oldPrice: oldPriceNum > 0 ? oldPriceNum : undefined,
    images:
      values.images.length > 0
        ? values.images
        : [
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=700&auto=format&fit=crop",
          ],
    category: values.category || "MEN",
    sizes: values.sizes.length > 0 ? values.sizes : ["S", "M", "L", "XL"],
    colors:
      values.colors.length > 0
        ? values.colors
        : [
            { name: "Peacock Blue", hex: "#0f3d68" },
            { name: "Moon White", hex: "#f4f4f8" },
          ],
    stock: parseInt(values.stock || "25", 10),
    featured: values.featured,
    isNewArrival: values.isNewArrival,
    rating: 5.0,
    reviewCount: 3,
  };

  const subcategoryList = CLOTHING_SUBCATEGORIES[values.category] || [
    "Kurtas",
    "Shirts",
    "Dresses",
    "Hoodies",
    "T-Shirts",
    "Accessories",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8 noValidate">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Main Form Inputs (8 cols)                        */}
        {/* ============================================================ */}
        <div className="space-y-8 lg:col-span-7 xl:col-span-8">
          {/* 1. Basic Garment Details */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="mb-5 flex items-center justify-between border-b border-[var(--color-border)] pb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Package size={20} className="text-[var(--color-primary-light)]" />
                Garment & Cloth Details
              </h2>
              <span className="rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary-light)]">
                Radha Rani Atelier
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Cloth / Product Name" required hint="e.g. Lotus Silk Kurta, Vrindavan Peacock Anarkali">
                  <input
                    type="text"
                    value={values.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Peacock Print Linen Shirt"
                    className={`${inputClass} ${
                      fieldErrors.name ? "border-[var(--color-secondary)]/60" : ""
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs text-[var(--color-secondary)]">{fieldErrors.name}</p>
                  )}
                </Field>
              </div>

              {/* Category */}
              <Field label="Department / Category" required>
                <select
                  value={values.category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    set("category", newCat);
                    const subList = CLOTHING_SUBCATEGORIES[newCat] || [];
                    if (subList.length > 0) {
                      set("subcategory", subList[0]);
                    }
                  }}
                  className={`${inputClass} ${
                    fieldErrors.category ? "border-[var(--color-secondary)]/60" : ""
                  }`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#171717] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Subcategory / Clothing type */}
              <Field
                label="Clothing Type / Subcategory"
                hint={
                  customSubcategory
                    ? "Type your custom garment name"
                    : "Or switch to custom type"
                }
              >
                {customSubcategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={values.subcategory}
                      onChange={(e) => set("subcategory", e.target.value)}
                      placeholder="e.g. Angrakha, Nehru Jacket"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setCustomSubcategory(false)}
                      className="rounded-xl border border-[var(--color-border)] px-3 text-xs text-[var(--color-text-muted)] hover:text-white"
                    >
                      Presets
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={values.subcategory}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setCustomSubcategory(true);
                          set("subcategory", "");
                        } else {
                          set("subcategory", e.target.value);
                        }
                      }}
                      className={inputClass}
                    >
                      {subcategoryList.map((sub) => (
                        <option key={sub} value={sub} className="bg-[#171717] text-white">
                          {sub}
                        </option>
                      ))}
                      <option value="__custom__" className="bg-[#171717] text-amber-400">
                        + Add Custom Clothing Type…
                      </option>
                    </select>
                  </div>
                )}
              </Field>

              <div className="sm:col-span-2">
                <Field label="Description & Spiritual Story" required hint="Describe fabric feel, cut, embroidery, and timeless Vrindavan inspirations.">
                  <textarea
                    value={values.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={4}
                    placeholder="Crafted with pure linen blend, adorned with subtle peacock feather embroidery along the neckline…"
                    className={`${inputClass} resize-y`}
                  />
                </Field>
              </div>

              {/* Quick Fabric Chips */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Fabric & Craft Suggestions (Click to append to tags/description)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FABRIC_SUGGESTIONS.map((fabric) => (
                    <button
                      key={fabric}
                      type="button"
                      onClick={() => {
                        const existing = values.tags ? values.tags.split(",").map((t) => t.trim()) : [];
                        const slugFabric = fabric.toLowerCase().replace(/\s+/g, "-");
                        if (!existing.includes(slugFabric)) {
                          const updated = [...existing, slugFabric].filter(Boolean).join(", ");
                          set("tags", updated);
                          addToast(`Added "${fabric}" to tags`, "info");
                        }
                      }}
                      className="rounded-lg border border-[var(--color-border)] bg-white/5 px-2.5 py-1 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-primary-light)] hover:text-white"
                    >
                      + {fabric}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* 2. Price & Inventory */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-6"
          >
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
              <IndianRupee size={20} className="text-emerald-400" />
              Pricing & Inventory
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Selling Price (₹)" required hint="The actual purchase price charged to the customer.">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={values.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="2499"
                    className={`${inputClass} pl-8 ${
                      fieldErrors.price ? "border-[var(--color-secondary)]/60" : ""
                    }`}
                  />
                </div>
                {fieldErrors.price && (
                  <p className="mt-1 text-xs text-[var(--color-secondary)]">{fieldErrors.price}</p>
                )}
              </Field>

              <Field label="Original / MRP Price (₹)" hint="Optional. If higher than selling price, shows a SALE discount badge.">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={values.oldPrice}
                    onChange={(e) => set("oldPrice", e.target.value)}
                    placeholder="3499"
                    className={`${inputClass} pl-8`}
                  />
                </div>
                {discountPercent !== null && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Sparkles size={13} />
                    <span>Customer saves {discountPercent}% off MRP! (Tagged SALE)</span>
                  </div>
                )}
              </Field>

              <Field label="Inventory Stock" required hint="Number of units in warehouse.">
                <input
                  type="number"
                  min="0"
                  value={values.stock}
                  onChange={(e) => set("stock", e.target.value)}
                  placeholder="25"
                  className={inputClass}
                />
              </Field>

              <Field label="SKU (Stock Keeping Unit)" required hint="Unique product identifier code.">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={values.sku}
                    onChange={(e) => set("sku", e.target.value.toUpperCase())}
                    placeholder="VRN-MEN-KURTA-001"
                    className={`${inputClass} font-mono ${
                      fieldErrors.sku ? "border-[var(--color-secondary)]/60" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={autoGenerateSku}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white/5 px-3 text-xs font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary-light)] hover:text-white"
                  >
                    <RefreshCw size={14} />
                    Generate
                  </button>
                </div>
                {fieldErrors.sku && (
                  <p className="mt-1 text-xs text-[var(--color-secondary)]">{fieldErrors.sku}</p>
                )}
              </Field>
            </div>
          </motion.section>

          {/* 3. Colors Palette & Swatches */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Palette size={20} className="text-[var(--color-accent)]" />
                  Color Swatches ({values.colors.length})
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Add the available colors. Customers filter by these colors in the store.
                </p>
              </div>
            </div>

            {/* Current Active Colors */}
            {values.colors.length > 0 ? (
              <div className="mb-5 flex flex-wrap gap-2.5">
                {values.colors.map((color, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-white/5 py-1.5 pl-2 pr-3 shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <span
                      className="h-6 w-6 shrink-0 rounded-full border border-white/20 shadow-inner"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight text-white">{color.name}</p>
                      <p className="font-mono text-[10px] text-[var(--color-text-muted)]">{color.hex}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeColor(index)}
                      aria-label={`Remove ${color.name}`}
                      className="ml-1 rounded-md p-1 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-4 rounded-xl border border-dashed border-[var(--color-border)] p-4 text-center text-xs text-[var(--color-text-muted)]">
                No color swatches added yet. Use the presets below or custom color picker!
              </div>
            )}

            {/* Quick Brand Presets */}
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Radha Rani Curated Palette (Click to Add):
              </p>
              <div className="flex flex-wrap gap-2">
                {BRAND_COLOR_PRESETS.map((p) => {
                  const alreadyAdded = values.colors.some(
                    (c) => c.name.toLowerCase() === p.name.toLowerCase()
                  );
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => addColor(p.name, p.hex)}
                      disabled={alreadyAdded}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                        alreadyAdded
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 opacity-60 cursor-default"
                          : "border-[var(--color-border)] bg-white/5 text-[var(--color-text)] hover:border-white/30"
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: p.hex }}
                      />
                      <span>{p.name}</span>
                      {alreadyAdded && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Input */}
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--color-border)] bg-white/5 p-3.5">
              <div className="min-w-[140px] flex-1">
                <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
                  Custom Color Name
                </label>
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="e.g. Royal Emerald"
                  className={inputClass}
                />
              </div>

              <div className="w-24 shrink-0">
                <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
                  Color Picker
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-[var(--color-border)] bg-transparent p-0.5"
                  />
                  <span className="font-mono text-xs text-[var(--color-text-muted)]">
                    {newColorHex}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => addColor()}
                className="btn flex h-10 items-center gap-1.5 rounded-xl px-4 text-xs font-bold"
              >
                <Plus size={15} /> Add Color
              </button>
            </div>
          </motion.section>

          {/* 4. Sizes */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Layers size={20} className="text-[var(--color-primary-light)]" />
                  Available Garment Sizes
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Toggle the sizes available in stock for this cloth item.
                </p>
              </div>
              <button
                type="button"
                onClick={selectAllStandardSizes}
                className="text-xs font-semibold text-[var(--color-primary-light)] hover:underline"
              >
                Select Standard (S–XXL)
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {SIZES.map((size) => {
                const active = values.sizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    aria-pressed={active}
                    className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                      active
                        ? "border-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-md shadow-[var(--color-primary)]/20 scale-105"
                        : "border-[var(--color-border)] bg-white/5 text-[var(--color-text-muted)] hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {active && <Check size={14} />}
                    <span>{size}</span>
                  </button>
                );
              })}
            </div>
          </motion.section>

          {/* 5. Photos & Images */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <ImageIcon size={20} className="text-[var(--color-primary-light)]" />
                  Cloth Photos & Gallery ({values.images.length})
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  The first image is used as the primary hero image. Drag/reorder or click to set primary.
                </p>
              </div>
            </div>

            {/* Direct Upload Dropzone */}
            <div className="mb-5 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-white/[0.02] p-6 text-center transition-colors hover:border-[var(--color-primary-light)]">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="cloth-file-input"
              />
              <label
                htmlFor="cloth-file-input"
                className="flex cursor-pointer flex-col items-center justify-center gap-2.5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]">
                  {uploading ? (
                    <LoaderCircle size={24} className="animate-spin" />
                  ) : (
                    <Upload size={24} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {uploading ? "Uploading to storage…" : "Upload Cloth Photos From Computer / Device"}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    Supports JPG, PNG, WEBP up to 10MB each
                  </p>
                </div>
                <span className="btn btn-primary mt-1 rounded-xl px-4 py-2 text-xs font-bold">
                  Select Photos
                </span>
              </label>
            </div>

            {/* Existing Image Gallery */}
            {values.images.length > 0 && (
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {values.images.map((url, index) => (
                  <div
                    key={index}
                    className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-[var(--color-border)] bg-black/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Cloth photo ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {index === 0 && (
                      <span className="absolute left-2 top-2 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow">
                        Primary Hero
                      </span>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100">
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => makePrimaryImage(index)}
                          title="Make Primary Image"
                          className="rounded-lg bg-white/20 p-2 text-xs font-semibold text-white hover:bg-emerald-600"
                        >
                          ★ Make Hero
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        aria-label={`Remove image ${index + 1}`}
                        title="Delete photo"
                        className="rounded-lg bg-white/20 p-2 text-white hover:bg-red-600"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paste External Image URL */}
            <div className="flex gap-2">
              <input
                type="url"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImageUrl();
                  }
                }}
                placeholder="Or paste an image URL from Unsplash / CDN…"
                className={inputClass}
              />
              <button
                type="button"
                onClick={addImageUrl}
                className="btn flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl text-xs font-bold"
              >
                <Plus size={15} /> Add URL
              </button>
            </div>
          </motion.section>

          {/* 6. Tags & Attributes */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Sliders size={20} className="text-[var(--color-primary-light)]" />
              Tags & Storefront Badges
            </h2>

            <div className="space-y-4">
              <Field label="Search Tags (Comma separated)" hint="e.g. linen, festive, embroidery, vrindavan, flute, wedding">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                    <Tag size={15} />
                  </span>
                  <input
                    type="text"
                    value={values.tags}
                    onChange={(e) => set("tags", e.target.value)}
                    placeholder="silk, festive, krishna, handmade"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </Field>

              <Field label="3D Interactive Model (.glb URL)" hint="Optional 3D model displayed on product page.">
                <input
                  type="url"
                  value={values.model3D}
                  onChange={(e) => set("model3D", e.target.value)}
                  placeholder="https://.../model.glb"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white/5 p-4 transition-colors hover:border-white/20">
                  <input
                    type="checkbox"
                    checked={values.featured}
                    onChange={(e) => set("featured", e.target.checked)}
                    className="h-5 w-5 rounded accent-[var(--color-primary)]"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">Featured / Bestseller</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Show in homepage highlights & bestsellers
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white/5 p-4 transition-colors hover:border-white/20">
                  <input
                    type="checkbox"
                    checked={values.isNewArrival}
                    onChange={(e) => set("isNewArrival", e.target.checked)}
                    className="h-5 w-5 rounded accent-[var(--color-primary)]"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">New Drop (New Arrival)</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Show &apos;NEW&apos; badge in the shop catalogue
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </motion.section>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 p-4 text-sm text-[var(--color-secondary)]"
            >
              {error}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary h-12 min-w-[200px] flex-1 rounded-2xl text-base font-bold shadow-lg shadow-[var(--color-primary)]/30 sm:flex-none"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  {mode === "create" ? "Publishing Cloth…" : "Saving Changes…"}
                </>
              ) : mode === "create" ? (
                <>
                  <Plus size={18} />
                  Publish Cloth to Store
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="btn btn-ghost h-12 rounded-2xl px-6 text-sm font-semibold text-[var(--color-text-muted)] hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Live Storefront Card Preview (4-5 cols)        */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-5 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div className="flex items-center gap-2">
                  <Eye size={17} className="text-[var(--color-primary-light)]" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                    Live Storefront Preview
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  Real-time
                </span>
              </div>

              <p className="mb-4 text-xs text-[var(--color-text-muted)]">
                This is exactly how this garment card will appear to shoppers on the live website:
              </p>

              <div className="mx-auto max-w-[280px]">
                <ProductCard product={previewProduct} eager />
              </div>

              <div className="mt-5 space-y-2 rounded-xl border border-[var(--color-border)] bg-black/20 p-3 text-xs">
                <div className="flex justify-between text-[var(--color-text-muted)]">
                  <span>Category:</span>
                  <span className="font-semibold text-white">{values.category}</span>
                </div>
                <div className="flex justify-between text-[var(--color-text-muted)]">
                  <span>Type:</span>
                  <span className="font-semibold text-white">{values.subcategory || "Kurtas"}</span>
                </div>
                <div className="flex justify-between text-[var(--color-text-muted)]">
                  <span>Stock:</span>
                  <span className="font-semibold text-emerald-400">{values.stock} units</span>
                </div>
                <div className="flex justify-between text-[var(--color-text-muted)]">
                  <span>SKU:</span>
                  <span className="font-mono text-white">{values.sku || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
