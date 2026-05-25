'use client';

import * as THREE from 'three';
import type { MazeState, TimeNode, CalendarType } from '@/lib/types';
import { CALENDAR_COLORS } from '@/lib/constants';

export class ChronoMazeScene {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  private mazeGroup: THREE.Group;
  private nodeMeshes: Map<string, THREE.Mesh> = new Map();
  private connectionLines: THREE.Line[] = [];
  private calendarAxes: THREE.Group[] = [];
  private pathMeshes: THREE.Line[] = [];
  private trailPoints: THREE.Vector3[] = [];
  private trailMesh: THREE.Line | null = null;

  private currentNodeId: string = 'start';
  private targetNodeId: string = 'target';
  private mazeState: MazeState | null = null;

  private sweepLight: THREE.PointLight | null = null;
  private sweepPosition = 0;
  private sweepDirection = 1;

  private animationFrameId: number = 0;
  private animationCallbacks: Map<string, () => void> = new Map();

  private heartbeatActive = false;
  private mosaicParts: THREE.Mesh[] = [];
  private mosaicActive = false;
  private highlightedNode: THREE.Mesh | null = null;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(15, 15, 15);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0a1a, 1);

    this.mazeGroup = new THREE.Group();
    this.scene.add(this.mazeGroup);

    this.setupLights();
    this.setupCalendarAxes();
    this.setupEventListeners();
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404080, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x4a9eff, 0.5, 50);
    pointLight1.position.set(-10, 5, 0);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff6b35, 0.5, 50);
    pointLight2.position.set(10, 5, 10);
    this.scene.add(pointLight2);

    this.sweepLight = new THREE.PointLight(0xffff00, 2, 30);
    this.sweepLight.position.set(0, 10, 0);
    this.scene.add(this.sweepLight);
  }

  private setupCalendarAxes() {
    const calendars: CalendarType[] = ['gregorian', 'lunar', 'mayan', 'persian'];

    calendars.forEach((cal, i) => {
      const axisGroup = new THREE.Group();

      const geometry = new THREE.CylinderGeometry(0.05, 0.05, 30, 8);
      const material = new THREE.MeshBasicMaterial({
        color: CALENDAR_COLORS[cal],
        transparent: true,
        opacity: 0.6
      });

      const xAxis = new THREE.Mesh(geometry, material);
      xAxis.rotation.z = Math.PI / 2;
      axisGroup.add(xAxis);

      const yAxis = new THREE.Mesh(geometry, material);
      axisGroup.add(yAxis);

      const zAxis = new THREE.Mesh(geometry, material);
      zAxis.rotation.x = Math.PI / 2;
      axisGroup.add(zAxis);

      const wAxis = new THREE.Mesh(geometry, material);
      wAxis.rotation.x = Math.PI / 4;
      wAxis.rotation.y = Math.PI / 4;
      axisGroup.add(wAxis);

      axisGroup.position.set((i - 1.5) * 8, 0, -15);
      this.calendarAxes.push(axisGroup);
      this.mazeGroup.add(axisGroup);
    });
  }

  private setupEventListeners() {
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  init() {
    this.container.appendChild(this.renderer.domElement);
    this.animate();
  }

  updateMazeState(state: MazeState) {
    this.mazeState = state;
    this.currentNodeId = state.currentNode;
    this.targetNodeId = state.targetNode;
    this.buildMaze(state);
  }

  private buildMaze(state: MazeState) {
    const children = [...this.mazeGroup.children];
    for (const child of children) {
      this.mazeGroup.remove(child);
    }
    this.setupCalendarAxes();

    this.nodeMeshes.clear();
    this.connectionLines = [];
    this.pathMeshes = [];

    const { layout, unlockedNodes } = state;

    for (const node of layout.nodes) {
      const isUnlocked = unlockedNodes.includes(node.id) || node.id === this.currentNodeId || node.id === this.targetNodeId;
      const mesh = this.createNodeMesh(node, isUnlocked);
      this.nodeMeshes.set(node.id, mesh);
      this.mazeGroup.add(mesh);

      if (node.id === this.currentNodeId) {
        this.highlightCurrentNode(mesh);
      }

      if (node.id === this.targetNodeId) {
        this.highlightTargetNode(mesh);
      }
    }

    for (const conn of layout.connections) {
      const fromMesh = this.nodeMeshes.get(conn.from);
      const toMesh = this.nodeMeshes.get(conn.to);

      if (fromMesh && toMesh) {
        const line = this.createConnectionLine(
          fromMesh.position,
          toMesh.position,
          conn.calendar as CalendarType
        );
        this.connectionLines.push(line);
        this.mazeGroup.add(line);
      }
    }

    this.createTrail();
  }

  private createNodeMesh(node: TimeNode, isUnlocked: boolean): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    let color: number;

    switch (node.type) {
      case 'target':
        geometry = new THREE.OctahedronGeometry(0.8, 0);
        color = 0xffd700;
        break;
      case 'trap':
        geometry = new THREE.TetrahedronGeometry(0.6, 0);
        color = 0xff4757;
        break;
      case 'deadend':
        geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        color = 0x606080;
        break;
      case 'junction':
        geometry = new THREE.IcosahedronGeometry(0.7, 0);
        color = 0x9b59b6;
        break;
      default:
        geometry = new THREE.SphereGeometry(0.5, 16, 16);
        color = isUnlocked ? 0x4a9eff : 0x404060;
        break;
    }

    const material = new THREE.MeshPhongMaterial({
      color,
      transparent: !isUnlocked,
      opacity: isUnlocked ? 1 : 0.3,
      shininess: 100,
      emissive: color,
      emissiveIntensity: node.type === 'target' ? 0.5 : 0.2
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      node.position.x * 2,
      node.position.y * 2,
      node.position.z * 2
    );

    mesh.userData = { node, isUnlocked };
    return mesh;
  }

  private createConnectionLine(from: THREE.Vector3, to: THREE.Vector3, calendar: CalendarType): THREE.Line {
    const points = [from.clone(), to.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color: CALENDAR_COLORS[calendar],
      transparent: true,
      opacity: 0.6
    });

    const line = new THREE.Line(geometry, material);
    line.userData = { calendar };
    return line;
  }

  private highlightCurrentNode(mesh: THREE.Mesh) {
    const material = mesh.material as THREE.MeshPhongMaterial;
    material.emissiveIntensity = 0.8;

    const ringGeometry = new THREE.RingGeometry(0.8, 1.2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(mesh.position);
    ring.lookAt(this.camera.position);
    this.mazeGroup.add(ring);
  }

  private highlightTargetNode(mesh: THREE.Mesh) {
    const material = mesh.material as THREE.MeshPhongMaterial;
    material.emissiveIntensity = 1;

    const ringGeometry = new THREE.TorusGeometry(1.5, 0.1, 8, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(mesh.position);
    this.mazeGroup.add(ring);
  }

  private createTrail() {
    if (this.trailMesh) {
      this.mazeGroup.remove(this.trailMesh);
    }

    if (this.trailPoints.length < 2) return;

    const geometry = new THREE.BufferGeometry().setFromPoints(this.trailPoints);
    const material = new THREE.LineBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.8
    });

    this.trailMesh = new THREE.Line(geometry, material);
    this.mazeGroup.add(this.trailMesh);
  }

  animatePath(path: string[], onComplete?: () => void) {
    if (path.length < 2) return;

    let currentIndex = 0;

    const animateNext = () => {
      if (currentIndex >= path.length - 1) {
        if (onComplete) onComplete();
        return;
      }

      const fromMesh = this.nodeMeshes.get(path[currentIndex]);
      const toMesh = this.nodeMeshes.get(path[currentIndex + 1]);

      if (!fromMesh || !toMesh) {
        currentIndex++;
        animateNext();
        return;
      }

      const startPos = fromMesh.position.clone();
      const endPos = toMesh.position.clone();

      const pathGeometry = new THREE.BufferGeometry().setFromPoints([startPos, endPos]);
      const pathMaterial = new THREE.LineBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.8
      });
      const pathLine = new THREE.Line(pathGeometry, pathMaterial);
      this.mazeGroup.add(pathLine);
      this.pathMeshes.push(pathLine);

      this.trailPoints.push(startPos.clone());
      if (this.trailPoints.length > 100) {
        this.trailPoints.shift();
      }

      currentIndex++;
      setTimeout(animateNext, 200);
    };

    animateNext();
  }

  highlightDate(conversions: Record<string, any>) {
    this.nodeMeshes.forEach((mesh, id) => {
      const material = mesh.material as THREE.MeshPhongMaterial;
      if (id !== this.currentNodeId && id !== this.targetNodeId) {
        material.emissiveIntensity = 0.2;
      }
    });

    const gregorian = conversions.gregorian;
    if (gregorian && this.mazeState) {
      const targetNode = this.mazeState.layout.nodes.find(node =>
        node.coordinates.gregorian.year === gregorian.year &&
        Math.abs(node.coordinates.gregorian.month - gregorian.month) <= 1 &&
        Math.abs(node.coordinates.gregorian.day - gregorian.day) <= 3
      );

      if (targetNode) {
        const mesh = this.nodeMeshes.get(targetNode.id);
        if (mesh) {
          const material = mesh.material as THREE.MeshPhongMaterial;
          material.emissiveIntensity = 1;
          this.highlightedNode = mesh;
        }
      }
    }
  }

  triggerSweepAnimation() {
    this.sweepPosition = 0;
    this.sweepDirection = 1;
    this.animationCallbacks.set('sweep', () => {
      if (this.sweepLight) {
        this.sweepLight.position.x = this.sweepPosition;
        this.sweepLight.position.z = Math.sin(this.sweepPosition * 0.5) * 10;

        this.sweepPosition += 0.3 * this.sweepDirection;

        if (this.sweepPosition > 20) {
          this.sweepDirection = -1;
        } else if (this.sweepPosition < -20) {
          this.animationCallbacks.delete('sweep');
        }
      }
    });
  }

  triggerHeartbeatAnimation() {
    this.heartbeatActive = true;

    const heartbeat = () => {
      if (!this.heartbeatActive) return;

      const t = this.clock.getElapsedTime();
      const scale = 1 + 0.15 * Math.sin(t * 8) * Math.exp(-Math.sin(t * 8) * 0.1);

      if (this.highlightedNode) {
        this.highlightedNode.scale.setScalar(scale);
      }

      if (t > 5) {
        this.heartbeatActive = false;
        if (this.highlightedNode) {
          this.highlightedNode.scale.setScalar(1);
        }
      }
    };

    this.animationCallbacks.set('heartbeat', heartbeat);
  }

  triggerMosaicAnimation() {
    this.mosaicActive = true;
    this.mosaicParts = [];

    const targetMesh = this.nodeMeshes.get(this.targetNodeId);
    if (!targetMesh) return;

    const originalPos = targetMesh.position.clone();
    const parts = 20;

    for (let i = 0; i < parts; i++) {
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
        transparent: true,
        opacity: 1
      });
      const part = new THREE.Mesh(geometry, material);
      part.position.copy(originalPos);
      part.position.x += (Math.random() - 0.5) * 2;
      part.position.y += (Math.random() - 0.5) * 2;
      part.position.z += (Math.random() - 0.5) * 2;
      part.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      this.mosaicParts.push(part);
      this.mazeGroup.add(part);
    }

    const animateMosaic = () => {
      if (!this.mosaicActive) {
        this.mosaicParts.forEach(part => this.mazeGroup.remove(part));
        this.mosaicParts = [];
        this.animationCallbacks.delete('mosaic');
        return;
      }

      this.mosaicParts.forEach(part => {
        const velocity = part.userData.velocity as THREE.Vector3;
        part.position.add(velocity);
        velocity.multiplyScalar(0.98);
        const material = part.material as THREE.MeshBasicMaterial;
        material.opacity *= 0.95;
      });

      if (this.mosaicParts.length > 0 && (this.mosaicParts[0].material as THREE.MeshBasicMaterial).opacity < 0.1) {
        this.mosaicActive = false;
      }
    };

    this.animationCallbacks.set('mosaic', animateMosaic);
  }

  demonstrateTimezoneOffset() {
    if (!this.mazeState) return;

    const nodes = this.mazeState.layout.nodes;
    const offsetNodes = nodes.filter(n => Math.abs(n.timezone - this.mazeState!.timezone) >= 8);

    offsetNodes.forEach(node => {
      const mesh = this.nodeMeshes.get(node.id);
      if (mesh) {
        const originalPos = mesh.position.clone();
        const offset = (node.timezone - this.mazeState!.timezone) * 0.5;

        mesh.position.x += offset;

        setTimeout(() => {
          mesh.position.copy(originalPos);
        }, 3000);
      }
    });
  }

  demonstrateEndlessLoop() {
    if (!this.mazeState) return;

    const loopNodes = ['node_10', 'node_11', 'node_12', 'node_10'];

    loopNodes.forEach((nodeId, index) => {
      setTimeout(() => {
        const mesh = this.nodeMeshes.get(nodeId);
        if (mesh) {
          const material = mesh.material as THREE.MeshPhongMaterial;
          material.emissiveIntensity = 1;

          setTimeout(() => {
            material.emissiveIntensity = 0.2;
          }, 500);
        }
      }, index * 500);
    });
  }

  demonstratePrecisionLoss() {
    this.nodeMeshes.forEach((mesh) => {
      const originalPos = mesh.position.clone();
      const precisionLoss = (Math.random() - 0.5) * 0.5;

      mesh.position.x += precisionLoss;
      mesh.position.y += precisionLoss;

      setTimeout(() => {
        mesh.position.copy(originalPos);
      }, 2000);
    });
  }

  demonstratePathOverwrite() {
    this.connectionLines.forEach((line, index) => {
      const material = line.material as THREE.LineBasicMaterial;
      const originalColor = material.color.clone();

      setTimeout(() => {
        material.color.setHex(0xff4757);

        setTimeout(() => {
          material.color.copy(originalColor);
        }, 1000);
      }, index * 100);
    });
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    this.animationCallbacks.forEach((callback) => {
      callback();
    });

    this.nodeMeshes.forEach((mesh, id) => {
      if (id !== this.currentNodeId && id !== this.targetNodeId) {
        mesh.rotation.y += delta * 0.5;
      }
    });

    if (this.mosaicParts.length > 0) {
      this.mosaicParts.forEach(part => {
        part.rotation.x += delta * 2;
        part.rotation.y += delta * 3;
      });
    }

    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
