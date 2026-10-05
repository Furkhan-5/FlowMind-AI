'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HandSculptures3D } from './HandSculptures3D';
import { Volume2, Shield } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

// Star/Particle field for space environment
const ParticleField3D: React.FC<{ count?: number; speed?: number }> = ({
  count = 4000,
  speed = 1,
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25;
    }
    return pos;
  });

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.03 * speed;
      pointsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.02) * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#a855f7"
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Shockwave Ring on Fingertip Touch
const TouchShockwave3D: React.FC<{ active: boolean }> = ({ active }) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current && active) {
      ringRef.current.scale.x += delta * 6;
      ringRef.current.scale.y += delta * 6;
      const mat = ringRef.current.material as THREE.MeshStandardMaterial;
      if (mat.opacity > 0) {
        mat.opacity -= delta * 0.8;
      }
    }
  });

  if (!active) return null;

  return (
    <mesh ref={ringRef} position={[0, 0.32, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.05, 0.12, 64]} />
      <meshStandardMaterial
        color="#38bdf8"
        emissive="#00f0ff"
        emissiveIntensity={4}
        transparent
        opacity={1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

interface SignatureIntro3DProps {
  onComplete: () => void;
}

const IrisOrbIcon: React.FC = () => (
  <span className="relative flex h-4 w-4 items-center justify-center shrink-0">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
    <svg className="w-4 h-4 text-white relative z-10" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="13" stroke="#e0e7ff" strokeWidth="2.5" className="drop-shadow-[0_0_8px_rgba(192,132,252,0.9)]" />
      <circle cx="16" cy="16" r="8.5" fill="#040209" stroke="#6366f1" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="3" fill="#ffffff" className="drop-shadow-[0_0_10px_rgba(255,255,255,1)]" />
    </svg>
  </span>
);

export const SignatureIntro3D: React.FC<SignatureIntro3DProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [hasTouched, setHasTouched] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [statusText, setStatusText] = useState('INITIALIZING INTELLIGENCE...');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Automatic intro animation sequence
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const startTime = Date.now();
    const duration = 5500; // 5.5s intro duration

    interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);

      if (p < 0.35) {
        setStatusText('ALIGNING NEURAL VECTORS...');
      } else if (p < 0.85) {
        setStatusText('CONNECTING CORE AGENTS...');
      } else if (p >= 0.85 && p < 0.98) {
        setStatusText('ESTABLISHING FINGERTIP CONTACT...');
      } else if (p >= 0.98) {
        setHasTouched(true);
        setStatusText('FLOW ESTABLISHED • FLOWMIND AI REVEALED');
      }

      if (p >= 1) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 1200);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#040209] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[0, 2, 3]} intensity={2} color="#c084fc" />
          <pointLight position={[-3, -2, 2]} intensity={1.5} color="#38bdf8" />
          <directionalLight position={[0, 5, 5]} intensity={1} />

          <ParticleField3D speed={hasTouched ? 3 : 1} />
          <HandSculptures3D progress={progress} mouse={mouse} />
          <TouchShockwave3D active={hasTouched} />
        </Canvas>
      </div>

      {/* Top Header Overlay */}
      <div className="relative z-10 p-6 sm:p-8 max-w-7xl mx-auto w-full flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" showText={true} />
        </div>
      </div>

      {/* Center Cinematic Logo Reveal Overlay */}
      <div className="relative z-10 text-center pointer-events-none px-4">
        {hasTouched ? (
          <div className="space-y-3 animate-fadeIn">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-400 drop-shadow-[0_0_35px_rgba(168,85,247,0.6)]">
              FLOWMIND AI
            </h1>
            <p className="text-sm sm:text-base font-bold text-cyan-300 tracking-widest uppercase animate-pulse">
              Intelligence That Flows
            </p>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-slate-950/90 border border-purple-500/50 text-cyan-300 text-xs font-black tracking-wide backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.4)]">
            <IrisOrbIcon />
            <span>{statusText}</span>
          </div>
        )}
      </div>

      {/* Bottom Progress Indicator Overlay */}
      <div className="relative z-10 p-6 sm:p-8 max-w-7xl mx-auto w-full flex items-center justify-between pointer-events-none">
        <div className="text-[11px] font-mono text-slate-400">
          PROXIMITY: <span className="text-cyan-400 font-bold">{Math.round(progress * 100)}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-purple-600 via-indigo-400 to-cyan-400 transition-all duration-75"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="text-[11px] font-mono text-purple-400 uppercase">
          SECURE 256-BIT WEBGL
        </div>
      </div>
    </div>
  );
};
