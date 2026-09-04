"use client";

import { Suspense, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Stars,
  useGLTF,
  Sparkles,
  Text,
} from "@react-three/drei";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/* GLB model loader                                                    */
/* ------------------------------------------------------------------ */

function GLBModel({ url, scale = 1.2 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url);
  return (
    <group scale={scale}>
      <primitive object={scene} position={[0, 0, 0]} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Procedural presentation: rotating cloth-like torus knot with image   */
/* ------------------------------------------------------------------ */

function ClothVisual({
  imageUrl,
  name,
  reducedMotion,
}: {
  imageUrl?: string;
  name?: string;
  reducedMotion?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const texture = useMemoTexture(imageUrl);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y += reducedMotion ? 0 : 0.004;
      groupRef.current.position.y =
        0.3 + Math.sin(t * 0.5) * (reducedMotion ? 0 : 0.2);
    }
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(t * 0.3) * (reducedMotion ? 0 : 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <torusKnotGeometry args={[1.1, 0.42, 160, 24]} />
        <meshStandardMaterial
          map={texture ?? undefined}
          color={texture ? "#ffffff" : "#a78bfa"}
          metalness={texture ? 0.35 : 0.5}
          roughness={texture ? 0.25 : 0.2}
          emissive="#7c3aed"
          emissiveIntensity={0.12}
          wireframe={!texture}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.7, 0.02, 12, 64]} />
        <meshBasicMaterial color="#ec4899" transparent opacity={0.5} />
      </mesh>

      {/* floating petals / dust */}
      <Sparkles
        count={reducedMotion ? 20 : 50}
        scale={[6, 6, 6]}
        size={2}
        speed={reducedMotion ? 0 : 0.5}
        color="#f472b6"
      />

      {/* Product name in 3D space */}
      {name && (
        <Text
          position={[0, -2.4, 0]}
          fontSize={0.22}
          color="#e9d5ff"
          letterSpacing={0.08}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
        >
          {name.toUpperCase()}
        </Text>
      )}
    </group>
  );
}

function useMemoTexture(imageUrl?: string): THREE.Texture | undefined {
  return useMemo(() => {
    if (!imageUrl) return undefined;
    const t = new THREE.TextureLoader().load(imageUrl);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [imageUrl]);
}

/* ------------------------------------------------------------------ */
/* Scene contents                                                      */
/* ------------------------------------------------------------------ */

function ViewerContent({
  modelUrl,
  image,
  name,
  reducedMotion,
}: {
  modelUrl?: string;
  image?: string;
  name?: string;
  reducedMotion?: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 5, 4]} intensity={30} color="#a78bfa" />
      <pointLight position={[-4, -2, 3]} intensity={20} color="#ec4899" />
      <pointLight position={[2, -3, -4]} intensity={16} color="#22d3ee" />
      <directionalLight position={[0, 6, 6]} intensity={1.2} castShadow />

      {modelUrl ? (
        <>
          <GLBModel url={modelUrl} scale={1.2} />
          {name && (
            <Text
              position={[0, -2.6, 0]}
              fontSize={0.2}
              color="#e9d5ff"
              letterSpacing={0.06}
              textAlign="center"
              anchorX="center"
              anchorY="middle"
            >
              {name.toUpperCase()}
            </Text>
          )}
        </>
      ) : (
        <ClothVisual imageUrl={image} name={name} reducedMotion={reducedMotion} />
      )}

      <Stars
        radius={20}
        depth={20}
        count={reducedMotion ? 300 : 700}
        factor={3}
        saturation={0.3}
        fade
        speed={reducedMotion ? 0 : 0.5}
      />
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.6}
        scale={9}
        blur={2.6}
        far={6}
        color="#3b0764"
      />

      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={10}
        autoRotate={!reducedMotion}
        autoRotateSpeed={1.2}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Root                                                               */
/* ------------------------------------------------------------------ */

interface ProductViewer3DProps {
  modelUrl?: string;
  image?: string;
  name?: string;
  className?: string;
}

export default function ProductViewer3D({
  modelUrl,
  image,
  name = "Divine Piece",
  className = "",
}: ProductViewer3DProps) {
  const [resetKey, setResetKey] = useState(0);
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

  const resetView = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <Canvas
        key={resetKey}
        shadows
        dpr={[1, 1.6]}
        camera={{ position: [0, 0.4, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        onDoubleClick={resetView}
      >
        <Suspense fallback={null}>
          <ViewerContent
            modelUrl={modelUrl}
            image={image}
            name={name}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-center">
        <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-medium tracking-wide text-white/60 backdrop-blur-sm">
          Drag to rotate &middot; Scroll to zoom &middot; Double-click to reset
        </div>
      </div>
    </div>
  );
}
