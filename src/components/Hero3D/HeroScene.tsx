"use client";

import { useMemo, useRef } from "react";
import type { ReactNode, MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  Sparkles,
  Stars,
  Cloud,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/* Small helpers to keep the scene cheap                               */
/* ------------------------------------------------------------------ */

function prng(n: number, seed = 1): number {
  const x = Math.sin(seed + n * 127.1) * 43758.5453123;
  return x - Math.floor(x);
}

const PALETTE = {
  gold: "#ffe9c4",
  moonlight: "#fdf3e0",
  lavender: "#c4b5fd",
  pink: "#f9a8d4",
  petalDeep: "#ec71b8",
  peacockBlue: "#22d3ee",
  peacockPurple: "#7c3aed",
  peacockGreen: "#34d399",
};

/* ------------------------------------------------------------------ */
/* Moon                                                               */
/* ------------------------------------------------------------------ */

function Moon({ position }: { position: [number, number, number] }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!matRef.current) return;
    const t = state.clock.elapsedTime;
    const pulse = 0.85 + Math.sin(t * 0.6) * 0.08;
    matRef.current.emissive.setScalar(pulse * 0.45);
  });

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[1.6, 48, 48]} />
        <meshStandardMaterial
          ref={matRef}
          color={PALETTE.moonlight}
          emissive={PALETTE.gold}
          emissiveIntensity={0.45}
          roughness={0.55}
          metalness={0.1}
        />
      </mesh>
      {/* soft halo */}
      <mesh>
        <sphereGeometry args={[2.05, 32, 32]} />
        <meshBasicMaterial
          color={PALETTE.gold}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* subtle craters */}
      {[
        [-0.5, 0.45, 1.2],
        [0.55, -0.35, 1.0],
        [0.15, 0.55, 1.35],
        [-0.2, -0.6, 1.2],
        [0.8, 0.15, 0.9],
      ].map((c, i) => (
        <mesh key={i} position={c as [number, number, number]}>
          <circleGeometry args={[0.14, 12]} />
          <meshBasicMaterial
            color={PALETTE.gold}
            transparent
            opacity={0.05}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Peacock feather - custom cone / plane geometry with gradient         */
/* ------------------------------------------------------------------ */

function PeacockFeather({
  position,
  rotation,
  scale = 1,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.z += Math.sin(state.clock.elapsedTime * 0.5) * 0.006;
  });

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale}>
      {/* central spine */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.8, 6]} />
        <meshStandardMaterial
          color={PALETTE.peacockGreen}
          emissive={PALETTE.peacockGreen}
          emissiveIntensity={0.35}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* shimmering eye / disc */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial
          color={PALETTE.peacockBlue}
          emissive={PALETTE.peacockBlue}
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      {/* gradient barb planes */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.18, 0.75, 0]}
          rotation={[0, 0, side * 0.5]}
        >
          <planeGeometry args={[0.28, 1.7]} />
          <meshStandardMaterial
            color={side < 0 ? PALETTE.peacockPurple : PALETTE.peacockBlue}
            emissive={side < 0 ? PALETTE.peacockPurple : PALETTE.peacockBlue}
            emissiveIntensity={0.25}
            transparent
            opacity={0.85}
            roughness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Positional helper for rotating / floating decorative elements        */
/* ------------------------------------------------------------------ */

function FeatherRing({
  count = 7,
  radius = 3.4,
}: {
  count?: number;
  radius?: number;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y += 0.0016;
    group.current.position.y =
      1.2 + Math.sin(state.clock.elapsedTime * 0.25) * 0.25;
  });

  const feathers = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      return {
        pos: [
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        rot: [0, -angle + Math.PI, prng(i, 1) * 0.3] as [
          number,
          number,
          number,
        ],
        scale: 0.7 + prng(i, 2) * 0.6,
      };
    });
  }, [count, radius]);

  return (
    <group ref={group}>
      {feathers.map((f, i) => (
        <PeacockFeather
          key={i}
          position={f.pos}
          rotation={f.rot}
          scale={f.scale}
        />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Flowers - low poly icosahedrons                                     */
/* ------------------------------------------------------------------ */

function Flower({
  position,
  scale = 1,
  color = PALETTE.pink,
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.01;
    ref.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 0.7 + position[0]) * 0.18;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.16, 0, Math.sin(angle) * 0.16]}
            rotation={[0, angle, 0.4]}
          >
            <capsuleGeometry args={[0.05, 0.1, 2, 6]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
              roughness={0.5}
            />
          </mesh>
        );
      })}
      <mesh>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#fef3c7" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Rose petal - flat rounded shapes                                     */
/* ------------------------------------------------------------------ */

