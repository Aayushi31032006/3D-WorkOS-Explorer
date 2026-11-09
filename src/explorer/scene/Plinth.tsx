import React from 'react';

export const Plinth: React.FC = () => {
  return (
    <group position={[0, -0.6, 0]}>
      {/* Lower plinth tier */}
      <mesh receiveShadow castShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[2.2, 2.3, 0.16, 64]} />
        <meshStandardMaterial 
          color="#EDE7F6" 
          roughness={0.4} 
          metalness={0.1} 
        />
      </mesh>
      {/* Upper plinth tier with subtle chamfer/rim */}
      <mesh receiveShadow castShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[1.9, 2.0, 0.12, 64]} />
        <meshStandardMaterial 
          color="#FBF9FE" 
          roughness={0.3} 
          metalness={0.12} 
        />
      </mesh>
    </group>
  );
};
