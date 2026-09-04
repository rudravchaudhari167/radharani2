import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICartItem {
  productId: mongoose.Types.ObjectId | string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

export interface ICheckoutPending {
  addressId: string;
  shippingMethod: "STANDARD" | "EXPRESS";
  couponCode?: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  razorpayOrderId: string;
  createdAt: Date;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId | string;
  items: ICartItem[];
  checkoutPending?: ICheckoutPending;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    image: {
      type: String,
      default: "",
    },
    size: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    items: {
      type: [CartItemSchema],
      default: [],
    },
    checkoutPending: {
      type: new Schema<ICheckoutPending>(
        {
          addressId: { type: String, required: true },
          shippingMethod: {
            type: String,
            enum: ["STANDARD", "EXPRESS"],
            required: true,
          },
          couponCode: { type: String },
          subtotal: { type: Number, required: true },
          discount: { type: Number, required: true, default: 0 },
          shipping: { type: Number, required: true, default: 0 },
          total: { type: Number, required: true },
          razorpayOrderId: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
        { _id: false }
      ),
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

CartSchema.index({ userId: 1 }, { unique: true });

const Cart: Model<ICart> =
  (mongoose.models.Cart as Model<ICart>) ||
  mongoose.model<ICart>("Cart", CartSchema);

export default Cart;