function RosePetal({
  position,
  scale = 1,
  color = PALETTE.petalDeep,
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x += 0.005;
    ref.current.rotation.z += Math.sin(state.clock.elapsedTime * 0.8) * 0.008;
    ref.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 1.1 + position[0]) * 0.25;
  });

  return (
    <mesh ref={ref} position={position} scale={scale} rotation={[0.4, 0, 0.2]}>
      <shapeGeometry args={[useMemo(() => petalShape(), [])]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.28}
        roughness={0.6}
        side={THREE.DoubleSide}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

function petalShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.5);
  shape.bezierCurveTo(0.55, -0.3, 0.55, 0.3, 0, 0.5);
  shape.bezierCurveTo(-0.55, 0.3, -0.55, -0.3, 0, -0.5);
  return shape;
}

/* ------------------------------------------------------------------ */
/* Flute - subtle element                                              */
/* ------------------------------------------------------------------ */

function Flute({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
    ref.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.12;
  });

  return (
    <group ref={ref} position={position} rotation={[0.4, 0.5, 0.2]}>
      <mesh>
        <cylinderGeometry args={[0.06, 0.07, 1.6, 10, 1, true]} />
        <meshStandardMaterial
          color="#d4a574"
          emissive="#8a5a3b"
          emissiveIntensity={0.25}
          metalness={0.6}
          roughness={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* hole markers */}
      {[0.4, 0.15, -0.1, -0.35].map((x, i) => (
        <mesh key={i} position={[0, x, 0.07]}>
          <torusGeometry args={[0.02, 0.006, 6, 10]} />
          <meshStandardMaterial color="#3c2a1a" />
        </mesh>
      ))}
      <mesh position={[0, 0.8, 0]}>
        <torusGeometry args={[0.07, 0.012, 8, 16]} />
        <meshStandardMaterial color="#d4a574" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Floating particle field                                             */
/* ------------------------------------------------------------------ */

function FloatingParticles({ count = 120 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const base = new THREE.Color(PALETTE.lavender);
    const pink = new THREE.Color(PALETTE.pink);
    const gold = new THREE.Color(PALETTE.gold);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (prng(i, 3) - 0.5) * 16;
      pos[i * 3 + 1] = prng(i, 4) * 10 - 3;
      pos[i * 3 + 2] = (prng(i, 5) - 0.5) * 14;
      const pick = prng(i, 6);
      const c = pick < 0.5 ? base : pick < 0.8 ? pink : gold;
      c.toArray(col, i * 3);
    }
    return { positions: pos, colors: col };
  }, [count]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.008;
    const a = ref.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < a.count; i++) {
      const y = a.getY(i);
      if (y > 7) a.setY(i, -3);
      else a.setY(i, y + 0.0015);
    }
    a.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* The animated camera rig                                             */
/* ------------------------------------------------------------------ */

function CameraRig({ children }: { children: ReactNode }) {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    state.camera.position.x = 4.5 + Math.sin(t * 0.08) * 1.6;
    state.camera.position.y = 1.4 + Math.sin(t * 0.12) * 0.5;
    state.camera.lookAt(0, 1, 0);
  });
  return <>{children}</>;
}

/* ------------------------------------------------------------------ */
/* Light rig - follows the pointer smoothly                            */
/* ------------------------------------------------------------------ */

type MouseRef = MutableRefObject<{ x: number; y: number }>;

