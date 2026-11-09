import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface ConnectionProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  offsetPhase?: number;
}

const SingleConnection: React.FC<ConnectionProps> = ({ 
  start, 
  end, 
  color = '#C9B5E8',
  offsetPhase = 0
}) => {
  const beadMeshRef = useRef<THREE.Mesh>(null);

  const { curve, tubeGeometry } = useMemo(() => {
    const vStart = new THREE.Vector3(...start);
    const vEnd = new THREE.Vector3(...end);

    const midPoint = new THREE.Vector3()
      .addVectors(vStart, vEnd)
      .multiplyScalar(0.5);
    midPoint.y = Math.min(start[1], end[1]) - 0.16;

    const bezier = new THREE.QuadraticBezierCurve3(vStart, midPoint, vEnd);
    const geometry = new THREE.TubeGeometry(bezier, 36, 0.042, 12, false);

    return { curve: bezier, tubeGeometry: geometry };
  }, [start, end]);

  // Subtle floating pulse bead along the relationship connection curve
  useFrame(({ clock }) => {
    if (!beadMeshRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const pos = curve.getPointAt(0.35);
      beadMeshRef.current.position.copy(pos);
      return;
    }

    const t = (clock.getElapsedTime() * 0.18 + offsetPhase) % 1;
    const point = curve.getPointAt(t);
    beadMeshRef.current.position.copy(point);
  });

  return (
    <group>
      {/* 3D Connecting Spline Tube */}
      <mesh geometry={tubeGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.32} 
          metalness={0.14}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Decorative Joint Bead / Flowing Pulse */}
      <mesh ref={beadMeshRef} castShadow>
        <sphereGeometry args={[0.088, 24, 24]} />
        <meshPhysicalMaterial 
          color="#9E76D6" 
          emissive="#7046B2"
          emissiveIntensity={0.25}
          roughness={0.2} 
          metalness={0.25} 
        />
      </mesh>
    </group>
  );
};

export interface ConnectionsGroupProps {
  center: [number, number, number];
  targets: [number, number, number][];
  color?: string;
}

export const Connections: React.FC<ConnectionsGroupProps> = ({ center, targets, color }) => {
  return (
    <group>
      {targets.map((target, idx) => (
        <SingleConnection 
          key={idx} 
          start={[center[0], center[1] - 0.35, center[2]]} 
          end={[target[0], target[1] - 0.25, target[2]]} 
          color={color}
          offsetPhase={idx * 0.16}
        />
      ))}
    </group>
  );
};
