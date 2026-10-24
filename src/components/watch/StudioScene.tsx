import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, ContactShadows } from '@react-three/drei';
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  N8AO,
  Vignette,
} from '@react-three/postprocessing';
import { CalloutPartId, DialColorId, StrapTypeId } from '../../types/watch';
import { getWatchTextureBundle } from '../../three/proceduralTextures';
import { MeridianWatch, WatchPoseState } from './MeridianWatch';

export interface CameraTargetState {
  camX: number;
  camY: number;
  camZ: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  focusDistance: number;
  bokehScale: number;
}

interface StudioSceneProps {
  dialColor: DialColorId;
  strapType: StrapTypeId;
  activeCallout: CalloutPartId;
  onSelectCallout: (part: CalloutPartId) => void;
  poseRef: React.MutableRefObject<WatchPoseState>;
  cameraRef: React.MutableRefObject<CameraTargetState>;
  isPaused: boolean;
  showCalloutPins: boolean;
  reducedMotion: boolean;
  isMobile: boolean;
  enablePostProcessing?: boolean;
  enableStudioEnv?: boolean;
  onReady?: () => void;
}

/**
 * Binds the procedural high-dynamic-range Studio Softbox Equirectangular Texture
 * to scene.environment using PMREMGenerator for physically accurate anisotropic reflections.
 */
const StudioEnvironmentBinder: React.FC<{
  enabled: boolean;
  onReady?: () => void;
}> = ({ enabled, onReady }) => {
  const { gl, scene } = useThree();

  useEffect(() => {
    if (!enabled) {
      scene.environment = null;
      if (onReady) onReady();
      return;
    }

    const bundle = getWatchTextureBundle();
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const envTarget = pmrem.fromEquirectangular(bundle.studioEnvMap);
    scene.environment = envTarget.texture;
    pmrem.dispose();

    if (onReady) {
      onReady();
    }

    return () => {
      envTarget.dispose();
    };
  }, [gl, scene, enabled, onReady]);

  return null;
};

/**
 * Subtle floating dust particles catching the studio key light in Section 1 (Hero).
 */
const AtmosphericDust: React.FC<{ isPaused: boolean; count: number }> = ({
  isPaused,
  count,
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 11.0;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5.5;
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, phases: ph };
  }, [count]);

  useFrame((state) => {
    if (isPaused || !pointsRef.current) return;
    const t = state.clock.elapsedTime;
    const posAttr = pointsRef.current.geometry.attributes
      .position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const baseY = positions[i * 3 + 1];
      const phase = phases[i];
      posAttr.setY(i, baseY + Math.sin(t * 0.35 + phase) * 0.18);
    }
    posAttr.needsUpdate = true;
    pointsRef.current.rotation.y = t * 0.018;
  });

  return (
    <points key={count} ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#D8C3A0"
        size={0.026}
        transparent
        opacity={0.34}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

/**
 * Authored Camera Rig: smoothly interpolates camera position & lookAt target
 * driven by GSAP ScrollTrigger + supports user wheel/pinch zoom clamping.
 */
const CameraRig: React.FC<{
  cameraRef: React.MutableRefObject<CameraTargetState>;
  zoomOffsetRef: React.MutableRefObject<number>;
}> = ({ cameraRef, zoomOffsetRef }) => {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const target = cameraRef.current;

    const desiredZ = THREE.MathUtils.clamp(
      target.camZ + zoomOffsetRef.current,
      3.8,
      12.5
    );

    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      target.camX,
      dt * 6.5
    );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      target.camY,
      dt * 6.5
    );
    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z,
      desiredZ,
      dt * 6.5
    );

    currentLookAt.current.x = THREE.MathUtils.lerp(
      currentLookAt.current.x,
      target.lookX,
      dt * 7.5
    );
    currentLookAt.current.y = THREE.MathUtils.lerp(
      currentLookAt.current.y,
      target.lookY,
      dt * 7.5
    );
    currentLookAt.current.z = THREE.MathUtils.lerp(
      currentLookAt.current.z,
      target.lookZ,
      dt * 7.5
    );

    camera.lookAt(currentLookAt.current);
  });

  return null;
};

