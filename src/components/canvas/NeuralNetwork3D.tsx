'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const NeuralNetwork3D: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  // Generate 24 3D neural nodes
  const nodes = React.useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      position: [
        (Math.sin(i * 1.3) * 2.5),
        (Math.cos(i * 0.9) * 2),
        (Math.sin(i * 2.1) * 2),
      ] as [number, number, number],
      id: i,
    }));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Nodes */}
      {nodes.map((node) => (
        <mesh key={node.id} position={node.position}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={2} />
        </mesh>
      ))}

      {/* Connections between nearby nodes */}
      {nodes.map((n1, i) =>
        nodes.slice(i + 1).map((n2, j) => {
          const dist = new THREE.Vector3(...n1.position).distanceTo(new THREE.Vector3(...n2.position));
          if (dist < 2.2) {
            return (
              <line key={`${i}-${j}`}>
                <bufferGeometry
                  attach="geometry"
                  onUpdate={(geo) => {
                    geo.setFromPoints([
                      new THREE.Vector3(...n1.position),
                      new THREE.Vector3(...n2.position),
                    ]);
                  }}
                />
                <lineBasicMaterial attach="material" color="#38bdf8" transparent opacity={0.4} />
              </line>
            );
          }
          return null;
        })
      )}
    </group>
  );
};
