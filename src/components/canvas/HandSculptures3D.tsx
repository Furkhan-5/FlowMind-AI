'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HandSculptures3DProps {
  progress: number; // 0 (far apart) to 1 (touching)
  mouse: { x: number; y: number };
}

// Helper to render procedural 3D wireframe digital hand sculpture
const SingleHand3D: React.FC<{
  isLeft: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  proximity: number;
}> = ({ isLeft, position, rotation, proximity }) => {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (glowRef.current) {
      // Pulse fingertip energy as proximity increases
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 8) * 0.2 + proximity * 0.8;
      glowRef.current.scale.set(scale, scale, scale);
    }
  });

  const color = isLeft ? '#8b5cf6' : '#06b6d4';
  const emissive = isLeft ? '#7c3aed' : '#0891b2';

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Palm Base Wireframe Structure */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.2]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.6 + proximity * 0.8}
          wireframe
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Palm Core Glowing Node */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
      </mesh>

      {/* Index Finger (Pointing forward) */}
      <group position={[isLeft ? 0.15 : -0.15, 0.35, 0]}>
        {/* Joint 1 */}
        <mesh position={[0, 0.15, 0.1]}>
          <cylinderGeometry args={[0.04, 0.05, 0.3, 8]} />
          <meshStandardMaterial color={color} wireframe transparent opacity={0.9} />
        </mesh>
        {/* Joint 2 */}
        <mesh position={[0, 0.35, 0.2]}>
          <cylinderGeometry args={[0.03, 0.04, 0.25, 8]} />
          <meshStandardMaterial color={color} wireframe transparent opacity={0.9} />
        </mesh>
        {/* Index Tip (The touching contact point) */}
        <group position={[0, 0.52, 0.3]}>
          <mesh ref={glowRef}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={isLeft ? '#a855f7' : '#22d3ee'}
              emissiveIntensity={2 + proximity * 3}
            />
          </mesh>
        </group>
      </group>

      {/* Thumb */}
      <group position={[isLeft ? -0.25 : 0.25, -0.1, 0]} rotation={[0, 0, isLeft ? 0.6 : -0.6]}>
        <mesh position={[0, 0.15, 0.1]}>
          <cylinderGeometry args={[0.04, 0.05, 0.25, 8]} />
          <meshStandardMaterial color={color} wireframe transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Middle Finger */}
      <group position={[isLeft ? 0.05 : -0.05, 0.35, -0.05]}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.32, 8]} />
          <meshStandardMaterial color={color} wireframe transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Ring Finger */}
      <group position={[isLeft ? -0.05 : 0.05, 0.33, -0.1]}>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.035, 0.045, 0.28, 8]} />
          <meshStandardMaterial color={color} wireframe transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Pinky Finger */}
      <group position={[isLeft ? -0.15 : 0.15, 0.28, -0.12]}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.22, 8]} />
          <meshStandardMaterial color={color} wireframe transparent opacity={0.7} />
        </mesh>
      </group>
    </group>
  );
};

export const HandSculptures3D: React.FC<HandSculptures3DProps> = ({ progress, mouse }) => {
  const lineRef = useRef<THREE.Line>(null);

  // Calculate hand positions based on intro animation progress (0 -> 1)
  const leftX = -3.2 + progress * 3.12; // Moves from -3.2 to -0.08
  const rightX = 3.2 - progress * 3.12;  // Moves from 3.2 to 0.08

  const mouseTiltX = mouse.y * 0.15;
  const mouseTiltY = mouse.x * 0.15;

  return (
    <group position={[0, -0.2, 0]}>
      {/* Hand 1 (Left Hand Sculpture) */}
      <SingleHand3D
        isLeft={true}
        position={[leftX, 0, 0]}
        rotation={[0.3 + mouseTiltX, 0.4 + mouseTiltY, -0.2]}
        proximity={progress}
      />

      {/* Hand 2 (Right Hand Sculpture) */}
      <SingleHand3D
        isLeft={false}
        position={[rightX, 0, 0]}
        rotation={[0.3 + mouseTiltX, -0.4 + mouseTiltY, 0.2]}
        proximity={progress}
      />

      {/* Energy Plasma Arc between approaching fingertips */}
      {progress > 0.3 && progress < 0.98 && (
        <mesh position={[(leftX + rightX) / 2, 0.32, 0.3]}>
          <boxGeometry args={[Math.abs(rightX - leftX), 0.02, 0.02]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={2 * progress}
            transparent
            opacity={progress * 0.9}
          />
        </mesh>
      )}
    </group>
  );
};
