'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FlowCore3DProps {
  mouse?: { x: number; y: number };
  scale?: number;
}

export const FlowCore3D: React.FC<FlowCore3DProps> = ({ mouse = { x: 0, y: 0 }, scale = 1 }) => {
  const outerMeshRef = useRef<THREE.Mesh>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const particleGroupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (outerMeshRef.current) {
      outerMeshRef.current.rotation.x = time * 0.2 + mouse.y * 0.3;
      outerMeshRef.current.rotation.y = time * 0.3 + mouse.x * 0.3;
    }

    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.x = -time * 0.4;
      innerMeshRef.current.rotation.z = time * 0.25;
    }

    if (coreMeshRef.current) {
      const pulse = 1 + Math.sin(time * 3) * 0.15;
      coreMeshRef.current.scale.set(pulse, pulse, pulse);
    }

    if (particleGroupRef.current) {
      particleGroupRef.current.rotation.y = time * 0.5;
    }
  });

  return (
    <group scale={[scale, scale, scale]}>
      {/* Outer Wireframe Icosahedron */}
      <mesh ref={outerMeshRef}>
        <icosahedronGeometry args={[1.6, 2]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#7c3aed"
          emissiveIntensity={0.8}
          wireframe
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Inner TorusKnot Energy Beam */}
      <mesh ref={innerMeshRef}>
        <torusKnotGeometry args={[0.9, 0.22, 128, 32]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={1.5}
          wireframe
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Core Glowing Sphere */}
      <mesh ref={coreMeshRef}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#c084fc" emissiveIntensity={3} />
      </mesh>

      {/* Orbiting Ring of Data Particles */}
      <group ref={particleGroupRef}>
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const radius = 2.2;
          return (
            <mesh key={i} position={[Math.cos(angle) * radius, Math.sin(angle) * 0.3, Math.sin(angle) * radius]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};
