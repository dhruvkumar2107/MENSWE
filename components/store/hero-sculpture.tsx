"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, ContactShadows, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function Sculpture() {
  const knot = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (knot.current) {
      knot.current.rotation.x = THREE.MathUtils.lerp(knot.current.rotation.x, -0.4 + state.pointer.y * 0.3, 0.05);
      knot.current.rotation.y = t * 0.25 + state.pointer.x * 0.6;
    }
    if (ring.current) {
      ring.current.rotation.x = t * 0.12;
      ring.current.rotation.z = -t * 0.18;
    }
    if (group.current) {
      group.current.position.y = Math.sin(t * 0.6) * 0.12;
    }
  });

  return (
    <group ref={group}>
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1.1}>
        <group ref={knot}>
          {/* Signature twisted knot — brushed gold */}
          <mesh>
            <torusKnotGeometry args={[1.05, 0.32, 280, 40]} />
            <meshStandardMaterial
              color="#B89B62"
              metalness={0.85}
              roughness={0.22}
              envMapIntensity={1.4}
            />
          </mesh>
          {/* Inner obsidian band */}
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={1.35}>
            <torusGeometry args={[0.62, 0.05, 24, 80]} />
            <meshStandardMaterial color="#101010" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Orbit spheres */}
          {[0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * 1.7, Math.sin(angle) * 1.7, Math.sin(angle) * 0.4]}
              >
                <sphereGeometry args={[0.07, 24, 24]} />
                <meshStandardMaterial color="#F7F4EF" metalness={0.9} roughness={0.15} />
              </mesh>
            );
          })}
        </group>

        {/* Oversized wire ring */}
        <mesh ref={ring} rotation={[0.6, 0.2, 0]} scale={2.05}>
          <torusGeometry args={[1.15, 0.012, 16, 120]} />
          <meshBasicMaterial color="#B89B62" transparent opacity={0.55} />
        </mesh>
      </Float>

      <ContactShadows position={[0, -2.4, 0]} opacity={0.45} scale={9} blur={2.6} far={3.4} color="#000000" />
      <Sparkles count={46} scale={5.5} size={2.2} speed={0.4} opacity={0.5} color="#B89B62" />
    </group>
  );
}

export default function HeroSculpture() {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 6.4], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 4]} intensity={1.1} color="#fff4e0" />
      <spotLight position={[-5, 3, -4]} intensity={0.8} color="#B89B62" angle={0.5} penumbra={1} />
      <pointLight position={[0, -3, 3]} intensity={0.35} color="#B89B62" />
      <Sculpture />
    </Canvas>
  );
}