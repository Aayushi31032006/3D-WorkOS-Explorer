import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CameraState } from '../../types';

export interface CameraControlsProps {
  initialCamera?: CameraState;
  cameraStateTrigger?: {
    action: 'zoomIn' | 'zoomOut' | 'reset' | 'restore';
    targetState?: CameraState;
    timestamp: number;
  } | null;
  onCameraChange?: (state: CameraState) => void;
  transitionDurationMs?: number;
}

const DEFAULT_CAMERA_POS: [number, number, number] = [0, 8.5, 11.5];
const DEFAULT_TARGET: [number, number, number] = [0, 0, 0];

export const CameraController: React.FC<CameraControlsProps> = ({
  initialCamera,
  cameraStateTrigger,
  onCameraChange,
  transitionDurationMs = 400
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Apply initialCamera immediately upon controls mount (Requirement 1.8)
  useEffect(() => {
    if (controlsRef.current && !isInitializedRef.current) {
      isInitializedRef.current = true;
      if (initialCamera) {
        camera.position.set(...initialCamera.position);
        controlsRef.current.target.set(...initialCamera.target);
        if (initialCamera.zoom) {
          camera.zoom = initialCamera.zoom;
        }
        controlsRef.current.update();
        camera.updateProjectionMatrix();
      }
    }
  }, [initialCamera, camera]);

  // Animation interpolation state
  const animRef = useRef<{
    active: boolean;
    startTime: number;
    duration: number;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
  }>({
    active: false,
    startTime: 0,
    duration: 400,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3()
  });

  // Handle external trigger buttons (+, -, Reset, Restore)
  useEffect(() => {
    if (!cameraStateTrigger || !controlsRef.current) return;

    const controls = controlsRef.current;
    const currentPos = camera.position.clone();
    const currentTarget = controls.target.clone();

    // Check prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveDuration = prefersReducedMotion ? 50 : transitionDurationMs;

    let targetPos = currentPos.clone();
    let targetLook = currentTarget.clone();

    if (cameraStateTrigger.action === 'zoomIn') {
      const dir = currentPos.clone().sub(currentTarget).multiplyScalar(0.78);
      targetPos = currentTarget.clone().add(dir);
    } else if (cameraStateTrigger.action === 'zoomOut') {
      const dir = currentPos.clone().sub(currentTarget).multiplyScalar(1.25);
      targetPos = currentTarget.clone().add(dir);
    } else if (cameraStateTrigger.action === 'reset') {
      targetPos = new THREE.Vector3(...DEFAULT_CAMERA_POS);
      targetLook = new THREE.Vector3(...DEFAULT_TARGET);
    } else if (cameraStateTrigger.action === 'restore' && cameraStateTrigger.targetState) {
      targetPos = new THREE.Vector3(...cameraStateTrigger.targetState.position);
      targetLook = new THREE.Vector3(...cameraStateTrigger.targetState.target);
    }

    animRef.current = {
      active: true,
      startTime: performance.now(),
      duration: effectiveDuration,
      startPos: currentPos,
      endPos: targetPos,
      startTarget: currentTarget,
      endTarget: targetLook
    };
  }, [cameraStateTrigger, camera, transitionDurationMs]);

  // Frame update for smooth 300-500ms easing
  useFrame(() => {
    const anim = animRef.current;
    if (!anim.active || !controlsRef.current) return;

    const now = performance.now();
    const elapsed = now - anim.startTime;
    const progress = Math.min(1, elapsed / anim.duration);

    // Cubic ease out: 1 - (1 - progress)^3
    const ease = 1 - Math.pow(1 - progress, 3);

    camera.position.lerpVectors(anim.startPos, anim.endPos, ease);
    controlsRef.current.target.lerpVectors(anim.startTarget, anim.endTarget, ease);
    controlsRef.current.update();

    if (progress >= 1) {
      anim.active = false;
      if (onCameraChange && controlsRef.current) {
        onCameraChange({
          position: [camera.position.x, camera.position.y, camera.position.z],
          target: [controlsRef.current.target.x, controlsRef.current.target.y, controlsRef.current.target.z],
          zoom: camera.zoom
        });
      }
    }
  });

  return (
    <DreiOrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={4}
      maxDistance={22}
      maxPolarAngle={Math.PI / 2.05} // don't go below floor
      target={initialCamera ? initialCamera.target : DEFAULT_TARGET}
      onEnd={() => {
        if (onCameraChange && controlsRef.current) {
          onCameraChange({
            position: [camera.position.x, camera.position.y, camera.position.z],
            target: [controlsRef.current.target.x, controlsRef.current.target.y, controlsRef.current.target.z],
            zoom: camera.zoom
          });
        }
      }}
    />
  );
};
