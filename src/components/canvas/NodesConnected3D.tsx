'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export const NodesConnected3D: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  const NODES_DATA = [
    { label: 'DATA', pos: [-2.2, 1.2, 0], color: '#38bdf8' },
    { label: 'TOOLS', pos: [2.2, 1.2, 0], color: '#a855f7' },
    { label: 'FLOWMIND AI', pos: [0, 0, 0.4], color: '#ffffff', isCenter: true },
    { label: 'PEOPLE', pos: [-2.2, -1.2, 0], color: '#34d399' },
    { label: 'WORKFLOWS', pos: [2.2, -1.2, 0], color: '#f43f5e' },
  ];

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.2;
    }
  });

  const centerPos = new THREE.Vector3(0, 0, 0.4);

  return (
    <group ref={groupRef}>
      {NODES_DATA.map((node, i) => (
        <group key={i} position={node.pos as [number, number, number]}>
          <mesh>
            <sphereGeometry args={[node.isCenter ? 0.35 : 0.22, 32, 32]} />
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={node.isCenter ? 2.5 : 1.5}
            />
          </mesh>

          <Text
            position={[0, node.isCenter ? -0.55 : -0.4, 0]}
            fontSize={0.2}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {node.label}
          </Text>

          {/* 3D Energy Connection Line to Center AI Core */}
          {!node.isCenter && (
            <line>
              <bufferGeometry
                attach="geometry"
                onUpdate={(geo) => {
                  geo.setFromPoints([new THREE.Vector3(0, 0, 0), centerPos.clone().sub(new THREE.Vector3(...node.pos))]);
                }}
              />
              <lineBasicMaterial attach="material" color={node.color} transparent opacity={0.7} />
            </line>
          )}
        </group>
      ))}
    </group>
  );
};
