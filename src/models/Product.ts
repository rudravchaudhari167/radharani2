import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IColor {
  name: string;
  hex: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice?: number;
  category: "MEN" | "WOMEN" | "UNISEX" | "KIDS" | "ACCESSORIES";
  subcategory: string;
  images: string[];
  model3D?: string;
  sizes: string[];
  colors: IColor[];
  stock: number;
  sku: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  featured: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ColorSchema = new Schema<IColor>(
  {
    name: {
      type: String,
      required: [true, "Color name is required"],
    },
    hex: {
      type: String,
      required: [true, "Color hex is required"],
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color"],
    },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    oldPrice: {
      type: Number,
      min: [0, "Old price cannot be negative"],
    },
    category: {
      type: String,
      enum: ["MEN", "WOMEN", "UNISEX", "KIDS", "ACCESSORIES"],
      required: [true, "Category is required"],
    },
    subcategory: {
      type: String,
      trim: true,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    model3D: {
      type: String,
      default: "",
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [ColorSchema],
      default: [],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be below 0"],
      max: [5, "Rating cannot exceed 5"],
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, "Review count cannot be negative"],
    },
    tags: {
      type: [String],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ category: 1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ isNewArrival: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ tags: 1 });

const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct>) ||
  mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
