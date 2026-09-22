'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Float, OrbitControls, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const PurpleLandscape = () => {
  const landscapeRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (landscapeRef.current) {
      landscapeRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group>
      {/* 3D Botanical / Floral Terrain Mesh */}
      <mesh ref={landscapeRef} position={[0, -1.8, 0]} rotation={[-Math.PI / 6, 0, 0]}>
        <planeGeometry args={[18, 10, 64, 64]} />
        <MeshDistortMaterial
          color="#6b21a8"
          roughness={0.4}
          metalness={0.2}
          distort={0.4}
          speed={1.5}
        />
      </mesh>

      {/* 3D Metallic Coins / Spheres Floating (as seen in Pinterest reference) */}
      <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
        <Cylinder args={[1.2, 1.2, 0.25, 64]} position={[-2.2, 0.4, 0.5]} rotation={[Math.PI / 4, Math.PI / 6, 0]}>
          <meshStandardMaterial color="#c084fc" metalness={0.9} roughness={0.1} />
        </Cylinder>
      </Float>

      <Float speed={2.5} rotationIntensity={1.2} floatIntensity={2}>
        <Cylinder args={[1.4, 1.4, 0.28, 64]} position={[2.4, 0.6, -0.2]} rotation={[Math.PI / 3, -Math.PI / 4, 0]}>
          <meshStandardMaterial color="#e9d5ff" metalness={0.95} roughness={0.08} />
        </Cylinder>
      </Float>

      <Float speed={1.8} rotationIntensity={0.8} floatIntensity={1}>
        <Sphere args={[0.5, 32, 32]} position={[0, 0.8, 0.8]}>
          <meshStandardMaterial color="#a855f7" emissive="#7e22ce" emissiveIntensity={0.5} roughness={0.2} />
        </Sphere>
      </Float>
    </group>
  );
};

export const Hero3DCanvas: React.FC = () => {
  return (
    <div className="w-full h-72 sm:h-96 rounded-3xl overflow-hidden relative shadow-bloom border border-purple-200/50 bg-gradient-to-b from-purple-100/50 via-purple-50/30 to-purple-200/40">
      <Canvas camera={{ position: [0, 0.5, 5], fov: 45 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 15, 10]} intensity={1.8} color="#f472b6" />
        <pointLight position={[-10, -5, -5]} intensity={1.2} color="#a855f7" />
        <PurpleLandscape />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.6} />
      </Canvas>
    </div>
  );
};
