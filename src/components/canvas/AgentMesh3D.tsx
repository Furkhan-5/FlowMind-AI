'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Cylinder, Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const LavenderBuilding = () => {
  const buildingRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (buildingRef.current) {
      buildingRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={buildingRef} position={[0, -0.6, 0]}>
      {/* Base Steps */}
      <Box args={[3.2, 0.2, 2.2]} position={[0, -0.6, 0]}>
        <meshStandardMaterial color="#ddd6fe" roughness={0.3} />
      </Box>
      <Box args={[2.8, 0.2, 1.8]} position={[0, -0.4, 0]}>
        <meshStandardMaterial color="#c4b5fd" roughness={0.3} />
      </Box>

      {/* Columns (Classic Bank/Temple structure as in Pinterest design) */}
      {[-1, -0.33, 0.33, 1].map((x, i) => (
        <Cylinder key={i} args={[0.15, 0.15, 1.2, 32]} position={[x, 0.3, 0.6]}>
          <meshStandardMaterial color="#e9d5ff" metalness={0.2} roughness={0.2} />
        </Cylinder>
      ))}

      {/* Triangular Pediment / Roof */}
      <mesh position={[0, 1.1, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0, 1.8, 0.6, 4]} />
        <meshStandardMaterial color="#a78bfa" roughness={0.3} />
      </mesh>
    </group>
  );
};

export const AgentMesh3D: React.FC = () => {
  return (
    <div className="w-full h-64 rounded-3xl overflow-hidden relative border border-purple-200/50 bg-gradient-to-b from-purple-100/40 to-purple-200/30">
      <Canvas camera={{ position: [0, 0.5, 4.5], fov: 45 }}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[8, 12, 8]} intensity={1.5} color="#c084fc" />
        <pointLight position={[-8, -5, -5]} intensity={1} color="#8b5cf6" />
        <LavenderBuilding />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.8} />
      </Canvas>
    </div>
  );
};
