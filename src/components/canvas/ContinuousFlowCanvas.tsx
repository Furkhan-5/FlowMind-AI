'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FlowCore3D } from './FlowCore3D';
import { NeuralNetwork3D } from './NeuralNetwork3D';
import { NodesConnected3D } from './NodesConnected3D';
import { AutomatePipeline3D } from './AutomatePipeline3D';
import { FlowConvergence3D } from './FlowConvergence3D';

interface ContinuousFlowCanvasProps {
  activeSection: number; // 0 to 5
}

// Background Star Particles
const BackgroundParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = useState(() => {
    const pos = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  });

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
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
        size={0.03}
        color="#a855f7"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Camera & Scene Manager responding to scroll transitions
const SceneManager: React.FC<{ activeSection: number; mouse: { x: number; y: number } }> = ({
  activeSection,
  mouse,
}) => {
  useFrame((state) => {
    // Smooth camera dolly and orbital positioning per active section
    const targetZ = 5 + activeSection * 0.2;
    const targetY = Math.sin(activeSection) * 0.3;
    const targetX = mouse.x * 0.4;

    state.camera.position.x += (targetX - state.camera.position.x) * 0.05;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.05;
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.05;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group>
      {activeSection === 0 && <FlowCore3D mouse={mouse} />}
      {activeSection === 1 && <NeuralNetwork3D />}
      {activeSection === 2 && <NodesConnected3D />}
      {activeSection === 3 && <AutomatePipeline3D />}
      {activeSection === 4 && <FlowCore3D scale={1.4} mouse={mouse} />}
      {activeSection === 5 && <FlowConvergence3D />}
    </group>
  );
};

export const ContinuousFlowCanvas: React.FC<ContinuousFlowCanvasProps> = ({ activeSection }) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

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

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={2} color="#a855f7" />
        <pointLight position={[-5, -5, 5]} intensity={2} color="#38bdf8" />
        <directionalLight position={[0, 10, 5]} intensity={1} />

        <BackgroundParticles />
        <SceneManager activeSection={activeSection} mouse={mouse} />
      </Canvas>
    </div>
  );
};