function LightRig({
  mouseRef,
  lightRef,
}: {
  mouseRef: MouseRef;
  lightRef: MutableRefObject<THREE.Group | null>;
}) {
  useFrame((state) => {
    const group = lightRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    group.position.x = mouseRef.current.x * 1.5 + Math.sin(t * 0.3) * 0.2;
    group.position.y = mouseRef.current.y * 1.5 + Math.cos(t * 0.25) * 0.2;
  });
  return (
    <group ref={lightRef}>
      <pointLight
        position={[4, 5, 4]}
        intensity={35}
        color={PALETTE.lavender}
        distance={20}
      />
      <pointLight
        position={[-4, -2, 3]}
        intensity={22}
        color={PALETTE.pink}
        distance={20}
      />
      <pointLight
        position={[2, -3, -4]}
        intensity={18}
        color={PALETTE.peacockBlue}
        distance={18}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

interface HeroSceneProps {
  reducedMotion?: boolean;
  interactive?: boolean;
}

export default function HeroScene({
  reducedMotion = false,
  interactive = true,
}: HeroSceneProps) {
  const mouse = useRef({ x: 0, y: 0 });
  const lightGroup = useRef<THREE.Group>(null);

  const onPointerMove = (e: { clientX: number; clientY: number }) => {
    if (!interactive) return;
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
  };

  return (
    <div
      className="absolute inset-0"
      onPointerMove={onPointerMove}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [4.5, 1.6, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.25} />
        <LightRig mouseRef={mouse} lightRef={lightGroup} />
        <CameraRig>
          <group>
            {/* Central elegant structure (Radha-Krishna inspired silhouette) */}
            <Float speed={reducedMotion ? 0 : 1.5} rotationIntensity={0.3} floatIntensity={reducedMotion ? 0 : 0.6}>
              {/* peacock-throne base */}
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[1.1, 1.5, 0.6, 8]} />
                <meshStandardMaterial
                  color={PALETTE.peacockPurple}
                  emissive={PALETTE.peacockPurple}
                  emissiveIntensity={0.3}
                  roughness={0.4}
                  metalness={0.2}
                />
              </mesh>
              {/* slender spire / gopuram-like tower */}
              <mesh position={[0, 2.6, 0]}>
                <coneGeometry args={[0.7, 3.4, 8]} />
                <meshStandardMaterial
                  color={PALETTE.lavender}
                  emissive={PALETTE.peacockPurple}
                  emissiveIntensity={0.25}
                  roughness={0.35}
                  metalness={0.15}
                />
              </mesh>
              {/* ornamental crown on top */}
              <mesh position={[0, 4.35, 0]}>
                <sphereGeometry args={[0.28, 16, 16]} />
                <meshStandardMaterial
                  color={PALETTE.gold}
                  emissive={PALETTE.gold}
                  emissiveIntensity={0.7}
                  metalness={0.9}
                  roughness={0.2}
                />
              </mesh>
              {/* encircling band */}
              <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.3, 0.08, 12, 40]} />
                <meshStandardMaterial
                  color={PALETTE.gold}
                  emissive={PALETTE.gold}
                  emissiveIntensity={0.5}
                  metalness={0.85}
                  roughness={0.2}
                />
              </mesh>
              {/* lotus petals at base */}
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                return (
                  <mesh
                    key={i}
                    position={[
                      Math.cos(angle) * 1.35,
                      0.35,
                      Math.sin(angle) * 1.35,
                    ]}
                    rotation={[0.4, -angle, 0]}
                  >
                    <planeGeometry args={[0.4, 0.75]} />
                    <meshStandardMaterial
                      color={PALETTE.pink}
                      emissive={PALETTE.pink}
                      emissiveIntensity={0.35}
                      side={THREE.DoubleSide}
                      transparent
                      opacity={0.9}
                    />
                  </mesh>
                );
              })}
            </Float>
          </group>
        </CameraRig>

        {/* Peacock feathers & floating florals */}
        <FeatherRing />
        <Float speed={reducedMotion ? 0 : 2} rotationIntensity={0.4} floatIntensity={reducedMotion ? 0 : 0.8}>
          <Flute position={[2.6, -1.4, 1.4]} />
        </Float>

        <Flower position={[-2.6, 2.4, -1.2]} scale={0.9} color="#f9a8d4" />
        <Flower position={[2.2, 3.4, -1.8]} scale={0.7} color="#c084fc" />
        <Flower position={[-1.8, -1.6, 2.2]} scale={0.8} color="#ec71b8" />
        <Flower position={[3.4, 0.4, -2.4]} scale={0.6} color="#a78bfa" />

        <RosePetal position={[-3.2, 1.2, 0.6]} scale={0.9} color="#fb7185" />
        <RosePetal position={[3.6, 2.2, -0.4]} scale={0.7} color="#ec71b8" />
        <RosePetal position={[-1.4, 3.8, -1.6]} scale={0.8} color="#f472b6" />
        <RosePetal position={[1.6, -1.2, 2.6]} scale={0.6} color="#f472b6" />

        {/* Moon, clouds, stars, atmosphere */}
        <Moon position={[-4.6, 3.8, -5]} />
        <Stars
          radius={40}
          depth={40}
          count={reducedMotion ? 800 : 1600}
          factor={3}
          saturation={0.4}
          fade
          speed={reducedMotion ? 0 : 0.6}
        />
        <Cloud position={[-3, 1.4, -2]} speed={reducedMotion ? 0 : 0.2} opacity={0.35} />
        <Cloud position={[3.4, 2.4, -3]} speed={reducedMotion ? 0 : 0.15} opacity={0.3} />
        <Cloud position={[0.5, -1.6, -1]} speed={reducedMotion ? 0 : 0.18} opacity={0.25} />

        <Sparkles
          count={reducedMotion ? 30 : 80}
          scale={[16, 10, 14]}
          size={2.5}
          speed={reducedMotion ? 0 : 0.4}
          color={PALETTE.gold}
        />

        <FloatingParticles count={reducedMotion ? 60 : 120} />

        <ContactShadows
          position={[0, -2.6, 0]}
          opacity={0.5}
          scale={18}
          blur={2.6}
          far={8}
          color="#3b0764"
        />
      </Canvas>
    </div>
  );
}
