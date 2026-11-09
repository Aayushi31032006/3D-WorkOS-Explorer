import React, { useMemo } from 'react';

interface AmbientSphereData {
  position: [number, number, number];
  scale: number;
}

export const AmbientSpheres: React.FC = () => {
  // Ambient spheres scattered gently around the scene matching Figure 1
  const spheres = useMemo<AmbientSphereData[]>(() => [
    { position: [-6.8, -0.38, -2.5], scale: 0.22 },
    { position: [-4.5, -0.42, -5.2], scale: 0.18 },
    { position: [-0.2, -0.45, -4.8], scale: 0.15 },
    { position: [5.8, -0.36, -3.2], scale: 0.24 },
    { position: [7.2, -0.42, 1.8], scale: 0.18 },
    { position: [4.6, -0.46, 5.0], scale: 0.14 },
    { position: [-0.4, -0.48, 4.4], scale: 0.12 },
    { position: [-5.5, -0.39, 3.6], scale: 0.21 },
    { position: [-2.8, -0.45, 3.2], scale: 0.11 }
  ], []);

  return (
    <group>
      {spheres.map((s, idx) => (
        <mesh 
          key={idx} 
          position={s.position} 
          scale={s.scale} 
          castShadow 
          receiveShadow
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            color="#D9C7F3" 
            roughness={0.25} 
            metalness={0.08} 
          />
        </mesh>
      ))}
    </group>
  );
};
