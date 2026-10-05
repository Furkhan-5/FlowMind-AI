'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const FlowConvergence3D: React.FC = () => {
  const torusRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (torusRef.current) {
      torusRef.current.rotation.x = time * 0.4;
      torusRef.current.rotation.y = time * 0.6;
    }

    if (coreRef.current) {
      const scale = 1 + Math.sin(time * 4) * 0.2;
      coreRef.current.scale.set(scale, scale, scale);
    }

    if (groupRef.current) {
      groupRef.current.rotation.z = time * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Unified 3D Torus Knot Convergence Ring */}
      <mesh ref={torusRef}>
        <torusKnotGeometry args={[1.8, 0.35, 160, 32]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#38bdf8"
          emissiveIntensity={2}
          wireframe
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Central Supernova Energy Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#c084fc" emissiveIntensity={4} />
      </mesh>

      {/* Outer Orbiting Data Ring */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[2.5, 2.55, 64]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
