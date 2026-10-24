import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import {
  CalloutPartId,
   DIAL_SPECS,
  DialColorId,
  PART_CALLOUTS,
  StrapTypeId,
} from '../../types/watch';
import { getWatchTextureBundle } from '../../three/proceduralTextures';

export interface WatchPoseState {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  scale: number;
  lumeBoost: number;
}

interface MeridianWatchProps {
  dialColor: DialColorId;
  strapType: StrapTypeId;
  activeCallout: CalloutPartId;
  onSelectCallout: (part: CalloutPartId) => void;
  poseRef: React.MutableRefObject<WatchPoseState>;
  isPaused: boolean;
  showCalloutPins: boolean;
  reducedMotion: boolean;
}

/**
 * Creates a true 3D ridge-faceted Dauphine hand BufferGeometry.
 * A classic haute-horlogerie Dauphine hand has a raised central spine running
 * from tail to tip, creating two angled mirror planes that reflect contrasting light.
 */
function createDauphineHandGeometry(
  length: number,
  tailLength: number,
  halfWidth: number,
  ridgeHeight: number
): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();

  // Key vertices in XY plane with raised central ridge in +Z
  // 0: tip (0, length, 0.004)
  // 1: right widest (halfWidth, 0, 0)
  // 2: tail (0, -tailLength, 0.004)
  // 3: left widest (-halfWidth, 0, 0)
  // 4: spine apex above arbor (0, 0.08, ridgeHeight)
  const vertices = new Float32Array([
    // Right forward facet (0, 1, 4)
    0, length, 0.004,
    halfWidth, 0, 0,
    0, 0.06, ridgeHeight,

    // Left forward facet (0, 4, 3)
    0, length, 0.004,
    0, 0.06, ridgeHeight,
    -halfWidth, 0, 0,

    // Right tail facet (1, 2, 4)
    halfWidth, 0, 0,
    0, -tailLength, 0.004,
    0, 0.06, ridgeHeight,

    // Left tail facet (4, 2, 3)
    0, 0.06, ridgeHeight,
    0, -tailLength, 0.004,
    -halfWidth, 0, 0,

    // Bottom closure (flat underside so shadows are watertight)
    0, length, 0,
    -halfWidth, 0, 0,
    halfWidth, 0, 0,

    halfWidth, 0, 0,
    -halfWidth, 0, 0,
    0, -tailLength, 0,
  ]);

  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}

