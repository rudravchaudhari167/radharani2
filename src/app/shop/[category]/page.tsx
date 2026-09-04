"use client";

import { Suspense, use } from "react";
import ShopPageContent from "../ShopPageContent";

type CategoryParams = Promise<{ category: string }>;

function CategoryInner({ params }: { params: CategoryParams }) {
  const { category } = use(params);
  return <ShopPageContent presetCategory={category} fixedCategory />;
}

export default function CategoryPage({ params }: { params: CategoryParams }) {
  return (
    <Suspense
      fallback={
        <div className="relative overflow-hidden border-b border-[var(--color-border)] bg-gradient-to-br from-purple-900/70 to-black/70">
          <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
            <div className="skeleton mb-6 h-4 w-40" />
            <div className="skeleton mb-3 h-6 w-64" />
            <div className="skeleton h-12 w-72" />
            <div className="skeleton mt-4 h-4 w-full max-w-xl" />
          </div>
        </div>
      }
    >
      <CategoryInner params={params} />
    </Suspense>
  );
}