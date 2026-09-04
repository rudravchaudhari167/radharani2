"use client";

import { Suspense, lazy, useEffect, useState } from "react";
import { motion } from "framer-motion";

const HeroScene = lazy(() => import("./HeroScene"));

const FALLBACK_GRADIENTS: Array<[string, string]> = [
  ["rgba(124,58,237,0.22)", "rgba(236,72,153,0.12)"],
  ["rgba(236,72,153,0.18)", "rgba(124,58,237,0.10)"],
  ["rgba(167,139,250,0.16)", "rgba(244,114,182,0.10)"],
];

function SceneFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Ambient nebula blobs while the 3D scene loads */}
      {FALLBACK_GRADIENTS.map(([c1, c2], i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${c1}, ${c2})`,
            width: `${34 + i * 10}vw`,
            height: `${34 + i * 10}vw`,
          }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.15, 1] }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="absolute inset-0 backdrop-blur-[2px]" />
    </div>
  );
}

/**
 * Lazy-loads and renders the Hero 3D scene so it never blocks the
 * initial HTML paint. Respects prefers-reduced-motion.
 */
export default function Hero3D() {
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const container = document.getElementById("hero-3d");
    if (!container) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "120px" },
    );
    io.observe(container);
    return () => io.disconnect();
  }, []);

  return (
    <div
      id="hero-3d"
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {isVisible ? (
        <Suspense fallback={<SceneFallback />}>
          <HeroScene reducedMotion={reducedMotion} interactive={!reducedMotion} />
        </Suspense>
      ) : (
        <SceneFallback />
      )}
    </div>
  );
}