export const MeridianWatch: React.FC<MeridianWatchProps> = ({
  dialColor,
  strapType,
  activeCallout,
  onSelectCallout,
  poseRef,
  isPaused,
  showCalloutPins,
  reducedMotion,
}) => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const hourHandRef = useRef<THREE.Group>(null);
  const minuteHandRef = useRef<THREE.Group>(null);
  const secondHandRef = useRef<THREE.Group>(null);
  const rotorRef = useRef<THREE.Group>(null);
  const balanceWheelRef = useRef<THREE.Group>(null);

  // User drag-to-rotate with inertia state
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragAngleRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragVelocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Smooth material color cross-fade target
  const currentDialColorRef = useRef(new THREE.Color(DIAL_SPECS[dialColor].hex));
  const currentSheenColorRef = useRef(new THREE.Color(DIAL_SPECS[dialColor].sheenHex));

  const textures = useMemo(() => getWatchTextureBundle(), []);

  // ============================================================================
  // 1. PROCEDURAL CAD GEOMETRIES (Case Lathe, Bezel Lathe, Crystal Dome, Lugs)
  // ============================================================================
  const geometries = useMemo(() => {
    // A. Brushed 316L Mid-Case Profile (Lathe in XY -> rotated X by PI/2)
    const casePoints = [
      new THREE.Vector2(1.88, -0.25),
      new THREE.Vector2(2.02, -0.23),
      new THREE.Vector2(2.07, -0.14),
      new THREE.Vector2(2.08, 0.02),
      new THREE.Vector2(2.05, 0.14),
      new THREE.Vector2(1.94, 0.16),
      new THREE.Vector2(1.82, 0.16),
      new THREE.Vector2(1.82, -0.25),
    ];
    const caseBandGeo = new THREE.LatheGeometry(casePoints, 96);
    caseBandGeo.rotateX(Math.PI / 2);
    caseBandGeo.computeVertexNormals();

    // B. Mirror-Polished Stepped Concave Bezel Profile
    const bezelPoints = [
      new THREE.Vector2(1.71, 0.15),
      new THREE.Vector2(1.99, 0.15),
      new THREE.Vector2(2.03, 0.19),
      new THREE.Vector2(1.92, 0.28),
      new THREE.Vector2(1.75, 0.305),
      new THREE.Vector2(1.71, 0.27),
      new THREE.Vector2(1.71, 0.15),
    ];
    const bezelGeo = new THREE.LatheGeometry(bezelPoints, 96);
    bezelGeo.rotateX(Math.PI / 2);
    bezelGeo.computeVertexNormals();

    // C. Inner Rehaut / Chapter Flange
    const rehautPoints = [
      new THREE.Vector2(1.66, 0.005),
      new THREE.Vector2(1.73, 0.005),
      new THREE.Vector2(1.73, 0.265),
      new THREE.Vector2(1.69, 0.265),
      new THREE.Vector2(1.66, 0.005),
    ];
    const rehautGeo = new THREE.LatheGeometry(rehautPoints, 96);
    rehautGeo.rotateX(Math.PI / 2);
    rehautGeo.computeVertexNormals();

    // D. Exhibition Screw-Down Caseback Ring
    const casebackPoints = [
      new THREE.Vector2(1.48, -0.22),
      new THREE.Vector2(1.94, -0.22),
      new THREE.Vector2(1.97, -0.27),
      new THREE.Vector2(1.85, -0.33),
      new THREE.Vector2(1.48, -0.33),
      new THREE.Vector2(1.48, -0.22),
    ];
    const casebackGeo = new THREE.LatheGeometry(casebackPoints, 96);
    casebackGeo.rotateX(Math.PI / 2);
    casebackGeo.computeVertexNormals();

    // E. Domed Sapphire Crystal (Double-domed profile with edge bevel)
    const crystalPoints: THREE.Vector2[] = [];
    const domeSteps = 28;
    for (let i = 0; i <= domeSteps; i++) {
      const t = i / domeSteps;
      const r = t * 1.725;
      const domeZ = 0.275 + (1 - t * t) * 0.105 - (t > 0.92 ? (t - 0.92) * 0.35 : 0);
      crystalPoints.push(new THREE.Vector2(r, domeZ));
    }
    for (let i = domeSteps; i >= 0; i--) {
      const t = i / domeSteps;
      const r = t * 1.705;
      const innerZ = 0.235 + (1 - t * t) * 0.095;
      crystalPoints.push(new THREE.Vector2(r, innerZ));
    }
    const crystalGeo = new THREE.LatheGeometry(crystalPoints, 96);
    crystalGeo.rotateX(Math.PI / 2);
    crystalGeo.computeVertexNormals();

    // F. Sculpted Beveled Lug Geometry
    const lugShape = new THREE.Shape();
    lugShape.moveTo(-0.22, 0);
    lugShape.lineTo(0.22, 0);
    lugShape.quadraticCurveTo(0.19, 0.45, 0.14, 0.78);
    lugShape.lineTo(-0.14, 0.78);
    lugShape.quadraticCurveTo(-0.19, 0.45, -0.22, 0);

    const lugGeo = new THREE.ExtrudeGeometry(lugShape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 2,
      bevelSize: 0.032,
      bevelThickness: 0.036,
    });
    lugGeo.center();

    // G. Dial Plate with Real 3 o'clock Date Window Cutout
    const dialShape = new THREE.Shape();
    dialShape.absarc(0, 0, 1.68, 0, Math.PI * 2, false);

    // Date aperture cutout at 3 o'clock (x = 1.15, y = 0)
    const holePath = new THREE.Path();
    const hw = 0.145;
    const hh = 0.115;
    const cx = 1.15;
    holePath.moveTo(cx - hw, -hh);
    holePath.lineTo(cx + hw, -hh);
    holePath.lineTo(cx + hw, hh);
    holePath.lineTo(cx - hw, hh);
    holePath.closePath();
    dialShape.holes.push(holePath);

    const dialGeo = new THREE.ExtrudeGeometry(dialShape, {
      depth: 0.018,
      bevelEnabled: false,
      curveSegments: 96,
    });
    // Normalize UV coordinates to [0, 1] across the 1.68 radius disc so radial sunburst maps center at (0.5, 0.5)
    const posAttr = dialGeo.attributes.position;
    const uvAttr = dialGeo.attributes.uv;
    for (let i = 0; i < posAttr.count; i++) {
      const px = posAttr.getX(i);
      const py = posAttr.getY(i);
      uvAttr.setXY(i, px / (1.68 * 2) + 0.5, py / (1.68 * 2) + 0.5);
    }
    uvAttr.needsUpdate = true;

    // H. Dauphine Hands
    const hourHandGeo = createDauphineHandGeometry(1.06, 0.24, 0.105, 0.028);
    const minuteHandGeo = createDauphineHandGeometry(1.52, 0.3, 0.082, 0.026);

    // I. Skeletonized Rotor Outer Weight Arc
    const rotorArcShape = new THREE.Shape();
    rotorArcShape.absarc(0, 0, 1.38, -Math.PI * 0.55, Math.PI * 0.55, false);
    rotorArcShape.absarc(0, 0, 1.05, Math.PI * 0.55, -Math.PI * 0.55, true);
    const rotorWeightGeo = new THREE.ExtrudeGeometry(rotorArcShape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelSize: 0.008,
      bevelThickness: 0.008,
      curveSegments: 64,
    });

    return {
      caseBandGeo,
      bezelGeo,
      rehautGeo,
      casebackGeo,
      crystalGeo,
      lugGeo,
      dialGeo,
      hourHandGeo,
      minuteHandGeo,
      rotorWeightGeo,
    };
  }, []);

  // ============================================================================
  // 2. PBR MATERIALS (MeshPhysicalMaterial)
  // ============================================================================
  const materials = useMemo(() => {
    const brushedSteel = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#95a6b8'),
      metalness: 0.94,
      roughness: 0.37,
      normalMap: textures.brushedNormalMap,
      normalScale: new THREE.Vector2(0.52, 0.52),
      roughnessMap: textures.brushedRoughnessMap,
      clearcoat: 0.14,
      clearcoatRoughness: 0.3,
      envMapIntensity: 1.08,
    });

    const polishedSteel = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#e2ebf5'),
      metalness: 0.99,
      roughness: 0.035,
      clearcoat: 1.0,
      clearcoatRoughness: 0.015,
      envMapIntensity: 1.32,
    });

    const champagneGold = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#DFC496'),
      metalness: 0.96,
      roughness: 0.14,
      clearcoat: 0.6,
      envMapIntensity: 1.3,
    });

    const roseGoldRotor = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#E2B692'),
      metalness: 0.96,
      roughness: 0.18,
      normalMap: textures.brushedNormalMap,
      normalScale: new THREE.Vector2(0.25, 0.25),
      clearcoat: 0.5,
      envMapIntensity: 1.3,
    });

    const copperSeconds = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#D9662E'),
      metalness: 0.72,
      roughness: 0.18,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.25,
    });

    const lumeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#EDF7F2'),
      emissive: new THREE.Color('#5FFFD2'),
      emissiveIntensity: 0.65,
      roughness: 0.22,
      metalness: 0.05,
    });

    const sapphireCrystal = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#b6dcff'),
      transparent: true,
      opacity: 0.13,
      ior: 1.77,
      reflectivity: 0.95,
      roughness: 0.015,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      specularIntensity: 1.0,
      specularColor: new THREE.Color('#70b5ff'),
      envMapIntensity: 1.35,
      depthWrite: false,
    });

    const dialSunburst = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(DIAL_SPECS.glacier.hex),
      metalness: 0.78,
      roughness: 0.26,
      normalMap: textures.sunburstNormalMap,
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughnessMap: textures.sunburstRoughnessMap,
      clearcoat: 0.45,
      clearcoatRoughness: 0.14,
      sheen: 0.8,
      sheenRoughness: 0.22,
      sheenColor: new THREE.Color(DIAL_SPECS.glacier.sheenHex),
      envMapIntensity: 1.2,
    });

    const genevaBridge = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#c8d3de'),
      metalness: 0.95,
      roughness: 0.24,
      normalMap: textures.genevaNormalMap,
      normalScale: new THREE.Vector2(0.48, 0.48),
      envMapIntensity: 1.2,
    });

    const rubyJewel = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#d4143a'),
      transparent: true,
      opacity: 0.88,
      ior: 1.76,
      roughness: 0.05,
      metalness: 0.1,
    });

    const bluedScrew = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#1848a0'),
      metalness: 0.95,
      roughness: 0.08,
      envMapIntensity: 1.3,
    });

    const leatherMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#362115'),
      metalness: 0.04,
      roughness: 0.56,
      normalMap: textures.leatherNormalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughnessMap: textures.leatherRoughnessMap,
      clearcoat: 0.18,
      clearcoatRoughness: 0.45,
      sheen: 0.35,
      sheenColor: new THREE.Color('#6b4630'),
    });

    const stitchMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#E8DEC8'),
      roughness: 0.65,
      metalness: 0.0,
    });

    const nylonMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#132235'),
      metalness: 0.08,
      roughness: 0.62,
      normalMap: textures.nylonNormalMap,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughnessMap: textures.nylonRoughnessMap,
      sheen: 0.4,
      sheenColor: new THREE.Color('#3a5778'),
    });

    return {
      brushedSteel,
      polishedSteel,
      champagneGold,
      roseGoldRotor,
      copperSeconds,
      lumeMaterial,
      sapphireCrystal,
      dialSunburst,
      genevaBridge,
      rubyJewel,
      bluedScrew,
      leatherMaterial,
      stitchMaterial,
      nylonMaterial,
    };
  }, [textures]);

  // ============================================================================
  // 3. REAL-TIME ANIMATION LOOP (Hands, Escapement, Dial Cross-Fade, Inertia)
  // ============================================================================
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);

    // 1. Cross-fade dial color & sheen smoothly when dialColor prop changes
    const spec = DIAL_SPECS[dialColor];
    currentDialColorRef.current.lerp(new THREE.Color(spec.hex), dt * 6.5);
    currentSheenColorRef.current.lerp(new THREE.Color(spec.sheenHex), dt * 6.5);
    materials.dialSunburst.color.copy(currentDialColorRef.current);
    materials.dialSunburst.sheenColor.copy(currentSheenColorRef.current);
    materials.dialSunburst.metalness = THREE.MathUtils.lerp(
      materials.dialSunburst.metalness,
      spec.isLightDial ? 0.58 : 0.84,
      dt * 6.5
    );

    // 2. Lume emissive pulse during Dial Macro section
    const targetLume = 0.55 + poseRef.current.lumeBoost * 1.45;
    materials.lumeMaterial.emissiveIntensity = THREE.MathUtils.lerp(
      materials.lumeMaterial.emissiveIntensity,
      targetLume,
      dt * 5.0
    );

    // 3. Real Local Time for Hands (smooth continuous sweep seconds)
    const now = new Date();
    const ms = now.getMilliseconds();
    const seconds = now.getSeconds() + (isPaused || reducedMotion ? 0 : ms / 1000);
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;

    if (hourHandRef.current) {
      hourHandRef.current.rotation.z = -(hours / 12) * Math.PI * 2;
    }
    if (minuteHandRef.current) {
      minuteHandRef.current.rotation.z = -(minutes / 60) * Math.PI * 2;
    }
    if (secondHandRef.current) {
      secondHandRef.current.rotation.z = -(seconds / 60) * Math.PI * 2;
    }

    // 4. Calibre M-01 Movement Rotor & 4Hz Balance Wheel
    if (!isPaused && !reducedMotion) {
      const elapsed = state.clock.elapsedTime;
      if (rotorRef.current) {
        rotorRef.current.rotation.z = elapsed * 0.85 + Math.sin(elapsed * 0.6) * 0.4;
      }
      if (balanceWheelRef.current) {
        balanceWheelRef.current.rotation.z = Math.sin(elapsed * Math.PI * 8) * 0.55;
      }
    }

    // 5. Drag inertia decay + scroll choreography pose interpolation
    if (!isDraggingRef.current) {
      dragAngleRef.current.x += dragVelocityRef.current.x;
      dragAngleRef.current.y += dragVelocityRef.current.y;
      dragVelocityRef.current.x *= 0.92;
      dragVelocityRef.current.y *= 0.92;
      // Gently return drag offset toward zero when scrolling
      dragAngleRef.current.x *= 0.992;
      dragAngleRef.current.y *= 0.992;
    }

    if (rootGroupRef.current) {
      const pose = poseRef.current;
      const idleFloatY =
        isPaused || reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 1.1) * 0.035;
      const idleFloatRotZ =
        isPaused || reducedMotion ? 0 : Math.cos(state.clock.elapsedTime * 0.75) * 0.015;

      rootGroupRef.current.position.x = THREE.MathUtils.lerp(
        rootGroupRef.current.position.x,
        pose.positionX,
        dt * 7.5
      );
      rootGroupRef.current.position.y = THREE.MathUtils.lerp(
        rootGroupRef.current.position.y,
        pose.positionY + idleFloatY,
        dt * 7.5
      );
      rootGroupRef.current.position.z = THREE.MathUtils.lerp(
        rootGroupRef.current.position.z,
        pose.positionZ,
        dt * 7.5
      );

      rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.x,
        pose.rotationX + dragAngleRef.current.y,
        dt * 8.0
      );
      rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.y,
        pose.rotationY + dragAngleRef.current.x,
        dt * 8.0
      );
      rootGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.z,
        pose.rotationZ + idleFloatRotZ,
        dt * 8.0
      );

      const currentScale = rootGroupRef.current.scale.x;
      const nextScale = THREE.MathUtils.lerp(currentScale, pose.scale, dt * 7.5);
      rootGroupRef.current.scale.setScalar(nextScale);
    }
  });

  // ============================================================================
  // 4. INTERACTIVE DRAG-TO-ROTATE WITH INERTIA HANDLERS
  // ============================================================================
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDraggingRef.current) return;
    const dx = (e.clientX - prevPointerRef.current.x) * 0.0075;
    const dy = (e.clientY - prevPointerRef.current.y) * 0.0075;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };

    dragAngleRef.current.x += dx;
    dragAngleRef.current.y = THREE.MathUtils.clamp(
      dragAngleRef.current.y + dy,
      -0.85,
      0.85
    );
    dragVelocityRef.current = { x: dx * 0.65, y: dy * 0.65 };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    document.body.style.cursor = 'auto';
  };

  // Precompute hour indices positions (12 indices; 3 o'clock has date window)
  const hourMarkers = useMemo(() => {
    const markers = [];
    for (let i = 0; i < 12; i++) {
      if (i === 3) continue; // 3 o'clock is occupied by the Date Aperture
      const angle = (i / 12) * Math.PI * 2;
      const isCardinal = i === 0 || i === 6 || i === 9;
      markers.push({ index: i, angle, isCardinal, isTwelve: i === 0 });
    }
    return markers;
  }, []);

  // Knurled crown 36 ridges
  const crownRidges = useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => (i / 36) * Math.PI * 2);
  }, []);

  // Strap link segments along curved wrist path
  const strapCurveSegments = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const t = i / 7;
      const y = 2.04 + i * 0.27;
      const z = -0.04 - Math.pow(t, 1.65) * 0.72;
      const rotX = -t * 0.55;
      const widthScale = 1.0 - t * 0.16;
      return { i, y, z, rotX, widthScale };
    });
  }, []);

  // Saddle stitches along leather strap
  const stitchPositions = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) => {
      const t = i / 10;
      const y = 1.98 + i * 0.185;
      const z = -0.01 - Math.pow(t, 1.65) * 0.64;
      const rotX = -t * 0.52;
      const xOffset = 0.72 * (1.0 - t * 0.13);
      return { i, y, z, rotX, xOffset };
    });
  }, []);

  const isLightDial = DIAL_SPECS[dialColor].isLightDial;

  return (
    <group
      ref={rootGroupRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* ================================================================= */}
      {/* CASE ARCHITECTURE (316L Brushed Mid-case, Polished Bezel, Rehaut) */}
      {/* ================================================================= */}
      <mesh
        geometry={geometries.caseBandGeo}
        material={materials.brushedSteel}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={geometries.bezelGeo}
        material={materials.polishedSteel}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={geometries.rehautGeo}
        material={materials.brushedSteel}
        receiveShadow
      />
      <mesh
        geometry={geometries.casebackGeo}
        material={materials.brushedSteel}
        castShadow
        receiveShadow
      />

      {/* Polished Decorative Chamfer Ring between Bezel and Mid-Case */}
      <mesh position={[0, 0, 0.155]}>
        <torusGeometry args={[2.035, 0.018, 24, 96]} />
        <primitive object={materials.polishedSteel} attach="material" />
      </mesh>

      {/* ================================================================= */}
      {/* FOUR SCULPTED BEVELED LUGS (Satin Top + Mirror Anglage Chamfer)   */}
      {/* ================================================================= */}
      {[
        { x: -1.16, y: 1.78, rotZ: 0.22, flipY: 1 },
        { x: 1.16, y: 1.78, rotZ: -0.22, flipY: 1 },
        { x: -1.16, y: -1.78, rotZ: -0.22, flipY: -1 },
        { x: 1.16, y: -1.78, rotZ: 0.22, flipY: -1 },
      ].map((lug, idx) => (
        <group
          key={idx}
          position={[lug.x, lug.y, -0.04]}
          rotation={[lug.flipY * -0.14, 0, lug.rotZ]}
          scale={[1, lug.flipY, 1]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectCallout(activeCallout === 'lugs' ? null : 'lugs');
          }}
        >
          <mesh
            geometry={geometries.lugGeo}
            material={materials.brushedSteel}
            castShadow
            receiveShadow
          />
          {/* Mirror-polished outer bevel highlight strip */}
          <mesh
            position={[lug.x < 0 ? -0.19 : 0.19, 0.12, 0.09]}
            rotation={[0, 0.35, 0]}
          >
            <boxGeometry args={[0.045, 0.66, 0.06]} />
            <primitive object={materials.polishedSteel} attach="material" />
          </mesh>
        </group>
      ))}

      {/* ================================================================= */}
      {/* KNURLED SCREW-DOWN CROWN & CROWN GUARDS AT 3 O'CLOCK              */}
      {/* ================================================================= */}
      <group
        position={[2.16, 0, -0.02]}
        rotation={[0, 0, -Math.PI / 2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectCallout(activeCallout === 'crown' ? null : 'crown');
        }}
      >
        {/* Crown Tube */}
        <mesh position={[0, -0.08, 0]} material={materials.polishedSteel}>
          <cylinderGeometry args={[0.14, 0.14, 0.16, 32]} />
        </mesh>
        {/* Main Crown Barrel */}
        <mesh position={[0, 0.05, 0]} material={materials.brushedSteel} castShadow>
          <cylinderGeometry args={[0.235, 0.225, 0.24, 48]} />
        </mesh>
        {/* Polished Domed Crown Cap */}
        <mesh position={[0, 0.175, 0]} material={materials.polishedSteel}>
          <cylinderGeometry args={[0.19, 0.23, 0.035, 48]} />
        </mesh>
        {/* 36 Knurling Ridges */}
        {crownRidges.map((angle, i) => (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.235, 0.05, Math.sin(angle) * 0.235]}
            rotation={[0, -angle, 0]}
            material={materials.polishedSteel}
          >
            <boxGeometry args={[0.016, 0.22, 0.014]} />
          </mesh>
        ))}
        {/* Embossed Champagne Star Emblem on Crown Tip */}
        <mesh position={[0, 0.195, 0]} material={materials.champagneGold}>
          <cylinderGeometry args={[0.09, 0.09, 0.01, 6]} />
        </mesh>
      </group>

      {/* Upper & Lower Sculpted Crown Guards */}
      <mesh
        position={[2.03, 0.36, -0.02]}
        rotation={[0, 0, -0.25]}
        material={materials.brushedSteel}
      >
        <boxGeometry args={[0.18, 0.26, 0.22]} />
      </mesh>
      <mesh
        position={[2.03, -0.36, -0.02]}
        rotation={[0, 0, 0.25]}
        material={materials.brushedSteel}
      >
        <boxGeometry args={[0.18, 0.26, 0.22]} />
      </mesh>

      {/* ================================================================= */}
      {/* SUNBURST DIAL, PRINTED MINUTE TRACK, DATE WHEEL & APPLIED INDICES */}
      {/* ================================================================= */}
      <group position={[0, 0, 0.01]}>
        {/* Main Sunburst Dial Plate with 3 o'clock Cutout */}
        <mesh
          geometry={geometries.dialGeo}
          material={materials.dialSunburst}
          receiveShadow
        />

        {/* Crisp Printed Dial Markings & Chapter Track Overlay */}
        <mesh position={[0, 0, 0.02]} receiveShadow>
          <ringGeometry args={[0.18, 1.66, 128]} />
          <meshBasicMaterial
            map={isLightDial ? textures.dialPrintDarkMap : textures.dialPrintLightMap}
            transparent
            opacity={0.96}
            depthWrite={false}
          />
        </mesh>

        {/* Applied MERIDIAN Compass Star Emblem below 12 o'clock */}
        <group position={[0, 0.82, 0.028]}>
          <mesh rotation={[0, 0, Math.PI / 4]} material={materials.champagneGold} castShadow>
            <boxGeometry args={[0.11, 0.028, 0.018]} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]} material={materials.champagneGold} castShadow>
            <boxGeometry args={[0.11, 0.028, 0.018]} />
          </mesh>
          <mesh material={materials.polishedSteel} castShadow>
            <boxGeometry args={[0.04, 0.14, 0.022]} />
          </mesh>
          <mesh material={materials.polishedSteel} castShadow>
            <boxGeometry args={[0.14, 0.04, 0.022]} />
          </mesh>
        </group>

        {/* Recessed Date Wheel Disc at z = -0.012 under the 3 o'clock Cutout */}
        <mesh position={[0, 0, -0.008]} receiveShadow>
          <ringGeometry args={[0.92, 1.44, 96]} />
          <meshStandardMaterial
            map={textures.dateWheelMap}
            roughness={0.32}
            metalness={0.15}
          />
        </mesh>

        {/* Applied Diamond-Beveled Date Window Frame at 3 o'clock (x = 1.15, y = 0) */}
        <group
          position={[1.15, 0, 0.026]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectCallout(activeCallout === 'date' ? null : 'date');
          }}
        >
          {/* Top & Bottom Beveled Bars */}
          <mesh position={[0, 0.125, 0]} material={materials.polishedSteel} castShadow>
            <boxGeometry args={[0.33, 0.026, 0.028]} />
          </mesh>
          <mesh position={[0, -0.125, 0]} material={materials.polishedSteel} castShadow>
            <boxGeometry args={[0.33, 0.026, 0.028]} />
          </mesh>
          {/* Left & Right Beveled Bars */}
          <mesh position={[-0.152, 0, 0]} material={materials.polishedSteel} castShadow>
            <boxGeometry args={[0.026, 0.275, 0.028]} />
          </mesh>
          <mesh position={[0.152, 0, 0]} material={materials.polishedSteel} castShadow>
            <boxGeometry args={[0.026, 0.275, 0.028]} />
          </mesh>
          {/* Outboard Lume Pip at 3 o'clock */}
          <mesh position={[0.29, 0, 0.005]} material={materials.lumeMaterial} castShadow>
            <boxGeometry args={[0.11, 0.048, 0.026]} />
          </mesh>
        </group>

        {/* 11 Applied Faceted Hour Indices with Real Thickness & Super-LumiNova Inlay */}
        {hourMarkers.map(({ index, angle, isCardinal, isTwelve }) => {
          const r = 1.34;
          const x = Math.sin(angle) * r;
          const y = Math.cos(angle) * r;
          const rotZ = -angle;

          if (isTwelve) {
            // Double applied baton index at 12 o'clock
            return (
              <group key={index} position={[x, y, 0.032]} rotation={[0, 0, rotZ]}>
                {[-0.055, 0.055].map((offsetX, subIdx) => (
                  <group key={subIdx} position={[offsetX, 0, 0]}>
                    <mesh material={materials.polishedSteel} castShadow receiveShadow>
                      <boxGeometry args={[0.072, 0.34, 0.038]} />
                    </mesh>
                    {/* Raised Lume Channel */}
                    <mesh position={[0, 0, 0.016]} material={materials.lumeMaterial}>
                      <boxGeometry args={[0.036, 0.27, 0.012]} />
                    </mesh>
                  </group>
                ))}
              </group>
            );
          }

          return (
            <group key={index} position={[x, y, 0.032]} rotation={[0, 0, rotZ]}>
              {/* Faceted Rhodium/Steel Index Base */}
              <mesh
                material={isCardinal ? materials.champagneGold : materials.polishedSteel}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[isCardinal ? 0.088 : 0.07, 0.31, 0.036]} />
              </mesh>
              {/* Super-LumiNova BGW9 Center Strip */}
              <mesh position={[0, 0, 0.015]} material={materials.lumeMaterial}>
                <boxGeometry args={[isCardinal ? 0.044 : 0.034, 0.24, 0.012]} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ================================================================= */}
      {/* STEPPED DAUPHINE HANDS & COPPER SWEEP SECONDS HAND                */}
      {/* ================================================================= */}
      {/* Central Pinion Collar */}
      <mesh
        position={[0, 0, 0.065]}
        rotation={[Math.PI / 2, 0, 0]}
        material={materials.polishedSteel}
      >
        <cylinderGeometry args={[0.095, 0.11, 0.09, 32]} />
      </mesh>

      {/* 1. Hour Hand (Stepped height z = 0.095) */}
      <group ref={hourHandRef} position={[0, 0, 0.095]}>
        <mesh
          geometry={geometries.hourHandGeo}
          material={materials.polishedSteel}
          castShadow
        />
        {/* Hour Hand Lume Insert */}
        <mesh position={[0, 0.44, 0.017]} material={materials.lumeMaterial}>
          <boxGeometry args={[0.032, 0.56, 0.008]} />
        </mesh>
      </group>

      {/* 2. Minute Hand (Stepped height z = 0.135) */}
      <group ref={minuteHandRef} position={[0, 0, 0.135]}>
        <mesh
          geometry={geometries.minuteHandGeo}
          material={materials.polishedSteel}
          castShadow
        />
        {/* Minute Hand Lume Insert */}
        <mesh position={[0, 0.62, 0.016]} material={materials.lumeMaterial}>
          <boxGeometry args={[0.026, 0.82, 0.008]} />
        </mesh>
      </group>

      {/* 3. Copper Sweep Seconds Hand (Stepped height z = 0.175, #D9662E) */}
      <group ref={secondHandRef} position={[0, 0, 0.175]}>
        {/* Main Copper Needle */}
        <mesh position={[0, 0.56, 0]} material={materials.copperSeconds} castShadow>
          <boxGeometry args={[0.022, 1.98, 0.012]} />
        </mesh>
        {/* Counterweight Poise Diamond */}
        <mesh
          position={[0, -0.34, 0]}
          rotation={[0, 0, Math.PI / 4]}
          material={materials.copperSeconds}
          castShadow
        >
          <boxGeometry args={[0.075, 0.075, 0.014]} />
        </mesh>
        {/* Luminous Tip Spear */}
        <mesh position={[0, 1.24, 0.005]} material={materials.lumeMaterial}>
          <boxGeometry args={[0.03, 0.18, 0.008]} />
        </mesh>
        {/* Copper Arbor Cap */}
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.copperSeconds}
          castShadow
        >
          <cylinderGeometry args={[0.062, 0.062, 0.024, 32]} />
        </mesh>
        <mesh
          position={[0, 0, 0.015]}
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.champagneGold}
        >
          <cylinderGeometry args={[0.025, 0.025, 0.012, 24]} />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* BOX-DOMED SAPPHIRE CRYSTAL (IOR 1.77, Blue AR Tint)               */}
      {/* ================================================================= */}
      <mesh
        geometry={geometries.crystalGeo}
        material={materials.sapphireCrystal}
        onClick={(e) => {
          e.stopPropagation();
          onSelectCallout(activeCallout === 'crystal' ? null : 'crystal');
        }}
      />

      {/* ================================================================= */}
      {/* CALIBRE M-01 EXHIBITION MOVEMENT (Visible through Caseback -Z)    */}
      {/* ================================================================= */}
      <group position={[0, 0, -0.08]} rotation={[0, Math.PI, 0]}>
        {/* Mainplate with Perlage */}
        <mesh
          position={[0, 0, 0.02]}
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.brushedSteel}
        >
          <cylinderGeometry args={[1.52, 1.52, 0.04, 64]} />
        </mesh>

        {/* Côtes de Genève Upper Barrel Bridge */}
        <mesh
          position={[-0.25, 0.42, 0.06]}
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.genevaBridge}
        >
          <cylinderGeometry
            args={[0.88, 0.88, 0.045, 48, 1, false, 0, Math.PI * 1.15]}
          />
        </mesh>

        {/* Côtes de Genève Gear Train Bridge */}
        <mesh
          position={[0.42, -0.18, 0.06]}
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.genevaBridge}
        >
          <cylinderGeometry
            args={[0.72, 0.72, 0.045, 48, 1, false, Math.PI * 0.4, Math.PI * 1.1]}
          />
        </mesh>

        {/* Gold Gear Train Wheels */}
        <mesh
          position={[0.38, 0.35, 0.045]}
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.champagneGold}
        >
          <cylinderGeometry args={[0.34, 0.34, 0.02, 36]} />
        </mesh>
        <mesh
          position={[-0.45, -0.25, 0.045]}
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.champagneGold}
        >
          <cylinderGeometry args={[0.28, 0.28, 0.02, 32]} />
        </mesh>

        {/* Synthetic Ruby Jewels & Blued Steel Screws */}
        {[
          [0, 0, 0.09],
          [-0.45, 0.48, 0.09],
          [0.48, -0.22, 0.09],
          [-0.18, 0.72, 0.09],
          [0.62, 0.18, 0.09],
        ].map(([jx, jy, jz], idx) => (
          <group key={idx} position={[jx, jy, jz]}>
            <mesh material={materials.champagneGold}>
              <torusGeometry args={[0.055, 0.014, 12, 24]} />
            </mesh>
            <mesh material={materials.rubyJewel}>
              <sphereGeometry args={[0.042, 16, 16]} />
            </mesh>
          </group>
        ))}

        {[
          [-0.75, 0.55, 0.09],
          [0.12, 0.85, 0.09],
          [0.82, -0.15, 0.09],
          [0.32, -0.68, 0.09],
          [-0.72, -0.45, 0.09],
        ].map(([sx, sy, sz], idx) => (
          <mesh
            key={idx}
            position={[sx, sy, sz]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.bluedScrew}
          >
            <cylinderGeometry args={[0.038, 0.038, 0.018, 16]} />
          </mesh>
        ))}

        {/* 4Hz Oscillating Gold Balance Wheel at 6 o'clock */}
        <group position={[0, -0.78, 0.07]}>
          {/* Balance Cock Bridge */}
          <mesh position={[0, 0, 0.025]} material={materials.champagneGold}>
            <boxGeometry args={[0.88, 0.14, 0.022]} />
          </mesh>
          <group ref={balanceWheelRef}>
            <mesh material={materials.champagneGold}>
              <torusGeometry args={[0.32, 0.026, 16, 48]} />
            </mesh>
            <mesh material={materials.champagneGold}>
              <boxGeometry args={[0.62, 0.025, 0.015]} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} material={materials.champagneGold}>
              <boxGeometry args={[0.62, 0.025, 0.015]} />
            </mesh>
          </group>
        </group>

        {/* Bi-Directional Skeletonized Rose-Gold Automatic Rotor */}
        <group ref={rotorRef} position={[0, 0, 0.12]}>
          <mesh geometry={geometries.rotorWeightGeo} material={materials.roseGoldRotor} />
          {/* Three Openworked Rotor Spokes */}
          {[-0.85, 0, 0.85].map((spokeAngle, idx) => (
            <mesh
              key={idx}
              position={[
                Math.cos(spokeAngle) * 0.58,
                Math.sin(spokeAngle) * 0.58,
                0.015,
              ]}
              rotation={[0, 0, spokeAngle]}
              material={materials.roseGoldRotor}
            >
              <boxGeometry args={[0.98, 0.11, 0.024]} />
            </mesh>
          ))}
          {/* Central Ball-Bearing Race Hub */}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.polishedSteel}>
            <cylinderGeometry args={[0.24, 0.24, 0.045, 36]} />
          </mesh>
          <mesh
            position={[0, 0, 0.026]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.champagneGold}
          >
            <cylinderGeometry args={[0.11, 0.11, 0.015, 24]} />
          </mesh>
        </group>

        {/* Exhibition Caseback Sapphire Glass */}
        <mesh
          position={[0, 0, 0.21]}
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.sapphireCrystal}
        >
          <cylinderGeometry args={[1.48, 1.48, 0.03, 64]} />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* INTERCHANGEABLE STRAP SYSTEM (Leather / 316L Steel / Sailcloth)   */}
      {/* ================================================================= */}
      {[1, -1].map((side) => (
        <group key={side} scale={[1, side, 1]}>
          {/* Spring Bar between Lugs */}
          <mesh
            position={[0, 1.92, -0.02]}
            rotation={[0, 0, Math.PI / 2]}
            material={materials.polishedSteel}
          >
            <cylinderGeometry args={[0.055, 0.055, 2.02, 24]} />
          </mesh>

          {strapType === 'leather' && (
            <group>
              {strapCurveSegments.map(({ i, y, z, rotX, widthScale }) => (
                <group
                  key={i}
                  position={[0, y, z]}
                  rotation={[rotX, 0, 0]}
                  scale={[widthScale, 1, 1]}
                >
                  {/* Main Padded Calfskin Segment */}
                  <mesh material={materials.leatherMaterial} castShadow receiveShadow>
                    <boxGeometry args={[1.76, 0.31, 0.13]} />
                  </mesh>
                  {/* Raised Bolster Cushion Center */}
                  <mesh
                    position={[0, 0, 0.035]}
                    material={materials.leatherMaterial}
                    castShadow
                  >
                    <boxGeometry args={[1.28, 0.31, 0.075]} />
                  </mesh>
                </group>
              ))}
              {/* Visible Ecru Saddle Stitching along both edges */}
              {stitchPositions.map(({ i, y, z, rotX, xOffset }) => (
                <React.Fragment key={i}>
                  <mesh
                    position={[-xOffset, y, z + 0.07]}
                    rotation={[rotX + 0.15, 0, 0.08]}
                    material={materials.stitchMaterial}
                  >
                    <capsuleGeometry args={[0.015, 0.085, 6, 8]} />
                  </mesh>
                  <mesh
                    position={[xOffset, y, z + 0.07]}
                    rotation={[rotX + 0.15, 0, -0.08]}
                    material={materials.stitchMaterial}
                  >
                    <capsuleGeometry args={[0.015, 0.085, 6, 8]} />
                  </mesh>
                </React.Fragment>
              ))}
              {/* Leather Keeper Loop + 316L Tang Buckle on Top Side */}
              <mesh
                position={[0, 2.75, -0.22]}
                rotation={[-0.22, 0, 0]}
                material={materials.leatherMaterial}
              >
                <boxGeometry args={[1.78, 0.18, 0.21]} />
              </mesh>
              {side === 1 && (
                <mesh
                  position={[0, 4.02, -0.82]}
                  rotation={[-0.55, 0, 0]}
                  material={materials.brushedSteel}
                >
                  <torusGeometry args={[0.68, 0.065, 16, 32]} />
                </mesh>
              )}
            </group>
          )}

          {strapType === 'steel' && (
            <group>
              {strapCurveSegments.map(({ i, y, z, rotX, widthScale }) => (
                <group
                  key={i}
                  position={[0, y, z]}
                  rotation={[rotX, 0, 0]}
                  scale={[widthScale, 1, 1]}
                >
                  {/* Left & Right Satin-Brushed Outer Links */}
                  <mesh
                    position={[-0.58, 0, 0]}
                    material={materials.brushedSteel}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[0.56, 0.25, 0.14]} />
                  </mesh>
                  <mesh
                    position={[0.58, 0, 0]}
                    material={materials.brushedSteel}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[0.56, 0.25, 0.14]} />
                  </mesh>
                  {/* Center Link with Mirror-Polished Bevel Strips */}
                  <mesh material={materials.brushedSteel} castShadow receiveShadow>
                    <boxGeometry args={[0.52, 0.26, 0.155]} />
                  </mesh>
                  <mesh position={[-0.27, 0, 0.02]} material={materials.polishedSteel}>
                    <boxGeometry args={[0.04, 0.26, 0.14]} />
                  </mesh>
                  <mesh position={[0.27, 0, 0.02]} material={materials.polishedSteel}>
                    <boxGeometry args={[0.04, 0.26, 0.14]} />
                  </mesh>
                </group>
              ))}
            </group>
          )}

          {strapType === 'nylon' && (
            <group>
              {strapCurveSegments.map(({ i, y, z, rotX, widthScale }) => (
                <group
                  key={i}
                  position={[0, y, z]}
                  rotation={[rotX, 0, 0]}
                  scale={[widthScale, 1, 1]}
                >
                  {/* Technical Woven Sailcloth Nylon Band */}
                  <mesh material={materials.nylonMaterial} castShadow receiveShadow>
                    <boxGeometry args={[1.74, 0.31, 0.11]} />
                  </mesh>
                  {/* Ribbed Center Track */}
                  <mesh position={[0, 0, 0.02]} material={materials.nylonMaterial}>
                    <boxGeometry args={[1.15, 0.31, 0.05]} />
                  </mesh>
                </group>
              ))}
              {/* Twin Brushed Steel NATO Hardware Keeper Loops */}
              <mesh
                position={[0, 2.55, -0.14]}
                rotation={[-0.18, 0, 0]}
                material={materials.brushedSteel}
              >
                <boxGeometry args={[1.82, 0.11, 0.19]} />
              </mesh>
              <mesh
                position={[0, 3.08, -0.34]}
                rotation={[-0.3, 0, 0]}
                material={materials.brushedSteel}
              >
                <boxGeometry args={[1.76, 0.11, 0.19]} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* ================================================================= */}
      {/* INTERACTIVE 3D PART CALLOUT PINS (Crown, Crystal, Date, Lugs)     */}
      {/* ================================================================= */}
      {(Object.keys(PART_CALLOUTS) as Array<Exclude<CalloutPartId, null>>).map(
        (partKey) => {
          const info = PART_CALLOUTS[partKey];
          const isActive = activeCallout === partKey;
          if (!showCalloutPins && !isActive) return null;
          return (
            <Html
              key={partKey}
              position={info.position}
              center
              distanceFactor={8}
              zIndexRange={[15, 0]}
            >
              <div className="relative flex items-center select-none pointer-events-auto">
                <button
                  type="button"
                  aria-label={`Inspect ${info.title}`}
                  aria-expanded={isActive}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCallout(isActive ? null : partKey);
                  }}
                  className={`group relative flex items-center justify-center w-6 h-6 rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#D8C3A0] ${
                    isActive
                      ? 'bg-[#D9662E] border-[#F2EEE6] scale-110 shadow-[0_0_20px_rgba(217,102,46,0.75)]'
                      : 'bg-[#0B1522]/90 border-[#D8C3A0]/80 hover:border-[#F2EEE6] hover:scale-110'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isActive ? 'bg-[#F2EEE6]' : 'bg-[#D8C3A0] group-hover:bg-[#F2EEE6]'
                    }`}
                  />
                </button>

                {isActive && (
                  <div className="ml-2.5 px-2.5 py-1 rounded-sm bg-[#0B1522]/95 border border-[#D9662E]/70 backdrop-blur-md shadow-xl whitespace-nowrap">
                    <p className="text-[9px] tracking-[0.22em] uppercase text-[#F2EEE6] font-semibold">
                      {info.label}
                    </p>
                  </div>
                )}
              </div>
            </Html>
          );
        }
      )}
    </group>
  );
};
