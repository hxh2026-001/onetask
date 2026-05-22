import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { LABColor } from "~/lib/colorMath";

type ColorLabSceneProps = {
  colors: LABColor[];
  trajectories?: { from: LABColor; to: LABColor; progress: number }[];
  fragments?: { position: LABColor; velocity: { l: number; a: number; b: number }; alpha: number }[];
  showAxes?: boolean;
  showGamut?: boolean;
  onColorSelect?: (color: LABColor, index: number) => void;
  selectedIndex?: number;
};

const GAMUT_BOUNDS = {
  l: { min: 0, max: 100 },
  a: { min: -128, max: 127 },
  b: { min: -128, max: 127 }
};

function labToThreeColor(color: LABColor): THREE.Color {
  const l = (color.l + 16) / 116;
  const a = color.a / 500 + l;
  const b = l - color.b / 200;

  const x = 0.95047 * (Math.pow(a, 3) > 0.008856 ? Math.pow(a, 3) : (a - 16 / 116) / 7.787);
  const y = 1.0 * (Math.pow(l, 3) > 0.008856 ? Math.pow(l, 3) : (l - 16 / 116) / 7.787);
  const z = 1.08883 * (Math.pow(b, 3) > 0.008856 ? Math.pow(b, 3) : (b - 16 / 116) / 7.787);

  const r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  const g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  const bl = x * 0.0557 + y * -0.204 + z * 1.057;

  return new THREE.Color(
    Math.max(0, Math.min(1, r)),
    Math.max(0, Math.min(1, g)),
    Math.max(0, Math.min(1, bl))
  );
}

function labToPosition(color: LABColor): THREE.Vector3 {
  return new THREE.Vector3(
    (color.a - GAMUT_BOUNDS.a.min) / (GAMUT_BOUNDS.a.max - GAMUT_BOUNDS.a.min) * 10 - 5,
    (color.l - GAMUT_BOUNDS.l.min) / (GAMUT_BOUNDS.l.max - GAMUT_BOUNDS.l.min) * 10 - 5,
    (color.b - GAMUT_BOUNDS.b.min) / (GAMUT_BOUNDS.b.max - GAMUT_BOUNDS.b.min) * 10 - 5
  );
}

export function ColorLabScene({
  colors,
  trajectories = [],
  fragments = [],
  showAxes = true,
  showGamut = true,
  onColorSelect,
  selectedIndex
}: ColorLabSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const colorSpheresRef = useRef<THREE.Mesh[]>([]);
  const trajectoryLinesRef = useRef<THREE.Line[]>([]);
  const fragmentMeshesRef = useRef<THREE.Mesh[]>([]);
  const animationRef = useRef<number>(0);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(8, 8, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    if (showAxes) {
      const axesHelper = new THREE.AxesHelper(6);
      scene.add(axesHelper);

      const gridHelper = new THREE.GridHelper(12, 12, 0x444444, 0x222222);
      scene.add(gridHelper);
    }

    if (showGamut) {
      const gamutGeometry = new THREE.BoxGeometry(
        (GAMUT_BOUNDS.a.max - GAMUT_BOUNDS.a.min) / 25.6,
        (GAMUT_BOUNDS.l.max - GAMUT_BOUNDS.l.min) / 10,
        (GAMUT_BOUNDS.b.max - GAMUT_BOUNDS.b.min) / 25.6
      );
      const gamutEdges = new THREE.EdgesGeometry(gamutGeometry);
      const gamutLine = new THREE.LineSegments(
        gamutEdges,
        new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.3 })
      );
      gamutLine.position.set(0, 0, 0);
      scene.add(gamutLine);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x8888ff, 0.5, 100);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current || !onColorSelect) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(colorSpheresRef.current);
      if (intersects.length > 0) {
        const index = colorSpheresRef.current.indexOf(intersects[0].object as THREE.Mesh);
        if (index >= 0 && colors[index]) {
          onColorSelect(colors[index], index);
        }
      }
    };

    container.addEventListener("click", handleClick);

    let angle = 0;
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      angle += 0.005;
      if (cameraRef.current) {
        cameraRef.current.position.x = 10 * Math.cos(angle);
        cameraRef.current.position.z = 10 * Math.sin(angle);
        cameraRef.current.lookAt(0, 0, 0);
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationRef.current);
      if (rendererRef.current) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [showAxes, showGamut, onColorSelect, colors]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    colorSpheresRef.current.forEach((sphere) => scene.remove(sphere));
    colorSpheresRef.current = [];

    colors.forEach((color, index) => {
      const geometry = new THREE.SphereGeometry(0.3, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: labToThreeColor(color),
        emissive: labToThreeColor(color),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: selectedIndex === index ? 1 : 0.8
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(labToPosition(color));
      scene.add(sphere);
      colorSpheresRef.current.push(sphere);

      if (selectedIndex === index) {
        const ringGeometry = new THREE.RingGeometry(0.4, 0.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(sphere.position);
        scene.add(ring);
      }
    });
  }, [colors, selectedIndex]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    trajectoryLinesRef.current.forEach((line) => scene.remove(line));
    trajectoryLinesRef.current = [];

    trajectories.forEach((traj) => {
      const points: THREE.Vector3[] = [];
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * traj.progress;
        const interpolated = {
          l: traj.from.l + (traj.to.l - traj.from.l) * t,
          a: traj.from.a + (traj.to.a - traj.from.a) * t,
          b: traj.from.b + (traj.to.b - traj.from.b) * t
        };
        points.push(labToPosition(interpolated));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: labToThreeColor(traj.to),
        transparent: true,
        opacity: 0.8
      });
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      trajectoryLinesRef.current.push(line);
    });
  }, [trajectories]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    fragmentMeshesRef.current.forEach((frag) => scene.remove(frag));
    fragmentMeshesRef.current = [];

    fragments.forEach((frag) => {
      const geometry = new THREE.TetrahedronGeometry(0.1);
      const material = new THREE.MeshPhongMaterial({
        color: labToThreeColor(frag.position),
        transparent: true,
        opacity: frag.alpha,
        emissive: labToThreeColor(frag.position),
        emissiveIntensity: 0.5
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(labToPosition(frag.position));
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      scene.add(mesh);
      fragmentMeshesRef.current.push(mesh);
    });
  }, [fragments]);

  return <div ref={containerRef} className="w-full h-full min-h-96 rounded-lg overflow-hidden" />;
}
