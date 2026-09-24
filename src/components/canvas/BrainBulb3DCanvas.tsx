'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 3D Glowing Brain-in-Lightbulb Core (360° Rotatable Logo)
const BrainLightbulbLogo3D = () => {
  const logoGroupRef = useRef<THREE.Group>(null!);
  const brainLeftRef = useRef<THREE.Mesh>(null!);
  const brainRightRef = useRef<THREE.Mesh>(null!);
  const neonRingRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    // 360-degree continuous rotation
    if (logoGroupRef.current) {
      logoGroupRef.current.rotation.y += delta * 0.7;
    }
    // Gentle pulsing distortion for brain neural activity
    if (brainLeftRef.current) {
      brainLeftRef.current.rotation.x += delta * 0.2;
    }
    if (brainRightRef.current) {
      brainRightRef.current.rotation.x -= delta * 0.2;
    }
    if (neonRingRef.current) {
      neonRingRef.current.rotation.z += delta * 0.3;
    }
  });

  return (
    <group ref={logoGroupRef} position={[0, 0.05, 0]}>
      {/* --- NEON LIGHTBULB OUTER SHELL --- */}
      {/* Glass Bulb Top Dome */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.9, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.75]} />
        <meshPhysicalMaterial
          color="#fef08a"
          emissive="#f59e0b"
          emissiveIntensity={0.6}
          transmission={0.85}
          opacity={0.7}
          transparent
          roughness={0.15}
          ior={1.3}
          thickness={0.5}
        />
      </mesh>

      {/* Outer Glowing Neon Bulb Wireframe Ring */}
      <mesh ref={neonRingRef} position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.92, 0.035, 16, 100]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={2.5}
          roughness={0.1}
        />
      </mesh>

      {/* --- 3D NEON GLOWING BRAIN (INSIDE BULB) --- */}
      {/* Left Hemisphere */}
      <mesh ref={brainLeftRef} position={[-0.22, 0.42, 0]}>
        <sphereGeometry args={[0.38, 32, 32]} />
        <MeshDistortMaterial
          color="#fbbf24"
          emissive="#d97706"
          emissiveIntensity={1.8}
          roughness={0.2}
          metalness={0.3}
          distort={0.45}
          speed={2.2}
        />
      </mesh>

      {/* Right Hemisphere */}
      <mesh ref={brainRightRef} position={[0.22, 0.42, 0]}>
        <sphereGeometry args={[0.38, 32, 32]} />
        <MeshDistortMaterial
          color="#fbbf24"
          emissive="#d97706"
          emissiveIntensity={1.8}
          roughness={0.2}
          metalness={0.3}
          distort={0.45}
          speed={2.2}
        />
      </mesh>

      {/* Central Neural Stem / Filament */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.5, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={2}
          roughness={0.2}
        />
      </mesh>

      {/* --- BULB METALLIC SCREW BASE --- */}
      {/* Threaded Collar 1 */}
      <mesh position={[0, -0.32, 0]}>
        <cylinderGeometry args={[0.34, 0.3, 0.12, 32]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Threaded Collar 2 */}
      <mesh position={[0, -0.44, 0]}>
        <cylinderGeometry args={[0.3, 0.26, 0.12, 32]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Threaded Collar 3 */}
      <mesh position={[0, -0.56, 0]}>
        <cylinderGeometry args={[0.26, 0.18, 0.12, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Base Contact Point */}
      <mesh position={[0, -0.65, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#d97706" emissive="#b45309" emissiveIntensity={1} />
      </mesh>
    </group>
  );
};

// 3D Sculpted Porcelain Hands Cupping the Floating Logo
const PorcelainHands3D = () => {
  const topHandRef = useRef<THREE.Group>(null!);
  const bottomHandRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Subtle floating gesture motion
    if (topHandRef.current) {
      topHandRef.current.position.y = 1.35 + Math.sin(t * 1.5) * 0.05;
    }
    if (bottomHandRef.current) {
      bottomHandRef.current.position.y = -1.35 - Math.sin(t * 1.5) * 0.05;
    }
  });

  const handMaterial = (
    <meshStandardMaterial
      color="#f8fafc"
      roughness={0.28}
      metalness={0.08}
    />
  );

  return (
    <group>
      {/* --- TOP HAND (Reaching down from Top Right) --- */}
      <group ref={topHandRef} position={[0.75, 1.35, 0.2]} rotation={[0.4, -0.5, -2.6]}>
        {/* Main Palm */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.7, 0.25, 0.9]} />
          {handMaterial}
        </mesh>
        {/* Wrist Extension */}
        <mesh position={[0.7, 0.2, -0.2]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.3, 0.45, 1.4, 32]} />
          {handMaterial}
        </mesh>
        {/* Index Finger */}
        <mesh position={[-0.45, -0.05, 0.35]} rotation={[0, 0, 0.4]}>
          <capsuleGeometry args={[0.07, 0.55, 8, 16]} />
          {handMaterial}
        </mesh>
        {/* Middle Finger */}
        <mesh position={[-0.5, -0.05, 0.12]} rotation={[0, 0, 0.35]}>
          <capsuleGeometry args={[0.075, 0.62, 8, 16]} />
          {handMaterial}
        </mesh>
        {/* Ring Finger */}
        <mesh position={[-0.46, -0.05, -0.12]} rotation={[0, 0, 0.3]}>
          <capsuleGeometry args={[0.07, 0.55, 8, 16]} />
          {handMaterial}
        </mesh>
        {/* Pinky Finger */}
        <mesh position={[-0.4, -0.05, -0.35]} rotation={[0, 0, 0.25]}>
          <capsuleGeometry args={[0.06, 0.45, 8, 16]} />
          {handMaterial}
        </mesh>
        {/* Thumb */}
        <mesh position={[-0.1, -0.2, 0.45]} rotation={[0.6, 0.4, 0.8]}>
          <capsuleGeometry args={[0.08, 0.45, 8, 16]} />
          {handMaterial}
        </mesh>
      </group>

      {/* --- BOTTOM HAND (Reaching up from Bottom Left) --- */}
      <group ref={bottomHandRef} position={[-0.75, -1.35, -0.2]} rotation={[-0.4, 0.5, 0.5]}>
        {/* Main Palm */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.7, 0.25, 0.9]} />
          {handMaterial}
        </mesh>
        {/* Wrist Extension */}
        <mesh position={[-0.7, -0.2, 0.2]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.45, 0.3, 1.4, 32]} />
          {handMaterial}
        </mesh>
        {/* Index Finger */}
        <mesh position={[0.45, 0.05, -0.35]} rotation={[0, 0, -0.4]}>
          <capsuleGeometry args={[0.07, 0.55, 8, 16]} />
          {handMaterial}
        </mesh>
        {/* Middle Finger */}
        <mesh position={[0.5, 0.05, -0.12]} rotation={[0, 0, -0.35]}>
          <capsuleGeometry args={[0.075, 0.62, 8, 16]} />
          {handMaterial}
        </mesh>
        {/* Ring Finger */}
        <mesh position={[0.46, 0.05, 0.12]} rotation={[0, 0, -0.3]}>
          <capsuleGeometry args={[0.07, 0.55, 8, 16]} />
          {handMaterial}
        </mesh>
        {/* Pinky Finger */}
        <mesh position={[0.4, 0.05, 0.35]} rotation={[0, 0, -0.25]}>
          <capsuleGeometry args={[0.06, 0.45, 8, 16]} />
          {handMaterial}
        </mesh>
        {/* Thumb */}
        <mesh position={[0.1, 0.2, -0.45]} rotation={[-0.6, -0.4, -0.8]}>
          <capsuleGeometry args={[0.08, 0.45, 8, 16]} />
          {handMaterial}
        </mesh>
      </group>
    </group>
  );
};

export const BrainBulb3DCanvas: React.FC<{ heightClassName?: string }> = ({
  heightClassName = 'h-80 sm:h-[420px]',
}) => {
  return (
    <div
      className={`w-full ${heightClassName} rounded-[32px] overflow-hidden relative shadow-bloom-lg border border-amber-300/30 bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/80`}
    >
      {/* Top Banner Tag */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md border border-amber-500/30 text-amber-300 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        3D Brain-Bulb Logo &bull; 360° Interactive Canvas
      </div>

      <Canvas camera={{ position: [0, 0, 4.8], fov: 45 }}>
        {/* Lighting Setup */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[8, 12, 10]} intensity={1.8} color="#fef08a" />
        <directionalLight position={[-8, -10, -5]} intensity={1.2} color="#a855f7" />
        <pointLight position={[0, 0, 2]} intensity={2.5} color="#fbbf24" distance={5} />

        {/* Floating 360° Rotating Brain-Bulb Logo cupped between Porcelain Hands */}
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
          <BrainLightbulbLogo3D />
          <PorcelainHands3D />
        </Float>

        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={1.5}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
};
