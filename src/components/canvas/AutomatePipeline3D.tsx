'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export const AutomatePipeline3D: React.FC = () => {
  const particleRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const STAGES = [
    { label: '01. INPUT', pos: [-3.5, 0, 0], color: '#38bdf8' },
    { label: '02. INTELLIGENCE', pos: [-1.75, 0.4, 0], color: '#c084fc' },
    { label: '03. DECISION', pos: [0, 0, 0], color: '#a855f7' },
    { label: '04. ACTION', pos: [1.75, -0.4, 0], color: '#38bdf8' },
    { label: '05. RESULT', pos: [3.5, 0, 0], color: '#34d399' },
  ];

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (particleRef.current) {
      // Move pulse along pipeline path
      const progress = (time * 0.4) % 1;
      const x = -3.5 + progress * 7;
      const y = Math.sin(progress * Math.PI * 2) * 0.4;
      particleRef.current.position.set(x, y, 0);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Stage Nodes */}
      {STAGES.map((stage, i) => (
        <group key={i} position={stage.pos as [number, number, number]}>
          <mesh>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color={stage.color} emissive={stage.color} emissiveIntensity={1.5} wireframe />
          </mesh>
          <Text position={[0, -0.35, 0]} fontSize={0.16} color="#ffffff" anchorX="center">
            {stage.label}
          </Text>
        </group>
      ))}

      {/* Traveling Energy Pulse Sphere */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#38bdf8" emissiveIntensity={4} />
      </mesh>
    </group>
  );
};
