"use client";

import { useEffect, useRef } from "react";

interface Petal {
  x: number;
  y: number;
  size: number;
  vy: number;
  vx: number;
  rotation: number;
  rotSpeed: number;
  phase: number;
  swaySpeed: number;
  swayAmplitude: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
  gravity: number;
  active: boolean;
}

const PETAL_COLORS = [
  "rgba(236, 72, 153, ",  // pink
  "rgba(244, 114, 182, ", // light pink
  "rgba(219, 39, 119, ",  // deep pink
  "rgba(168, 85, 247, ",  // purple
  "rgba(124, 58, 237, ",  // violet
  "rgba(192, 132, 252, ", // light purple
  "rgba(212, 165, 116, ", // gold
];

const POOL_SIZE = 300;

function createPetal(pool: Petal[], x: number, y: number): Petal | null {
  for (let i = 0; i < pool.length; i++) {
    if (!pool[i].active) {
      const p = pool[i];
      p.x = x;
      p.y = y;
      p.size = 4 + Math.random() * 8;
      p.vy = 0.5 + Math.random() * 1.5;
      p.vx = -0.3 + Math.random() * 0.6;
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (-0.04 + Math.random() * 0.08) * (Math.random() > 0.5 ? 1 : -1);
      p.phase = Math.random() * Math.PI * 2;
      p.swaySpeed = 0.008 + Math.random() * 0.02;
      p.swayAmplitude = 0.2 + Math.random() * 0.5;
      p.color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
      p.opacity = 0.5 + Math.random() * 0.5;
      p.life = 0;
      p.maxLife = 180 + Math.random() * 240;
      p.gravity = 0.01 + Math.random() * 0.02;
      p.active = true;
      return p;
    }
  }
  return null;
}

export default function RosePetalCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = true;

    const pool: Petal[] = Array.from({ length: POOL_SIZE }, () => ({
      x: 0, y: 0, size: 0, vy: 0, vx: 0, rotation: 0,
      rotSpeed: 0, phase: 0, swaySpeed: 0, swayAmplitude: 0,
      color: "", opacity: 0, life: 0, maxLife: 0, gravity: 0, active: false,
    }));

    let mouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let mouseSpeed = 0;
    let activeCount = 0;
    const MAX_PETALS = 200;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawPetal = (p: Petal) => {
      const fadeProgress = p.life / p.maxLife;
      let alpha = p.opacity;
      if (fadeProgress < 0.1) {
        alpha *= fadeProgress / 0.1;
      } else if (fadeProgress > 0.7) {
        alpha *= (1 - fadeProgress) / 0.3;
      }
      alpha = Math.max(0, Math.min(1, alpha));

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(
        p.size * 0.85, -p.size * 0.55,
        p.size * 0.85, p.size * 0.55,
        0, p.size,
      );
      ctx.bezierCurveTo(
        -p.size * 0.85, p.size * 0.55,
        -p.size * 0.85, -p.size * 0.55,
        0, -p.size,
      );
      ctx.closePath();
      ctx.fillStyle = p.color + "0.7)";
      ctx.fill();

      ctx.restore();
    };

    const spawnAtCursor = (x: number, y: number, count: number) => {
      if (activeCount >= MAX_PETALS) return;
      const spawnable = Math.min(count, MAX_PETALS - activeCount);
      for (let i = 0; i < spawnable; i++) {
        const spreadX = (Math.random() - 0.5) * 30;
        const spreadY = (Math.random() - 0.5) * 30;
        if (createPetal(pool, x + spreadX, y + spreadY)) {
          activeCount += 1;
        }
      }
    };

    const tick = () => {
      if (!running) return;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (!p.active) continue;

        p.life++;
        if (p.life > p.maxLife) {
          p.active = false;
          activeCount -= 1;
          continue;
        }

        p.phase += p.swaySpeed;
        p.vx += Math.sin(p.phase) * p.swayAmplitude * 0.01;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        p.vx *= 0.99;
        p.vy = Math.min(p.vy, 2.5);

        if (p.x < -50 || p.x > width + 50 || p.y > height + 50) {
          p.active = false;
          activeCount -= 1;
          continue;
        }

        drawPetal(p);
      }

      if (mouseDown && mouseSpeed > 1.5) {
        const count = Math.min(4, Math.floor(mouseSpeed * 0.3));
        spawnAtCursor(lastMouseX, lastMouseY, count);
      }

      frame = requestAnimationFrame(tick);
    };

    const onPointerMove = (e: PointerEvent) => {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      mouseSpeed = Math.sqrt(dx * dx + dy * dy);
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      if (!mouseDown) {
        if (prefersReducedMotion) {
          if (mouseSpeed > 12) {
            spawnAtCursor(e.clientX, e.clientY, 1);
          }
        } else {
          if (mouseSpeed > 4) {
            const count = Math.min(3, Math.floor(mouseSpeed * 0.15));
            spawnAtCursor(e.clientX, e.clientY, count);
          }
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      mouseDown = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      mouseSpeed = 0;
      if (!prefersReducedMotion) {
        spawnAtCursor(e.clientX, e.clientY, 3);
      }
    };

    const onPointerUp = () => {
      mouseDown = false;
      mouseSpeed = 0;
    };

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      mouseDown = true;
      lastMouseX = touch.clientX;
      lastMouseY = touch.clientY;
      if (!prefersReducedMotion) {
        spawnAtCursor(touch.clientX, touch.clientY, 2);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - lastMouseX;
      const dy = touch.clientY - lastMouseY;
      mouseSpeed = Math.sqrt(dx * dx + dy * dy);
      lastMouseX = touch.clientX;
      lastMouseY = touch.clientY;

      if (prefersReducedMotion) {
        if (mouseSpeed > 15) {
          spawnAtCursor(touch.clientX, touch.clientY, 1);
        }
      } else {
        if (mouseSpeed > 3) {
          const count = Math.min(3, Math.floor(mouseSpeed * 0.2));
          spawnAtCursor(touch.clientX, touch.clientY, count);
        }
      }
    };

    const onTouchEnd = () => {
      mouseDown = false;
      mouseSpeed = 0;
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else {
        running = true;
        frame = requestAnimationFrame(tick);
      }
    };

    resize();
    frame = requestAnimationFrame(tick);

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60]"
    />
  );
}
