"use client";

interface LoadingSkeletonProps {
  variant?: "grid" | "card" | "row";
  count?: number;
}

function CardSkeleton() {
  return (
    <div className="glass-card overflow-hidden" aria-hidden="true">
      <div className="skeleton aspect-[4/5] rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-1/2" />
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="glass-card flex gap-4 p-3" aria-hidden="true">
      <div className="skeleton h-24 w-24 shrink-0 rounded-xl" />
      <div className="flex flex-1 flex-col justify-center gap-2">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Loading skeletons used while product data is being fetched.
 * Renders a full grid of 8 by default.
 */
export default function LoadingSkeleton({
  variant = "grid",
  count = 8,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "row") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
