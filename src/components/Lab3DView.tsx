import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CameraViewMode, IndicatorType } from '../types/lab';
import { Eye, RotateCcw, Glasses, Compass, Maximize2 } from 'lucide-react';

interface Lab3DViewProps {
  volumeDispensed: number; // mL added from burette (0 to 50)
  totalBuretteCapacity?: number; // default 50 mL
  solutionColor: string;
  isStirrerActive: boolean;
  stirrerRpm: number;
  pH: number;
  indicator: IndicatorType;
  indicatorDrops: number;
  isFlowing: boolean;
  flowRate: 'closed' | 'drop' | 'slow' | 'fast';
  onAddOneDrop: () => void;
  onToggleFlow: () => void;
  isVRMode: boolean;
  onToggleVR: () => void;
}

export const Lab3DView: React.FC<Lab3DViewProps> = ({
  volumeDispensed,
  totalBuretteCapacity = 50,
  solutionColor,
  isStirrerActive,
  stirrerRpm,
  pH,
  indicatorDrops,
  isFlowing,
  flowRate,
  onAddOneDrop,
  onToggleFlow,
  isVRMode,
  onToggleVR,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeCameraView, setActiveCameraView] = useState<CameraViewMode['id']>('closeup_flask');

  // Three.js mutable refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Dynamic mesh references
  const buretteLiquidMeshRef = useRef<THREE.Mesh | null>(null);
  const flaskLiquidMeshRef = useRef<THREE.Mesh | null>(null);
  const stirBarMeshRef = useRef<THREE.Mesh | null>(null);
  const stopcockHandleMeshRef = useRef<THREE.Group | null>(null);
  const dropsGroupRef = useRef<THREE.Group | null>(null);
  const phScreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const phScreenTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Mouse interaction state
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: 0.15, phi: 0.28, radius: 4.8 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 1.25, 0));

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 550;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120); // Deep modern lab slate
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Lighting setup (Three-point studio lighting for scientific glassware)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.2);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9); // Cool cyan rim highlight
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(0, -2, 4);
    scene.add(fillLight);

    // 5. Build Environment & Lab Apparatus
    buildLabScene(scene);

    // 6. Animation loop
    let lastTime = performance.now();
    const activeDrops: { mesh: THREE.Mesh; speed: number; y: number }[] = [];

    const animate = (time: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Rotate stir bar if active
      if (stirBarMeshRef.current && isStirrerActive) {
        const speed = (stirrerRpm / 60) * Math.PI * 2;
        stirBarMeshRef.current.rotation.y += speed * delta;
      }

      // Rotate stopcock if flowing
      if (stopcockHandleMeshRef.current) {
        const targetRotation = isFlowing ? Math.PI / 2 : 0;
        stopcockHandleMeshRef.current.rotation.z += (targetRotation - stopcockHandleMeshRef.current.rotation.z) * 0.15;
      }

      // Drop animation logic
      if (dropsGroupRef.current) {
        if (isFlowing) {
          const spawnInterval = flowRate === 'fast' ? 0.08 : flowRate === 'slow' ? 0.25 : 0.6;
          if (Math.random() < delta / spawnInterval) {
            const dropGeo = new THREE.SphereGeometry(0.018, 8, 8);
            const dropMat = new THREE.MeshStandardMaterial({
              color: 0x93c5fd,
              roughness: 0.1,
              metalness: 0.1,
              transparent: true,
              opacity: 0.85,
            });
            const drop = new THREE.Mesh(dropGeo, dropMat);
            drop.position.set(0, 1.15, 0); // Burette tip
            dropsGroupRef.current.add(drop);
            activeDrops.push({ mesh: drop, speed: 2.2 + Math.random() * 0.4, y: 1.15 });
          }
        }

        // Update drops positions
        for (let i = activeDrops.length - 1; i >= 0; i--) {
          const d = activeDrops[i];
          d.y -= d.speed * delta;
          d.mesh.position.y = d.y;

          // Splash into flask liquid at y = 0.58
          if (d.y <= 0.58) {
            dropsGroupRef.current.remove(d.mesh);
            d.mesh.geometry.dispose();
            (d.mesh.material as THREE.Material).dispose();
            activeDrops.splice(i, 1);
          }
        }
      }

      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        if (isVRMode) {
          // Stereoscopic split screen rendering
          const originalAspect = cameraRef.current.aspect;
          const fullWidth = containerRef.current?.clientWidth || 800;
          const fullHeight = containerRef.current?.clientHeight || 550;
          const halfWidth = fullWidth / 2;

          rendererRef.current.setScissorTest(true);

          // Left eye
          cameraRef.current.aspect = halfWidth / fullHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setViewport(0, 0, halfWidth, fullHeight);
          rendererRef.current.setScissor(0, 0, halfWidth, fullHeight);
          cameraRef.current.position.x -= 0.035; // Eye separation
          rendererRef.current.render(sceneRef.current, cameraRef.current);
          cameraRef.current.position.x += 0.035;

          // Right eye
          rendererRef.current.setViewport(halfWidth, 0, halfWidth, fullHeight);
          rendererRef.current.setScissor(halfWidth, 0, halfWidth, fullHeight);
          cameraRef.current.position.x += 0.035;
          rendererRef.current.render(sceneRef.current, cameraRef.current);
          cameraRef.current.position.x -= 0.035;

          cameraRef.current.aspect = originalAspect;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setScissorTest(false);
        } else {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update dynamic elements when props change
  useEffect(() => {
    // 1. Update Burette liquid column
    if (buretteLiquidMeshRef.current) {
      const remainingFrac = Math.max(0, 1 - volumeDispensed / totalBuretteCapacity);
      const fullHeight = 1.35; // Height of 50mL column
      const curHeight = Math.max(0.01, fullHeight * remainingFrac);
      buretteLiquidMeshRef.current.scale.set(1, curHeight / fullHeight, 1);
      // Position liquid so bottom is anchored above stopcock (y = 1.25)
      buretteLiquidMeshRef.current.position.y = 1.25 + curHeight / 2;
    }

    // 2. Update Flask liquid color and slightly rise volume
    if (flaskLiquidMeshRef.current) {
      const mat = flaskLiquidMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.set(solutionColor);

      // Volume rise
      const initialVolHeight = 0.18;
      const extraHeight = (volumeDispensed / totalBuretteCapacity) * 0.06;
      flaskLiquidMeshRef.current.scale.set(1, (initialVolHeight + extraHeight) / initialVolHeight, 1);
    }

    // 3. Update digital pH meter display texture
    if (phScreenCanvasRef.current && phScreenTextureRef.current) {
      const ctx = phScreenCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 256, 128);

        // Header
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('pH METER | Rafik Jellali', 12, 28);

        // Value
        ctx.fillStyle = '#38bdf8'; // Glowing cyan
        ctx.font = 'bold 64px monospace';
        ctx.fillText(pH.toFixed(2), 24, 90);

        ctx.font = '22px monospace';
        ctx.fillStyle = '#22c55e';
        ctx.fillText('25.0 °C', 155, 115);

        phScreenTextureRef.current.needsUpdate = true;
      }
    }
  }, [volumeDispensed, solutionColor, pH, totalBuretteCapacity]);

  // Camera presets
  const setCameraPreset = (preset: CameraViewMode['id']) => {
    setActiveCameraView(preset);
    if (!cameraRef.current) return;

    if (preset === 'closeup_flask') {
      cameraAngleRef.current = { theta: 0.1, phi: 0.22, radius: 2.8 };
      cameraTargetRef.current.set(0, 0.95, 0);
    } else if (preset === 'closeup_burette') {
      cameraAngleRef.current = { theta: 0.25, phi: 0.35, radius: 2.4 };
      cameraTargetRef.current.set(0, 1.8, 0);
    } else if (preset === 'whiteboard') {
      cameraAngleRef.current = { theta: -0.65, phi: 0.2, radius: 5.2 };
      cameraTargetRef.current.set(1.5, 1.5, 0);
    } else if (preset === 'panoramic') {
      cameraAngleRef.current = { theta: 0.0, phi: 0.45, radius: 5.8 };
      cameraTargetRef.current.set(0, 1.3, 0);
    } else {
      // Orbit default
      cameraAngleRef.current = { theta: 0.15, phi: 0.28, radius: 4.2 };
      cameraTargetRef.current.set(0, 1.25, 0);
    }
    updateCameraPosition();
  };

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const x = cameraTargetRef.current.x + radius * Math.cos(phi) * Math.sin(theta);
    const y = cameraTargetRef.current.y + radius * Math.sin(phi);
    const z = cameraTargetRef.current.z + radius * Math.cos(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(cameraTargetRef.current);
  };

  // Mouse drag handling for orbital inspection
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };

    cameraAngleRef.current.theta -= deltaX * 0.008;
    cameraAngleRef.current.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, cameraAngleRef.current.phi + deltaY * 0.008));
    updateCameraPosition();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraAngleRef.current.radius = Math.max(1.8, Math.min(8.0, cameraAngleRef.current.radius + e.deltaY * 0.003));
    updateCameraPosition();
  };

  // Build 3D laboratory scene
  const buildLabScene = (scene: THREE.Scene) => {
    // 1. Laboratory Bench Table
    const tableGeo = new THREE.BoxGeometry(6.5, 0.2, 3.8);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark laboratory epoxy countertop
      roughness: 0.35,
      metalness: 0.15,
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.position.set(0, 0.1, 0);
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);

    // Bench bevel trim
    const trimGeo = new THREE.BoxGeometry(6.6, 0.05, 3.9);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.position.set(0, 0.2, 0);
    scene.add(trimMesh);

    // 2. Retort Stand Base & Rod (حامل معدني)
    const standBaseGeo = new THREE.BoxGeometry(0.55, 0.04, 0.85);
    const standBaseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.4 });
    const standBase = new THREE.Mesh(standBaseGeo, standBaseMat);
    standBase.position.set(0.18, 0.22, -0.3);
    standBase.castShadow = true;
    scene.add(standBase);

    // Chrome vertical rod
    const rodGeo = new THREE.CylinderGeometry(0.016, 0.016, 2.7, 16);
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.1, metalness: 0.95 });
    const rod = new THREE.Mesh(rodGeo, chromeMat);
    rod.position.set(0.18, 1.55, -0.65);
    rod.castShadow = true;
    scene.add(rod);

    // Clamps holding the burette
    [1.7, 2.3].forEach((clampY) => {
      const clampArmGeo = new THREE.BoxGeometry(0.03, 0.03, 0.38);
      const clampArm = new THREE.Mesh(clampArmGeo, chromeMat);
      clampArm.position.set(0.09, clampY, -0.46);
      scene.add(clampArm);

      const clampGripGeo = new THREE.TorusGeometry(0.04, 0.012, 8, 16, Math.PI * 1.5);
      const clampGrip = new THREE.Mesh(clampGripGeo, new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 }));
      clampGrip.rotation.x = Math.PI / 2;
      clampGrip.position.set(0, clampY, -0.28);
      scene.add(clampGrip);
    });

    // 3. Magnetic Stirrer Base (المحرك المغناطيسي)
    const stirrerBaseGeo = new THREE.BoxGeometry(0.85, 0.22, 0.95);
    const stirrerMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.2 });
    const stirrerMesh = new THREE.Mesh(stirrerBaseGeo, stirrerMat);
    stirrerMesh.position.set(0, 0.33, 0);
    stirrerMesh.castShadow = true;
    scene.add(stirrerMesh);

    // Stirrer Top Plate (White ceramic)
    const plateGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.03, 32);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15, metalness: 0.05 });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.set(0, 0.45, 0);
    scene.add(plateMesh);

    // Stirrer Front Controls: Speed Dial Knob & LED
    const knobGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16);
    const knobMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.2 });
    const knob = new THREE.Mesh(knobGeo, knobMat);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(-0.15, 0.32, 0.49);
    scene.add(knob);

    const ledGeo = new THREE.SphereGeometry(0.02, 12, 12);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e }); // Green active LED
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0.15, 0.32, 0.49);
    scene.add(led);

    // 4. Erlenmeyer Flask (الدورق المخروطي)
    // Custom Lathe for realistic Erlenmeyer flask geometry
    const flaskPoints: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.34, 0.0), // Base radius
      new THREE.Vector2(0.35, 0.03),
      new THREE.Vector2(0.12, 0.42), // Conical body taper
      new THREE.Vector2(0.11, 0.62), // Neck
      new THREE.Vector2(0.13, 0.64), // Rim lip
    ];
    const flaskGeo = new THREE.LatheGeometry(flaskPoints, 32);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.52, // Glass refraction index
      thickness: 0.06,
      specularIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const flaskMesh = new THREE.Mesh(flaskGeo, glassMat);
    flaskMesh.position.set(0, 0.46, 0);
    flaskMesh.castShadow = true;
    scene.add(flaskMesh);

    // Flask Liquid Body
    const liquidPoints: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.01),
      new THREE.Vector2(0.32, 0.01),
      new THREE.Vector2(0.24, 0.18),
      new THREE.Vector2(0.0, 0.18),
    ];
    const liquidGeo = new THREE.LatheGeometry(liquidPoints, 32);
    const liquidMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(solutionColor),
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88,
    });
    const flaskLiquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    flaskLiquidMesh.position.set(0, 0.46, 0);
    flaskLiquidMeshRef.current = flaskLiquidMesh;
    scene.add(flaskLiquidMesh);

    // Magnetic Stir Bar (inside flask)
    const stirBarGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.14, 16);
    const stirBarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const stirBar = new THREE.Mesh(stirBarGeo, stirBarMat);
    stirBar.rotation.x = Math.PI / 2;
    stirBar.position.set(0, 0.48, 0);
    stirBarMeshRef.current = stirBar;
    scene.add(stirBar);

    // 5. Burette (السحاحة المدرجة)
    const buretteGlassGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.45, 24, 1, true);
    const buretteGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      transparent: true,
      roughness: 0.04,
      ior: 1.5,
      thickness: 0.02,
    });
    const buretteGlass = new THREE.Mesh(buretteGlassGeo, buretteGlassMat);
    buretteGlass.position.set(0, 1.95, 0);
    scene.add(buretteGlass);

    // Burette Liquid Column (NaOH solution)
    const buretteLiquidGeo = new THREE.CylinderGeometry(0.032, 0.032, 1.35, 24);
    const buretteLiquidMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd, // Clear aqueous bluish tone
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: 0.75,
    });
    const buretteLiquid = new THREE.Mesh(buretteLiquidGeo, buretteLiquidMat);
    buretteLiquid.position.set(0, 1.92, 0);
    buretteLiquidMeshRef.current = buretteLiquid;
    scene.add(buretteLiquid);

    // Burette Tip & Stopcock Assembly (صنبور السحاحة)
    const tipGeo = new THREE.ConeGeometry(0.035, 0.12, 16);
    tipGeo.rotateX(Math.PI);
    const tipMesh = new THREE.Mesh(tipGeo, buretteGlassMat);
    tipMesh.position.set(0, 1.20, 0);
    scene.add(tipMesh);

    // Stopcock Valve housing
    const valveGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 16);
    valveGeo.rotateZ(Math.PI / 2);
    const valveMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
    const valveMesh = new THREE.Mesh(valveGeo, valveMat);
    valveMesh.position.set(0, 1.25, 0);
    scene.add(valveMesh);

    // Stopcock rotatable handle
    const stopcockGroup = new THREE.Group();
    stopcockGroup.position.set(0, 1.25, 0);

    const handleStemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8);
    handleStemGeo.rotateX(Math.PI / 2);
    const handleWingGeo = new THREE.BoxGeometry(0.12, 0.035, 0.03);
    const handleWing = new THREE.Mesh(handleWingGeo, new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
    const handleStem = new THREE.Mesh(handleStemGeo, new THREE.MeshStandardMaterial({ color: 0x0369a1 }));
    stopcockGroup.add(handleStem);
    stopcockGroup.add(handleWing);
    scene.add(stopcockGroup);
    stopcockHandleMeshRef.current = stopcockGroup;

    // Drops group
    const dropsGroup = new THREE.Group();
    scene.add(dropsGroup);
    dropsGroupRef.current = dropsGroup;

    // 6. Benchtop Digital pH Meter
    const phBodyGeo = new THREE.BoxGeometry(0.7, 0.18, 0.6);
    const phBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const phBody = new THREE.Mesh(phBodyGeo, phBodyMat);
    phBody.position.set(1.3, 0.31, 0.2);
    scene.add(phBody);

    // Slanted display bezel
    const phScreenBezelGeo = new THREE.BoxGeometry(0.55, 0.04, 0.35);
    const phScreenBezel = new THREE.Mesh(phScreenBezelGeo, new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    phScreenBezel.position.set(1.3, 0.42, 0.15);
    phScreenBezel.rotation.x = -Math.PI / 8;
    scene.add(phScreenBezel);

    // Create dynamic canvas texture for pH LCD screen
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 256;
    screenCanvas.height = 128;
    phScreenCanvasRef.current = screenCanvas;

    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    phScreenTextureRef.current = screenTexture;

    const screenPlaneGeo = new THREE.PlaneGeometry(0.48, 0.25);
    const screenPlaneMat = new THREE.MeshBasicMaterial({ map: screenTexture });
    const screenPlane = new THREE.Mesh(screenPlaneGeo, screenPlaneMat);
    screenPlane.position.set(1.3, 0.43, 0.16);
    screenPlane.rotation.x = -Math.PI / 8;
    scene.add(screenPlane);

    // Electrode arm & cable into flask
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.3, 0.45, 0.0),
      new THREE.Vector3(0.8, 1.1, -0.1),
      new THREE.Vector3(0.3, 0.9, -0.05),
      new THREE.Vector3(0.12, 0.65, 0.0),
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 20, 0.014, 8, false);
    const armMesh = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 }));
    scene.add(armMesh);

    // Glass electrode bulb immersed in solution
    const electrodeGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.28, 12);
    const electrodeMesh = new THREE.Mesh(electrodeGeo, new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 }));
    electrodeMesh.position.set(0.1, 0.54, 0.0);
    scene.add(electrodeMesh);

    // 7. Laboratory Reagent Bottles on Bench
    // Reagent 1: HCl (حمض كلور الماء)
    const hclBottle = createReagentBottle('HCl 0.1M', 0xef4444);
    hclBottle.position.set(-1.1, 0.46, -0.4);
    scene.add(hclBottle);

    // Reagent 2: NaOH (هيدروكسيد الصوديوم)
    const naohBottle = createReagentBottle('NaOH 0.1M', 0x3b82f6);
    naohBottle.position.set(-1.6, 0.46, -0.3);
    scene.add(naohBottle);

    // Reagent 3: Indicator Dropper Bottle (فينول فتالين)
    const indBottle = createReagentBottle('فينول فتالين', 0xec4899);
    indBottle.position.set(-0.85, 0.42, 0.3);
    indBottle.scale.set(0.75, 0.75, 0.75);
    scene.add(indBottle);

    // 8. Watermark Plate in 3D Lab
    const badgeGeo = new THREE.BoxGeometry(1.6, 0.25, 0.04);
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 0.18, 1.85);
    scene.add(badge);
  };

  const createReagentBottle = (label: string, capColor: number): THREE.Group => {
    const group = new THREE.Group();

    // Bottle body (Amber laboratory glass)
    const bodyGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.38, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Amber glass
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Cap
    const capGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.09, 16);
    const capMat = new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.3 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.23;
    group.add(cap);

    // Label Plane
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 128;
    labelCanvas.height = 64;
    const ctx = labelCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 128, 64);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, 64, 38);
    }
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelGeo = new THREE.PlaneGeometry(0.18, 0.12);
    const labelMesh = new THREE.Mesh(labelGeo, new THREE.MeshBasicMaterial({ map: labelTexture }));
    labelMesh.position.set(0, 0, 0.145);
    group.add(labelMesh);

    return group;
  };

  return (
    <div className="relative w-full h-full flex flex-col select-none overflow-hidden bg-slate-950 rounded-xl border border-slate-800 shadow-2xl">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* VR Watermark Overlay */}
        <div className="absolute top-4 right-4 pointer-events-none z-10 flex flex-col items-end">
          <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-700/60 shadow-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold tracking-wide text-slate-200">
              مختبر العلوم الافتراضي (PraxiLabs VR)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 font-medium bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
            إشراف وتطوير: <strong className="text-cyan-400">رفيق جلالي</strong>
          </span>
        </div>

        {/* Floating Quick Action Bar on Canvas */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          {/* Direct Drop Controls */}
          <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-xl">
            <button
              onClick={onAddOneDrop}
              className="px-3.5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 active:scale-95 rounded-lg transition-all flex items-center gap-1.5 shadow-md"
              title="إضافة قطرة واحدة (0.05 mL)"
            >
              <span className="text-base leading-none">💧</span>
              <span>قطرة واحدة (0.05 mL)</span>
            </button>

            <button
              onClick={onToggleFlow}
              className={`px-3.5 py-2 text-xs font-bold text-white rounded-lg transition-all flex items-center gap-1.5 shadow-md active:scale-95 ${
                isFlowing
                  ? 'bg-rose-600 hover:bg-rose-500 ring-2 ring-rose-400/50'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isFlowing ? 'animate-spin' : ''}`} />
              <span>{isFlowing ? 'إغلاق الصنبور' : 'فتح الصنبور'}</span>
            </button>
          </div>

          {/* Camera View Switcher & VR Mode Toggle */}
          <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-xl">
            <button
              onClick={() => setCameraPreset('closeup_flask')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                activeCameraView === 'closeup_flask'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="تركيز على الدورق ومحلول التفاعل"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>الدورق</span>
            </button>

            <button
              onClick={() => setCameraPreset('closeup_burette')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                activeCameraView === 'closeup_burette'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="تركيز على السحاحة والصنبور"
            >
              <span>السحاحة</span>
            </button>

            <button
              onClick={() => setCameraPreset('orbit')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                activeCameraView === 'orbit'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="عرض ثلاثي الأبعاد حر (تدوير بالفأرة)"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>عرض 3D</span>
            </button>

            <div className="w-[1px] h-5 bg-slate-700 mx-0.5" />

            <button
              onClick={onToggleVR}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md ${
                isVRMode
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                  : 'bg-slate-800 text-purple-300 hover:bg-slate-700 hover:text-purple-200'
              }`}
              title="تفعيل وضع الواقع الافتراضي ونظارات VR"
            >
              <Glasses className="w-4 h-4" />
              <span>{isVRMode ? 'خروج من VR' : 'واقع افتراضي (VR)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
