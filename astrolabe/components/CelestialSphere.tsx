import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

interface StarData {
  id: number;
  name: string;
  ra_hours: number;
  ra_minutes: number;
  ra_seconds: number;
  dec_degrees: number;
  dec_minutes: number;
  dec_seconds: number;
  magnitude: number;
  spectral_type: string;
  constellation: string;
}

interface ConstellationLine {
  constellation: string;
  star1_id: number;
  star2_id: number;
}

interface CelestialSphereProps {
  stars: StarData[];
  constellationLines: ConstellationLine[];
  latitude: number;
  date: Date;
  onAngleChange: (azimuth: number, altitude: number) => void;
}

export default function CelestialSphere({ stars, constellationLines, latitude, date, onAngleChange }: CelestialSphereProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const constellationLinesRef = useRef<THREE.LineSegments | null>(null);
  const horizonRef = useRef<THREE.Mesh | null>(null);
  
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number>(0);
  const starPulsePhase = useRef<number>(0);
  const horizonHeight = useRef<number>(0);

  const degToRad = (deg: number) => deg * (Math.PI / 180);
  const raToDeg = (hours: number, minutes: number, seconds: number) => (hours + minutes / 60 + seconds / 3600) * 15;
  const decToDeg = (degrees: number, minutes: number, seconds: number) => {
    const sign = degrees < 0 ? -1 : 1;
    return sign * (Math.abs(degrees) + minutes / 60 + seconds / 3600);
  };

  const createStarField = useCallback((starData: StarData[]) => {
    const positions = new Float32Array(starData.length * 3);
    const sizes = new Float32Array(starData.length);
    const colors = new Float32Array(starData.length * 3);

    starData.forEach((star, i) => {
      const ra = raToDeg(star.ra_hours, star.ra_minutes, star.ra_seconds);
      const dec = decToDeg(star.dec_degrees, star.dec_minutes, star.dec_seconds);
      
      const phi = degToRad(90 - dec);
      const theta = degToRad(ra);

      positions[i * 3] = 5 * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = 5 * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = 5 * Math.cos(phi);

      const size = Math.max(0.5, 3 - star.magnitude);
      sizes[i] = size;

      const spectralColor = getSpectralColor(star.spectral_type);
      colors[i * 3] = spectralColor.r;
      colors[i * 3 + 1] = spectralColor.g;
      colors[i * 3 + 2] = spectralColor.b;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    return new THREE.Points(geometry, material);
  }, []);

  const getSpectralColor = (spectralType: string) => {
    const type = spectralType.charAt(0);
    switch (type) {
      case 'O': return { r: 0.7, g: 0.8, b: 1.0 };
      case 'B': return { r: 0.8, g: 0.85, b: 1.0 };
      case 'A': return { r: 0.95, g: 0.95, b: 1.0 };
      case 'F': return { r: 1.0, g: 1.0, b: 0.9 };
      case 'G': return { r: 1.0, g: 0.95, b: 0.8 };
      case 'K': return { r: 1.0, g: 0.85, b: 0.6 };
      case 'M': return { r: 1.0, g: 0.7, b: 0.4 };
      default: return { r: 1.0, g: 1.0, b: 1.0 };
    }
  };

  const createConstellationLines = useCallback((starData: StarData[], lines: ConstellationLine[]) => {
    const linePositions = new Float32Array(lines.length * 6);

    const starMap = new Map<number, { ra: number; dec: number }>();
    starData.forEach(star => {
      starMap.set(star.id, {
        ra: raToDeg(star.ra_hours, star.ra_minutes, star.ra_seconds),
        dec: decToDeg(star.dec_degrees, star.dec_minutes, star.dec_seconds)
      });
    });

    lines.forEach((line, i) => {
      const star1 = starMap.get(line.star1_id);
      const star2 = starMap.get(line.star2_id);

      if (star1 && star2) {
        const phi1 = degToRad(90 - star1.dec);
        const theta1 = degToRad(star1.ra);
        const phi2 = degToRad(90 - star2.dec);
        const theta2 = degToRad(star2.ra);

        linePositions[i * 6] = 5 * Math.sin(phi1) * Math.cos(theta1);
        linePositions[i * 6 + 1] = 5 * Math.sin(phi1) * Math.sin(theta1);
        linePositions[i * 6 + 2] = 5 * Math.cos(phi1);
        linePositions[i * 6 + 3] = 5 * Math.sin(phi2) * Math.cos(theta2);
        linePositions[i * 6 + 4] = 5 * Math.sin(phi2) * Math.sin(theta2);
        linePositions[i * 6 + 5] = 5 * Math.cos(phi2);
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.4,
    });

    return new THREE.LineSegments(geometry, material);
  }, []);

  const createEclipticPlane = useCallback(() => {
    const curve = new THREE.EllipseCurve(
      0, 0,
      5.2, 5.2,
      0, 2 * Math.PI,
      false,
      0
    );

    const points = curve.getPoints(128);
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map(p => new THREE.Vector3(p.x, p.y, 0))
    );

    const material = new THREE.LineBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.5,
      linewidth: 2,
    });

    const ecliptic = new THREE.Line(geometry, material);
    ecliptic.rotation.x = degToRad(23.44);
    return ecliptic;
  }, []);

  const createGrid = useCallback(() => {
    const lines: THREE.Vector3[] = [];
    
    for (let ra = 0; ra < 360; ra += 30) {
      const points: THREE.Vector3[] = [];
      for (let dec = -90; dec <= 90; dec += 5) {
        const phi = degToRad(90 - dec);
        const theta = degToRad(ra);
        points.push(new THREE.Vector3(
          5.1 * Math.sin(phi) * Math.cos(theta),
          5.1 * Math.sin(phi) * Math.sin(theta),
          5.1 * Math.cos(phi)
        ));
      }
      for (let i = 0; i < points.length - 1; i++) {
        lines.push(points[i], points[i + 1]);
      }
    }

    for (let dec = -90; dec <= 90; dec += 15) {
      const points: THREE.Vector3[] = [];
      for (let ra = 0; ra <= 360; ra += 5) {
        const phi = degToRad(90 - dec);
        const theta = degToRad(ra);
        points.push(new THREE.Vector3(
          5.1 * Math.sin(phi) * Math.cos(theta),
          5.1 * Math.sin(phi) * Math.sin(theta),
          5.1 * Math.cos(phi)
        ));
      }
      for (let i = 0; i < points.length - 1; i++) {
        lines.push(points[i], points[i + 1]);
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(lines);
    const material = new THREE.LineBasicMaterial({
      color: 0x336699,
      transparent: true,
      opacity: 0.3,
    });

    return new THREE.LineSegments(geometry, material);
  }, []);

  const createHorizon = useCallback(() => {
    const geometry = new THREE.SphereGeometry(4.9, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      color: 0x0a1628,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const horizon = new THREE.Mesh(geometry, material);
    horizon.position.y = 0;
    return horizon;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 12);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const grid = createGrid();
    scene.add(grid);

    const ecliptic = createEclipticPlane();
    scene.add(ecliptic);

    const sphereGeometry = new THREE.SphereGeometry(5, 64, 64);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x050a15,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);
    sphereRef.current = sphere;

    const starField = createStarField(stars);
    scene.add(starField);
    starsRef.current = starField;

    const constellationLineObject = createConstellationLines(stars, constellationLines);
    scene.add(constellationLineObject);
    constellationLinesRef.current = constellationLineObject;

    const horizon = createHorizon();
    scene.add(horizon);
    horizonRef.current = horizon;

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    const handleMouseDown = (event: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: event.clientX, y: event.clientY };
      velocity.current = { x: 0, y: 0 };
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging.current || !sphere) return;

      const deltaX = event.clientX - previousMousePosition.current.x;
      const deltaY = event.clientY - previousMousePosition.current.y;

      velocity.current = { x: deltaX * 0.5, y: deltaY * 0.5 };

      sphere.rotation.y += deltaX * 0.01;
      sphere.rotation.x += deltaY * 0.01;

      starField.rotation.y += deltaX * 0.01;
      starField.rotation.x += deltaY * 0.01;

      constellationLineObject.rotation.y += deltaX * 0.01;
      constellationLineObject.rotation.x += deltaY * 0.01;

      grid.rotation.y += deltaX * 0.01;
      grid.rotation.x += deltaY * 0.01;

      ecliptic.rotation.y += deltaX * 0.01;
      ecliptic.rotation.x += deltaY * 0.01;

      previousMousePosition.current = { x: event.clientX, y: event.clientY };

      const azimuth = ((sphere.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const altitude = Math.PI / 2 - sphere.rotation.x;
      onAngleChange(azimuth * (180 / Math.PI), altitude * (180 / Math.PI));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        isDragging.current = true;
        previousMousePosition.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        velocity.current = { x: 0, y: 0 };
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isDragging.current || event.touches.length !== 1 || !sphere) return;

      const deltaX = event.touches[0].clientX - previousMousePosition.current.x;
      const deltaY = event.touches[0].clientY - previousMousePosition.current.y;

      velocity.current = { x: deltaX * 0.5, y: deltaY * 0.5 };

      sphere.rotation.y += deltaX * 0.01;
      sphere.rotation.x += deltaY * 0.01;

      starField.rotation.y += deltaX * 0.01;
      starField.rotation.x += deltaY * 0.01;

      constellationLineObject.rotation.y += deltaX * 0.01;
      constellationLineObject.rotation.x += deltaY * 0.01;

      grid.rotation.y += deltaX * 0.01;
      grid.rotation.x += deltaY * 0.01;

      ecliptic.rotation.y += deltaX * 0.01;
      ecliptic.rotation.x += deltaY * 0.01;

      previousMousePosition.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mouseleave', handleMouseUp);
    renderer.domElement.addEventListener('touchstart', handleTouchStart);
    renderer.domElement.addEventListener('touchmove', handleTouchMove);
    renderer.domElement.addEventListener('touchend', handleTouchEnd);

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      if (!isDragging.current) {
        const friction = 0.95;
        velocity.current.x *= friction;
        velocity.current.y *= friction;

        if (Math.abs(velocity.current.x) > 0.01 || Math.abs(velocity.current.y) > 0.01) {
          if (sphere) {
            sphere.rotation.y += velocity.current.x * 0.01;
            sphere.rotation.x += velocity.current.y * 0.01;
          }

          if (starField) {
            starField.rotation.y += velocity.current.x * 0.01;
            starField.rotation.x += velocity.current.y * 0.01;
          }

          if (constellationLineObject) {
            constellationLineObject.rotation.y += velocity.current.x * 0.01;
            constellationLineObject.rotation.x += velocity.current.y * 0.01;
          }

          if (grid) {
            grid.rotation.y += velocity.current.x * 0.01;
            grid.rotation.x += velocity.current.y * 0.01;
          }

          if (ecliptic) {
            ecliptic.rotation.y += velocity.current.x * 0.01;
            ecliptic.rotation.x += velocity.current.y * 0.01;
          }
        }
      }

      starPulsePhase.current += 0.02;
      if (starField && starField.material instanceof THREE.PointsMaterial) {
        const baseOpacity = 0.9;
        const pulseAmplitude = 0.1;
        starField.material.opacity = baseOpacity + Math.sin(starPulsePhase.current) * pulseAmplitude;
      }

      const targetHorizonHeight = degToRad(latitude) * 2;
      horizonHeight.current += (targetHorizonHeight - horizonHeight.current) * 0.05;
      if (horizon) {
        horizon.rotation.x = Math.PI / 2 + horizonHeight.current;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mouseleave', handleMouseUp);
      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      renderer.domElement.removeEventListener('touchmove', handleTouchMove);
      renderer.domElement.removeEventListener('touchend', handleTouchEnd);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [stars, constellationLines, latitude, createStarField, createConstellationLines, createEclipticPlane, createGrid, createHorizon, onAngleChange]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[400px] cursor-grab active:cursor-grabbing"
    />
  );
}