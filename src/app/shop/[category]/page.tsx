"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CategoryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/shop");
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center pt-28">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
    </div>
  );
}