export const StudioScene: React.FC<StudioSceneProps> = ({
  dialColor,
  strapType,
  activeCallout,
  onSelectCallout,
  poseRef,
  cameraRef,
  isPaused,
  showCalloutPins,
  reducedMotion,
  isMobile,
  enablePostProcessing = true,
  enableStudioEnv = true,
  onReady,
}) => {
  const zoomOffsetRef = useRef(0);

  return (
    <div
      className="relative w-full h-full select-none"
      role="region"
      aria-label="Interactive 3D Meridian Calibre M-01 Chronometer. Drag to rotate the timepiece; use buttons to inspect the crown, sapphire crystal, date window, and 316L steel lugs."
    >
      <Canvas
        shadows
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 0.1, 8.6], fov: 34, near: 0.1, far: 45 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        onPointerMissed={() => onSelectCallout(null)}
      >
        <AdaptiveDpr pixelated />
        <StudioEnvironmentBinder enabled={enableStudioEnv} onReady={onReady} />
        <CameraRig cameraRef={cameraRef} zoomOffsetRef={zoomOffsetRef} />

        {/* =============================================================== */}
        {/* STUDIO LIGHTING (Key Light w/ Dial Shadows, Rim Light, Fill)    */}
        {/* =============================================================== */}
        <ambientLight intensity={0.35} color="#c5d6e8" />

        {/* Key Softbox Directional Light — Casts crisp hand & index shadows onto the dial */}
        <directionalLight
          position={[3.6, 4.8, 5.4]}
          intensity={1.65}
          color="#FFF7EA"
          castShadow
          shadow-mapSize-width={isMobile ? 1024 : 2048}
          shadow-mapSize-height={isMobile ? 1024 : 2048}
          shadow-camera-near={1}
          shadow-camera-far={16}
          shadow-camera-left={-3.2}
          shadow-camera-right={3.2}
          shadow-camera-top={3.2}
          shadow-camera-bottom={-3.2}
          shadow-bias={-0.00035}
        />

        {/* Cool Steel Architectural Rim Light (grazes lug chamfers & sapphire edge) */}
        <spotLight
          position={[-5.2, 3.2, 3.4]}
          angle={0.55}
          penumbra={0.85}
          intensity={1.75}
          color="#9CC4EB"
        />

        {/* Warm Champagne Counter-Rim Light (illuminates exhibition movement & crown) */}
        <spotLight
          position={[4.5, -2.6, 3.8]}
          angle={0.6}
          penumbra={0.9}
          intensity={1.45}
          color="#E5C89B"
        />

        {/* Subtle Front Dial Fill Light */}
        <pointLight position={[-2.4, -1.5, 4.2]} intensity={0.65} color="#D8E6F5" />

        {/* =============================================================== */}
        {/* THE 3D MERIDIAN WATCH                                           */}
        {/* =============================================================== */}
        <MeridianWatch
          dialColor={dialColor}
          strapType={strapType}
          activeCallout={activeCallout}
          onSelectCallout={onSelectCallout}
          poseRef={poseRef}
          isPaused={isPaused}
          showCalloutPins={showCalloutPins}
          reducedMotion={reducedMotion}
        />

        {/* =============================================================== */}
        {/* VOLUMETRIC DUST & GROUND REFLECTION + CONTACT SHADOWS           */}
        {/* =============================================================== */}
        {!reducedMotion && (
          <AtmosphericDust isPaused={isPaused} count={isMobile ? 36 : 85} />
        )}

        <ContactShadows
          position={[0, -2.95, 0]}
          opacity={0.58}
          scale={11}
          blur={2.4}
          far={4.8}
          resolution={isMobile ? 256 : 512}
          color="#040911"
        />

        {/* Subtle Shadow-Only Catcher Plane (eliminates horizon line while preserving ground grounding) */}
        <mesh position={[0, -2.98, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[28, 28]} />
          <shadowMaterial transparent opacity={0.32} />
        </mesh>

        {/* =============================================================== */}
        {/* POST-PROCESSING PIPELINE (Bloom on Lume, N8AO, DoF, Vignette)   */}
        {/* =============================================================== */}
        {enablePostProcessing && !isMobile && (
          <EffectComposer multisampling={4}>
            <N8AO
              aoRadius={0.35}
              intensity={1.1}
              distanceFalloff={0.8}
              quality="medium"
            />
            <DepthOfField
              target={[0, 0, 0.1]}
              focalLength={0.018}
              bokehScale={0.75}
            />
            <Bloom
              luminanceThreshold={0.95}
              mipmapBlur
              intensity={0.26}
              radius={0.42}
            />
            <Vignette eskil={false} offset={0.22} darkness={0.45} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
};
