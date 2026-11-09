import React, { useState, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { 
  Building2, 
  FileText, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Box, 
  CreditCard, 
  FileCheck 
} from 'lucide-react';
import { ObjectType, ExplorerTheme } from '../../types';

export interface SphereNodeProps {
  id: string;
  isCentral?: boolean;
  type: ObjectType;
  title: string;
  subtitle?: string;
  count?: number;
  position: [number, number, number];
  theme?: ExplorerTheme;
  isSelected?: boolean;
  isFocused?: boolean;
  onClick: () => void;
}

export const SphereNode: React.FC<SphereNodeProps> = ({
  id,
  isCentral = false,
  type,
  title,
  subtitle,
  count,
  position,
  theme,
  isSelected = false,
  isFocused = false,
  onClick
}) => {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  // Subtle floating motion using Three.js useFrame
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const time = clock.getElapsedTime();
    // Peripheral spheres have a gentle desynchronized floating bob
    if (!isCentral) {
      const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const bob = Math.sin(time * 1.5 + hash) * 0.045;
      groupRef.current.position.y = position[1] + bob;
    }
  });

  // Brief colors: central #B897E3, related #D3BFEF, selection #7046B2, label #30264C
  const centralColor = theme?.central || theme?.centralSphereColor || '#B897E3';
  const relatedColor = theme?.related || theme?.relatedSphereColor || '#D3BFEF';
  const selectionColor = theme?.selection || theme?.selectionColor || '#7046B2';
  const labelColor = theme?.label || theme?.labelColor || '#30264C';

  const sphereColor = isCentral ? centralColor : relatedColor;
  const radius = isCentral ? 1.35 : 0.72;
  const currentScale = hovered || isFocused ? 1.06 : 1.0;

  // Icons matching object types in Figure 1
  const getIcon = () => {
    const size = isCentral ? 22 : 18;
    switch (type) {
      case 'customer':
        return <Building2 size={size} color={labelColor} />;
      case 'invoice':
        return <FileText size={size} color={labelColor} />;
      case 'project':
        return <FolderKanban size={size} color={labelColor} />;
      case 'task':
        return <CheckSquare size={size} color={labelColor} />;
      case 'person':
        return <Users size={size} color={labelColor} />;
      case 'product':
        return <Box size={size} color={labelColor} />;
      case 'payment':
        return <CreditCard size={size} color={labelColor} />;
      case 'contract':
        return <FileCheck size={size} color={labelColor} />;
      default:
        return <FileText size={size} color={labelColor} />;
    }
  };

  // Truncate long names for peripheral pills with ellipsis (Requirement 2.4)
  const displayTitle = title.length > 20 ? `${title.slice(0, 18)}…` : title;

  return (
    <group 
      ref={groupRef}
      position={position}
      scale={[currentScale, currentScale, currentScale]}
    >
      {/* 3D Sphere Mesh with physical shader */}
      <mesh
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhysicalMaterial
          color={sphereColor}
          roughness={0.28}
          metalness={0.12}
          clearcoat={0.35}
          clearcoatRoughness={0.2}
          reflectivity={0.6}
        />
      </mesh>

      {/* Selection / Hover Indicator Ring */}
      {(isSelected || hovered || isFocused) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -radius - 0.05, 0]}>
          <ringGeometry args={[radius + 0.12, radius + 0.22, 64]} />
          <meshBasicMaterial 
            color={selectionColor} 
            transparent 
            opacity={isSelected || isFocused ? 0.9 : 0.45} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}

      {/* Upright Billboarding HTML Overlay with contrast halo */}
      <Html
        position={[0, 0, 0]}
        center
        distanceFactor={14}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: labelColor,
          userSelect: 'none',
          fontFamily: 'Inter, sans-serif'
        }}>
          {isCentral ? (
            /* Central Sphere Label: Type on top, Name below */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textShadow: '0 0 6px rgba(255, 255, 255, 0.9), 0 1px 2px rgba(255, 255, 255, 0.8)'
            }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.85,
                color: labelColor,
                marginBottom: '2px'
              }}>
                {subtitle || type}
              </span>
              <span style={{
                fontSize: '17px',
                fontWeight: 800,
                color: labelColor,
                whiteSpace: 'nowrap',
                lineHeight: 1.2
              }}>
                {title}
              </span>
            </div>
          ) : (
            /* Related Sphere: Icon in sphere center */
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.95
            }}>
              {getIcon()}
            </div>
          )}
        </div>
      </Html>

      {/* Label Under Related Sphere (Pill with soft halo and count) */}
      {!isCentral && (
        <Html
          position={[0, -radius - 0.44, 0]}
          center
          distanceFactor={13}
          style={{ pointerEvents: 'none' }}
        >
          <div 
            title={title}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              padding: '4px 12px',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(8px)',
              borderRadius: '9999px',
              border: `1px solid ${isSelected || isFocused ? selectionColor : 'rgba(112, 70, 178, 0.16)'}`,
              boxShadow: isSelected || isFocused 
                ? `0 0 0 2px ${selectionColor}, 0 4px 12px rgba(48, 38, 76, 0.12)` 
                : '0 4px 12px rgba(48, 38, 76, 0.08)',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              userSelect: 'none',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 700,
                color: labelColor,
                letterSpacing: '-0.01em'
              }}>
                {displayTitle}
              </span>
              {typeof count === 'number' && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: selectionColor,
                  background: 'rgba(112, 70, 178, 0.08)',
                  padding: '1px 6px',
                  borderRadius: '9999px'
                }}>
                  ({count})
                </span>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};
