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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-6 py-10 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-primary)] shadow-[0_0_30px_rgba(236,72,153,0.4)]"
        >
          <Ban size={30} className="text-white" />
        </motion.div>
        <p className="text-lg font-bold text-[var(--color-secondary)]">
          Order Cancelled
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          This order has been cancelled and will no longer be fulfilled.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <ol className="flex flex-col gap-0 md:flex-row md:items-start md:gap-0">
        {STEPS.map((step, index) => {
          const completed = currentIdx >= 0 && index < currentIdx;
          const isCurrent = index === currentIdx;
          const last = index === STEPS.length - 1;

          return (
            <motion.li
              key={step.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: index * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative flex flex-1 pb-6 md:pb-0"
            >
              <div className="flex flex-1 flex-col items-center text-center">
                <div className="relative z-10">
                  {isCurrent ? (
                    <div className="relative">
                      <span className="animate-pulse-glow absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] opacity-60 blur-sm" />
                      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] shadow-[0_0_24px_rgba(124,58,237,0.55)]">
                        <step.Icon size={20} className="text-white" />
                      </span>
                      <span className="animate-ping absolute inset-0 rounded-full bg-[var(--color-primary-light)]/40" />
                    </div>
                  ) : completed ? (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/90 shadow-[0_0_18px_rgba(16,185,129,0.4)]">
                      <CircleCheck size={22} className="text-white" />
                    </span>
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/5">
                      <step.Icon size={20} className="text-[var(--color-text-muted)]" />
                    </span>
                  )}
                </div>

                <p
                  className={`mt-2.5 px-2 text-xs font-semibold sm:text-sm ${
                    isCurrent
                      ? "bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-secondary)] bg-clip-text text-transparent"
                      : completed
                        ? "text-emerald-400"
                        : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-1 rounded-full bg-[var(--color-primary)]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary-light)]"
                  >
                    Current
                  </motion.span>
                )}
              </div>

              {!last && (
                <div
                  className={`absolute left-1/2 top-6 h-0.5 w-full ${
                    completed
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                      : "bg-[var(--color-border)]"
                  } md:left-full md:top-6 md:h-0.5 md:w-full`}
                />
              )}
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
