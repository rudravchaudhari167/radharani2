"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Ban,
  Package,
  CircleCheck,
  CreditCard,
  Boxes,
  PackageSearch,
  Truck,
  MapPinned,
  House,
} from "lucide-react";

export type OrderStatusType =
  | "ORDER_PLACED"
  | "PAYMENT_CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

interface Step {
  key: OrderStatusType;
  label: string;
  Icon: LucideIcon;
}

const STEPS: Step[] = [
  { key: "ORDER_PLACED", label: "Order Placed", Icon: Package },
  { key: "PAYMENT_CONFIRMED", label: "Payment Confirmed", Icon: CreditCard },
  { key: "PROCESSING", label: "Processing", Icon: Boxes },
  { key: "PACKED", label: "Packed", Icon: PackageSearch },
  { key: "SHIPPED", label: "Shipped", Icon: Truck },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", Icon: MapPinned },
  { key: "DELIVERED", label: "Delivered", Icon: House },
];

const ACTIVE_STEPS: OrderStatusType[] = STEPS.map((s) => s.key);

function currentStepIndex(orderStatus: OrderStatusType): number {
  const idx = ACTIVE_STEPS.indexOf(orderStatus);
  return idx >= 0 ? idx : -1;
}

interface OrderTimelineProps {
  orderStatus: OrderStatusType;
}

export default function OrderTimeline({ orderStatus }: OrderTimelineProps) {
  const cancelled = orderStatus === "CANCELLED";
  const currentIdx = currentStepIndex(orderStatus);

  if (cancelled) {
    return (
      <div className="flex flex-col items-center justify-center rounded-sm border border-red-200 bg-red-50/50 px-6 py-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <Ban size={22} />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wider text-red-700">
          Order Cancelled
        </p>
        <p className="mt-1 text-xs text-[#666666]">
          This order was cancelled and will no longer be fulfilled.
        </p>
      </div>
    );
  }

  return (
    <div className="relative py-2">
      <ol className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7 lg:gap-2">
        {STEPS.map((step, index) => {
          const completed = currentIdx >= 0 && index < currentIdx;
          const isCurrent = index === currentIdx;

          return (
            <motion.li
              key={step.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 mb-2.5">
                {isCurrent ? (
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#171717] text-white shadow-sm ring-4 ring-[#171717]/10">
                    <step.Icon size={18} />
                  </div>
                ) : completed ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2D4A6B] text-white">
                    <CircleCheck size={18} />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E7E3DC] bg-[#FAF9F6] text-[#999999]">
                    <step.Icon size={16} />
                  </div>
                )}
              </div>

              <p
                className={`text-xs font-medium tracking-tight ${
                  isCurrent
                    ? "font-semibold text-[#171717]"
                    : completed
                    ? "text-[#2D4A6B]"
                    : "text-[#999999]"
                }`}
              >
                {step.label}
              </p>
              {isCurrent && (
                <span className="mt-1 inline-block rounded bg-[#F4F1EA] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#171717]">
                  Current
                </span>
              )}
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
