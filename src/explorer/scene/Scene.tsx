import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Floor } from './Floor';
import { Plinth } from './Plinth';
import { AmbientSpheres } from './AmbientSpheres';
import { SphereNode } from './SphereNode';
import { Connections } from './Connections';
import { CameraController } from './CameraControls';
import { BusinessObject, RelationshipGroup, CameraState, ExplorerTheme } from '../../types';

export interface SceneProps {
  currentObject: BusinessObject;
  relationshipGroups: RelationshipGroup[];
  selectedGroupId: string | null;
  isDetailsOpen?: boolean;
  onSelectCentral: () => void;
  onSelectGroup: (group: RelationshipGroup) => void;
  onNavigateToObject?: (id: string) => void;
  initialCamera?: CameraState;
  cameraTrigger?: {
    action: 'zoomIn' | 'zoomOut' | 'reset' | 'restore';
    targetState?: CameraState;
    timestamp: number;
  } | null;
  onCameraChange?: (state: CameraState) => void;
  theme?: ExplorerTheme;
  onSceneError?: () => void;
}

export const Scene: React.FC<SceneProps> = ({
  currentObject,
  relationshipGroups,
  selectedGroupId,
  isDetailsOpen = false,
  onSelectCentral,
  onSelectGroup,
  onNavigateToObject,
  initialCamera,
  cameraTrigger,
  onCameraChange,
  theme,
  onSceneError
}) => {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Pointer tracking ref to prevent camera drag from triggering click selections
  const dragTracker = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    dragTracker.current = {
      isDragging: false,
      startX: e.clientX,
      startY: e.clientY
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - dragTracker.current.startX);
    const dy = Math.abs(e.clientY - dragTracker.current.startY);
    if (dx > 5 || dy > 5) {
      dragTracker.current.isDragging = true;
    }
  };

  // Peripheral layout with minimum angular gap to prevent label collisions (Requirement 2.4)
  const peripheralNodes = useMemo(() => {
    const count = relationshipGroups.length;
    if (count === 0) return [];

    const radiusX = 5.8;
    const radiusZ = 4.4;

    return relationshipGroups.map((group, index) => {
      // Distribute evenly with offset start angle for balanced symmetry
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radiusX;
      const z = Math.sin(angle) * radiusZ;
      const y = 0.28;

      return {
        group,
        position: [x, y, z] as [number, number, number]
      };
    });
  }, [relationshipGroups]);

  const targetPositions = useMemo(() => {
    return peripheralNodes.map(p => p.position);
  }, [peripheralNodes]);

  // Single-record group click resolution (Requirement 1.5)
  const handleGroupInteraction = (group: RelationshipGroup) => {
    if (dragTracker.current.isDragging) return;

    if (group.count === 1 && group.recordIds && group.recordIds[0]) {
      // Exactly 1 record: navigate directly to that record
      if (onNavigateToObject) {
        onNavigateToObject(group.recordIds[0]);
      }
    } else {
      // 0 or 2+ records: open collection panel
      onSelectGroup(group);
    }
  };

  const backgroundColor = theme?.background || theme?.backgroundColor || '#F5F3FA';
  const selectionColor = theme?.selection || theme?.selectionColor || '#7046B2';

  return (
    <div 
      className="wos-canvas-container"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClick={(e) => {
        // Prevent empty space click from closing panels or clearing selection (per brief requirement 4)
        e.stopPropagation();
      }}
    >
      {/* 3D Keyboard Accessibility: Accessible mirrored DOM list (Requirement 2.5) */}
      <div 
        className="wos-sr-only-keyboard-nav"
        role="region"
        aria-label="3D scene keyboard navigation"
      >
        <button
          onClick={onSelectCentral}
          onFocus={() => setFocusedNodeId('central')}
          onBlur={() => setFocusedNodeId(null)}
          aria-label={`Central record: ${currentObject.name}, ${currentObject.type}. Press Enter for details.`}
        >
          {currentObject.name}
        </button>
        {relationshipGroups.map((group) => {
          const isSingle = group.count === 1 && Boolean(group.recordIds?.[0]);
          return (
            <button
              key={group.type + '_' + group.label}
              onClick={() => handleGroupInteraction(group)}
              onFocus={() => setFocusedNodeId(group.type)}
              onBlur={() => setFocusedNodeId(null)}
              aria-label={`${group.label} group with ${group.count} records. ${isSingle ? 'Press Enter to open record directly.' : 'Press Enter to open collection panel.'}`}
            >
              {group.label} ({group.count})
            </button>
          );
        })}
      </div>

      <Canvas
        shadows
        dpr={[1, 1.75]} // Requirement 2.6: clamped DPR for performance
        camera={{ position: initialCamera ? initialCamera.position : [0, 8.5, 11.5], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ background: backgroundColor }}
        onCreated={({ gl }) => {
          // WebGL Context Lost Resilience (Requirement 2.7)
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            if (onSceneError) onSceneError();
          });
        }}
      >
        <color attach="background" args={[backgroundColor]} />
        <fog attach="fog" args={[backgroundColor, 16, 42]} />

        {/* Single softbox direction keeps the sphere highlights and shadows coherent. */}
        <ambientLight intensity={0.34} color="#FFFFFF" />
        <directionalLight
          position={[-8, 14, 10]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={35}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
          shadow-bias={-0.0002}
          shadow-normalBias={0.035}
        />

        {/* Matte Floor with Concentric Circular Grooves */}
        <Floor floorColor={backgroundColor} />

        {/* Stepped Plinth Under Central Sphere */}
        <Plinth />

        {/* Ambient Decorative Lilac Spheres */}
        <AmbientSpheres />

        {/* Connecting Curved Tubes with Joint Beads */}
        <Connections
          center={[0, 0.9, 0]}
          targets={targetPositions}
        />

        {/* Central Large Sphere */}
        <SphereNode
          id={currentObject.id}
          isCentral={true}
          type={currentObject.type}
          title={currentObject.name}
          subtitle={currentObject.type.toUpperCase()}
          position={[0, 0.9, 0]}
          theme={theme}
          isSelected={isDetailsOpen || focusedNodeId === 'central'}
          isFocused={focusedNodeId === 'central'}
          onClick={() => {
            if (!dragTracker.current.isDragging) {
              onSelectCentral();
            }
          }}
        />

        {/* Peripheral Related Spheres */}
        {peripheralNodes.map(({ group, position }) => (
          <SphereNode
            key={group.type + '_' + group.label}
            id={group.type}
            isCentral={false}
            type={group.type}
            title={group.label}
            count={group.count}
            position={position}
            theme={theme}
            isSelected={selectedGroupId === group.type || focusedNodeId === group.type}
            isFocused={focusedNodeId === group.type}
            onClick={() => handleGroupInteraction(group)}
          />
        ))}

        {/* Camera Controls & Animation Manager */}
        <CameraController
          initialCamera={initialCamera}
          cameraStateTrigger={cameraTrigger}
          onCameraChange={onCameraChange}
        />
      </Canvas>
    </div>
  );
};
