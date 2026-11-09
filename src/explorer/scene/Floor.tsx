import React, { useMemo } from 'react';
import * as THREE from 'three';

export interface FloorProps {
  grooveColor?: string;
  floorColor?: string;
}

export const Floor: React.FC<FloorProps> = ({ 
  grooveColor = '#E3DCF2', 
  floorColor = '#F5F3FA' 
}) => {
  // Concentric circular grooves matching Figure 1
  const rings = useMemo(() => [2.6, 3.8, 5.2, 6.6, 8.0, 9.8], []);

  return (
    <group position={[0, -0.6, 0]}>
      {/* Soft shadow receiver plane */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial 
          color={floorColor} 
          roughness={0.92} 
          metalness={0.04} 
        />
      </mesh>

      {/* Subtle concentric circular grooves */}
      {rings.map((radius, idx) => (
        <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002 + idx * 0.0005, 0]}>
          <ringGeometry args={[radius - 0.018, radius + 0.018, 128]} />
          <meshBasicMaterial 
            color={grooveColor} 
            transparent 
            opacity={0.45} 
            depthWrite={false} 
          />
        </mesh>
      ))}
    </group>
  );
};
