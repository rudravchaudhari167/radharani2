"use client";

import { Suspense, use } from "react";
import CreativeShopExperience from "./CreativeShopExperience";
import ShopPageContent from "./ShopPageContent";

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

function ShopInner({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = use(searchParams);
  const rawCategory = Array.isArray(params.category)
    ? params.category[params.category.length - 1]
    : params.category;

  // If explicitly queried with category or search query params, render the filtered catalogue view;
  // Otherwise, render the unique creative lookbook boutique experience!
  const hasSpecificQuery = Boolean(params.search || params.size || params.color || params.minPrice || params.maxPrice);

  if (hasSpecificQuery) {
    return (
      <ShopPageContent
        presetCategory={rawCategory ? String(rawCategory) : null}
        fixedCategory={false}
      />
    );
  }

  return <CreativeShopExperience />;
}

export default function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-10 pt-28 sm:px-6 lg:px-8">
          <div className="skeleton mb-8 h-8 w-56" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="glass-card overflow-hidden">
                <div className="skeleton aspect-[4/5] rounded-none" />
                <div className="p-4">
                  <div className="skeleton mb-2 h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ShopInner searchParams={searchParams} />
    </Suspense>
  );
}