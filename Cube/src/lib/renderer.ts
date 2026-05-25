import * as THREE from "three";
import {
  CubeState,
  Move,
  Face,
  FACES,
  FACE_COLORS,
  createSolvedState,
  applyMove,
} from "./cube";

export interface CubeRendererConfig {
  container: HTMLElement;
  onStateChange?: (state: CubeState) => void;
  onMoveComplete?: (move: Move) => void;
}

const CUBE_SIZE = 1;
const CUBE_GAP = 0.05;

interface CubeletMesh {
  mesh: THREE.Group;
  position: [number, number, number];
  stickers: Record<Face, THREE.Mesh>;
  type: "corner" | "edge" | "center";
  index: number;
}

const CORNER_POSITIONS: [number, number, number][] = [
  [1, 1, 1],
  [-1, 1, 1],
  [-1, 1, -1],
  [1, 1, -1],
  [1, -1, 1],
  [-1, -1, 1],
  [-1, -1, -1],
  [1, -1, -1],
];

const EDGE_POSITIONS: [number, number, number][] = [
  [1, 1, 0],
  [0, 1, 1],
  [-1, 1, 0],
  [0, 1, -1],
  [1, -1, 0],
  [0, -1, 1],
  [-1, -1, 0],
  [0, -1, -1],
  [1, 0, 1],
  [-1, 0, 1],
  [-1, 0, -1],
  [1, 0, -1],
];

const CENTER_POSITIONS: [number, number, number][] = [
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
  [-1, 0, 0],
  [1, 0, 0],
];

const CORNER_COLORS: Face[][] = [
  ["U", "R", "F"],
  ["U", "F", "L"],
  ["U", "L", "B"],
  ["U", "B", "R"],
  ["D", "F", "R"],
  ["D", "L", "F"],
  ["D", "B", "L"],
  ["D", "R", "B"],
];

const EDGE_COLORS: Face[][] = [
  ["U", "R"],
  ["U", "F"],
  ["U", "L"],
  ["U", "B"],
  ["D", "R"],
  ["D", "F"],
  ["D", "L"],
  ["D", "B"],
  ["F", "R"],
  ["F", "L"],
  ["B", "L"],
  ["B", "R"],
];

const CORNER_ORIENT_MAP: number[][] = [
  [0, 1, 2],
  [2, 0, 1],
  [1, 2, 0],
];

export class CubeRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cubeGroup: THREE.Group;
  private cubelets: CubeletMesh[] = [];
  private state: CubeState;
  private isAnimating = false;
  private animationQueue: { move: Move; onComplete: () => void }[] = [];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedFace: string | null = null;
  private hoveredFace: string | null = null;
  private onStateChange?: (state: CubeState) => void;
  private onMoveComplete?: (move: Move) => void;
  private inertiaVelocity = 0;
  private targetRotation = 0;
  private currentRotation = 0;
  private particles: THREE.Points[] = [];
  private guideLines: THREE.Line[] = [];
  private binaryStreams: THREE.Mesh[] = [];
  private nodeConnections: THREE.Line[] = [];
  private contextLost = false;

  constructor(config: CubeRendererConfig) {
    this.container = config.container;
    this.onStateChange = config.onStateChange;
    this.onMoveComplete = config.onMoveComplete;
    this.state = createSolvedState();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    this.camera = new THREE.PerspectiveCamera(
      45,
      config.container.clientWidth / config.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(config.container.clientWidth, config.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    config.container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    this.cubeGroup = new THREE.Group();
    this.scene.add(this.cubeGroup);

    this.createCubelets();
    this.setupEventListeners();
    this.setupContextListeners();
    this.animate();
  }

  private getPositionIndex(position: [number, number, number]): {
    type: "corner" | "edge" | "center";
    index: number;
  } | null {
    for (let i = 0; i < CORNER_POSITIONS.length; i++) {
      if (
        CORNER_POSITIONS[i][0] === position[0] &&
        CORNER_POSITIONS[i][1] === position[1] &&
        CORNER_POSITIONS[i][2] === position[2]
      ) {
        return { type: "corner", index: i };
      }
    }
    for (let i = 0; i < EDGE_POSITIONS.length; i++) {
      if (
        EDGE_POSITIONS[i][0] === position[0] &&
        EDGE_POSITIONS[i][1] === position[1] &&
        EDGE_POSITIONS[i][2] === position[2]
      ) {
        return { type: "edge", index: i };
      }
    }
    for (let i = 0; i < CENTER_POSITIONS.length; i++) {
      if (
        CENTER_POSITIONS[i][0] === position[0] &&
        CENTER_POSITIONS[i][1] === position[1] &&
        CENTER_POSITIONS[i][2] === position[2]
      ) {
        return { type: "center", index: i };
      }
    }
    return null;
  }

  private getFacesForPosition(position: [number, number, number]): Face[] {
    const faces: Face[] = [];
    if (position[0] === 1) faces.push("R");
    if (position[0] === -1) faces.push("L");
    if (position[1] === 1) faces.push("U");
    if (position[1] === -1) faces.push("D");
    if (position[2] === 1) faces.push("F");
    if (position[2] === -1) faces.push("B");
    return faces;
  }

  private getStickerColorForPosition(
    position: [number, number, number],
    face: Face,
    state: CubeState
  ): string {
    const posInfo = this.getPositionIndex(position);
    if (!posInfo) return FACE_COLORS[face];

    if (posInfo.type === "center") {
      return FACE_COLORS[face];
    }

    if (posInfo.type === "corner") {
      const blockId = state.cornerPermutation[posInfo.index];
      const orientation = state.cornerOrientation[posInfo.index];
      const colors = CORNER_COLORS[blockId];

      const positionFaces = this.getFacesForPosition(position);
      const faceIndex = positionFaces.indexOf(face);
      if (faceIndex === -1) return FACE_COLORS[face];

      const colorIndex = CORNER_ORIENT_MAP[orientation][faceIndex];
      return FACE_COLORS[colors[colorIndex]];
    }

    if (posInfo.type === "edge") {
      const blockId = state.edgePermutation[posInfo.index];
      const orientation = state.edgeOrientation[posInfo.index];
      const colors = EDGE_COLORS[blockId];

      const positionFaces = this.getFacesForPosition(position);
      const faceIndex = positionFaces.indexOf(face);
      if (faceIndex === -1) return FACE_COLORS[face];

      const colorIndex = orientation === 0 ? faceIndex : 1 - faceIndex;
      return FACE_COLORS[colors[colorIndex]];
    }

    return FACE_COLORS[face];
  }

  public updateStickersFromState(state: CubeState): void {
    for (const cubelet of this.cubelets) {
      const positionFaces = this.getFacesForPosition(cubelet.position);
      for (const face of positionFaces) {
        if (cubelet.stickers[face]) {
          const color = this.getStickerColorForPosition(
            cubelet.position,
            face,
            state
          );
          const material = cubelet.stickers[face].material as THREE.MeshPhongMaterial;
          material.color.set(color);
          material.needsUpdate = true;
        }
      }
    }
  }

  private createCubelets(): void {
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;

          const cubeletGroup = new THREE.Group();
          cubeletGroup.position.set(
            x * (CUBE_SIZE + CUBE_GAP),
            y * (CUBE_SIZE + CUBE_GAP),
            z * (CUBE_SIZE + CUBE_GAP)
          );

          const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
          const material = new THREE.MeshPhongMaterial({
            color: 0x111111,
            shininess: 30,
          });
          const cube = new THREE.Mesh(geometry, material);
          cube.castShadow = true;
          cubeletGroup.add(cube);

          const stickers: Record<Face, THREE.Mesh> = {} as Record<Face, THREE.Mesh>;

          if (x === 1) stickers.R = this.createSticker("R", [0.51, 0, 0], [0, Math.PI / 2, 0]);
          if (x === -1) stickers.L = this.createSticker("L", [-0.51, 0, 0], [0, -Math.PI / 2, 0]);
          if (y === 1) stickers.U = this.createSticker("U", [0, 0.51, 0], [-Math.PI / 2, 0, 0]);
          if (y === -1) stickers.D = this.createSticker("D", [0, -0.51, 0], [Math.PI / 2, 0, 0]);
          if (z === 1) stickers.F = this.createSticker("F", [0, 0, 0.51], [0, 0, 0]);
          if (z === -1) stickers.B = this.createSticker("B", [0, 0, -0.51], [0, Math.PI, 0]);

          for (const face of Object.keys(stickers) as Face[]) {
            cubeletGroup.add(stickers[face]);
          }

          const posInfo = this.getPositionIndex([x, y, z]);
          this.cubeGroup.add(cubeletGroup);
          this.cubelets.push({
            mesh: cubeletGroup,
            position: [x, y, z],
            stickers,
            type: posInfo?.type || "center",
            index: posInfo?.index || 0,
          });
        }
      }
    }
  }

  private createSticker(
    face: Face,
    position: [number, number, number],
    rotation: [number, number, number]
  ): THREE.Mesh {
    const size = CUBE_SIZE * 0.8;
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshPhongMaterial({
      color: FACE_COLORS[face],
      shininess: 100,
      side: THREE.DoubleSide,
    });
    const sticker = new THREE.Mesh(geometry, material);
    sticker.position.set(position[0], position[1], position[2]);
    sticker.rotation.set(rotation[0], rotation[1], rotation[2]);
    sticker.castShadow = true;
    sticker.receiveShadow = true;
    sticker.userData.face = face;
    return sticker;
  }

  private setupEventListeners(): void {
    const dom = this.renderer.domElement;

    dom.addEventListener("mousemove", (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(
        this.cubeGroup.children,
        true
      );

      if (intersects.length > 0) {
        const obj = intersects[0].object as THREE.Mesh;
        this.hoveredFace = obj.userData.face || null;
      } else {
        this.hoveredFace = null;
      }

      if (this.hoveredFace) {
        dom.style.cursor = "pointer";
      } else {
        dom.style.cursor = "default";
      }
    });

    dom.addEventListener("click", (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(
        this.cubeGroup.children,
        true
      );

      if (intersects.length > 0) {
        const obj = intersects[0].object as THREE.Mesh;
        const face = obj.userData.face;
        if (face) {
          this.selectedFace = face;
        }
      }
    });

    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };

    dom.addEventListener("mousedown", (e) => {
      if (e.button === 2) {
        isDragging = true;
        previousMouse = { x: e.clientX, y: e.clientY };
      }
    });

    dom.addEventListener("mousemove", (e) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMouse.x;
        const deltaY = e.clientY - previousMouse.y;
        this.cubeGroup.rotation.y += deltaX * 0.01;
        this.cubeGroup.rotation.x += deltaY * 0.01;
        previousMouse = { x: e.clientX, y: e.clientY };
      }
    });

    dom.addEventListener("mouseup", () => {
      isDragging = false;
    });

    dom.addEventListener("contextmenu", (e) => e.preventDefault());

    window.addEventListener("resize", () => this.handleResize());
  }

  private setupContextListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.contextLost = true;
      console.log("WebGL context lost");
    });

    canvas.addEventListener("webglcontextrestored", () => {
      console.log("WebGL context restored");
      this.contextLost = false;
      this.recreateScene();
    });
  }

  private recreateScene(): void {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    this.cubelets = [];
    this.particles = [];
    this.guideLines = [];
    this.binaryStreams = [];
    this.nodeConnections = [];

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    this.cubeGroup = new THREE.Group();
    this.scene.add(this.cubeGroup);

    this.createCubelets();
    this.updateStickersFromState(this.state);
  }

  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    if (this.contextLost) return;

    if (this.inertiaVelocity !== 0) {
      this.currentRotation += this.inertiaVelocity;
      this.inertiaVelocity *= 0.95;
      if (Math.abs(this.inertiaVelocity) < 0.001) {
        this.inertiaVelocity = 0;
      }
    }

    if (Math.abs(this.currentRotation - this.targetRotation) > 0.001) {
      const diff = this.targetRotation - this.currentRotation;
      this.currentRotation += diff * 0.15;
    }

    this.updateParticles();
    this.updateGuideLines();
    this.updateBinaryStreams();
    this.updateNodeConnections();

    this.renderer.render(this.scene, this.camera);
  }

  public performMove(move: Move, onComplete?: () => void): void {
    if (this.isAnimating) {
      this.animationQueue.push({ move, onComplete: onComplete || (() => {}) });
      return;
    }

    this.isAnimating = true;
    const baseFace = move[0];
    const direction = move[1] === "'" ? -1 : move[1] === "2" ? 2 : 1;

    const axis =
      baseFace === "U" || baseFace === "D"
        ? new THREE.Vector3(0, 1, 0)
        : baseFace === "F" || baseFace === "B"
        ? new THREE.Vector3(0, 0, 1)
        : new THREE.Vector3(1, 0, 0);

    const angle = (Math.PI / 2) * direction;
    const duration = 200;
    const startTime = Date.now();

    const startRotation = new THREE.Quaternion();
    const targetRotation = new THREE.Quaternion().setFromAxisAngle(
      axis,
      angle
    );

    const layer = baseFace === "U" ? 1 : baseFace === "D" ? -1 :
      baseFace === "F" ? 1 : baseFace === "B" ? -1 :
      baseFace === "R" ? 1 : baseFace === "L" ? -1 : 0;

    const toRotate = this.cubelets.filter((c) => {
      if (baseFace === "U" || baseFace === "D") return c.position[1] === layer;
      if (baseFace === "F" || baseFace === "B") return c.position[2] === layer;
      return c.position[0] === layer;
    });

    const animateRotation = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentQuat = new THREE.Quaternion().slerpQuaternions(
        startRotation,
        targetRotation,
        eased
      );

      for (const cubelet of toRotate) {
        cubelet.mesh.setRotationFromQuaternion(currentQuat);
      }

      if (progress < 1) {
        requestAnimationFrame(animateRotation);
      } else {
        this.state = applyMove(this.state, move);
        this.isAnimating = false;

        for (const cubelet of this.cubelets) {
          cubelet.mesh.rotation.set(0, 0, 0);
        }

        this.updateStickersFromState(this.state);

        this.inertiaVelocity = (Math.PI / 2) * direction * 0.1;
        this.targetRotation = this.currentRotation;

        if (this.onStateChange) {
          this.onStateChange(this.state);
        }
        if (this.onMoveComplete) {
          this.onMoveComplete(move);
        }
        if (onComplete) {
          onComplete();
        }

        if (this.animationQueue.length > 0) {
          const next = this.animationQueue.shift()!;
          this.performMove(next.move, next.onComplete);
        }
      }
    };

    animateRotation();
  }

  public performMoves(moves: Move[], delay: number = 250): Promise<void> {
    return new Promise((resolve) => {
      let index = 0;
      const doNext = () => {
        if (index < moves.length) {
          this.performMove(moves[index], () => {
            index++;
            setTimeout(doNext, delay);
          });
        } else {
          resolve();
        }
      };
      doNext();
    });
  }

  public getState(): CubeState {
    return { ...this.state };
  }

  public setState(state: CubeState): void {
    this.state = state;
    this.updateStickersFromState(state);
  }

  public showParticles(position: [number, number, number], color: number): void {
    if (this.contextLost) return;

    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const c = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position[0];
      positions[i * 3 + 1] = position[1];
      positions[i * 3 + 2] = position[2];

      velocities[i * 3] = (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 1] = Math.random() * 0.3;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 1,
    });

    const points = new THREE.Points(geometry, material);
    (points as any).velocities = velocities;
    (points as any).life = 1;
    this.particles.push(points);
    this.scene.add(points);
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const points = this.particles[i];
      const positions = points.geometry.attributes.position as THREE.BufferAttribute;
      const velocities = (points as any).velocities as Float32Array;
      const material = points.material as THREE.PointsMaterial;

      for (let j = 0; j < positions.count; j++) {
        positions.array[j * 3] += velocities[j * 3];
        positions.array[j * 3 + 1] += velocities[j * 3 + 1];
        positions.array[j * 3 + 2] += velocities[j * 3 + 2];
        velocities[j * 3 + 1] -= 0.001;
      }
      positions.needsUpdate = true;

      (points as any).life -= 0.02;
      material.opacity = (points as any).life;

      if ((points as any).life <= 0) {
        this.scene.remove(points);
        this.particles.splice(i, 1);
      }
    }
  }

  public showGuideLine(from: [number, number, number], to: [number, number, number]): void {
    if (this.contextLost) return;

    const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: 0x00ff88,
      dashSize: 0.2,
      gapSize: 0.1,
      transparent: true,
      opacity: 0.8,
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    (line as any).life = 1;
    this.guideLines.push(line);
    this.scene.add(line);
  }

  private updateGuideLines(): void {
    for (let i = this.guideLines.length - 1; i >= 0; i--) {
      const line = this.guideLines[i];
      const material = line.material as THREE.LineDashedMaterial;
      (line as any).life -= 0.01;
      material.opacity = (line as any).life;

      if ((line as any).life <= 0) {
        this.scene.remove(line);
        this.guideLines.splice(i, 1);
      }
    }
  }

  public showBinaryStream(data: string, startPos: [number, number, number]): void {
    if (this.contextLost) return;

    const group = new THREE.Group();
    for (let i = 0; i < Math.min(data.length, 50); i++) {
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshBasicMaterial({
        color: data[i] === "1" ? 0x00ffff : 0xff00ff,
        transparent: true,
        opacity: 0.8,
      });
      const bit = new THREE.Mesh(geometry, material);
      bit.position.set(
        startPos[0] + (i % 10) * 0.15,
        startPos[1] - Math.floor(i / 10) * 0.15,
        startPos[2]
      );
      (bit as any).velocity = new THREE.Vector3(0, 0, 0.05);
      (bit as any).delay = i * 0.05;
      group.add(bit);
    }
    (group as any).life = 1;
    this.binaryStreams.push(group);
    this.scene.add(group);
  }

  private updateBinaryStreams(): void {
    for (let i = this.binaryStreams.length - 1; i >= 0; i--) {
      const group = this.binaryStreams[i];
      group.children.forEach((child) => {
        const velocity = (child as any).velocity as THREE.Vector3;
        const delay = (child as any).delay as number;
        if (delay > 0) {
          (child as any).delay = delay - 0.05;
        } else {
          child.position.add(velocity);
        }
      });
      (group as any).life -= 0.005;

      if ((group as any).life <= 0) {
        this.scene.remove(group);
        this.binaryStreams.splice(i, 1);
      }
    }
  }

  public showNodeConnections(nodes: [number, number, number][], color: number): void {
    if (this.contextLost) return;

    for (let i = 0; i < nodes.length - 1; i++) {
      const points = [
        new THREE.Vector3(...nodes[i]),
        new THREE.Vector3(...nodes[i + 1]),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
      });
      const line = new THREE.Line(geometry, material);
      (line as any).life = 1;
      this.nodeConnections.push(line);
      this.scene.add(line);
    }
  }

  private updateNodeConnections(): void {
    for (let i = this.nodeConnections.length - 1; i >= 0; i--) {
      const line = this.nodeConnections[i];
      const material = line.material as THREE.LineBasicMaterial;
      (line as any).life -= 0.005;
      material.opacity = (line as any).life;

      if ((line as any).life <= 0) {
        this.scene.remove(line);
        this.nodeConnections.splice(i, 1);
      }
    }
  }

  public clearAllEffects(): void {
    this.particles.forEach((p) => this.scene.remove(p));
    this.particles = [];
    this.guideLines.forEach((l) => this.scene.remove(l));
    this.guideLines = [];
    this.binaryStreams.forEach((b) => this.scene.remove(b));
    this.binaryStreams = [];
    this.nodeConnections.forEach((n) => this.scene.remove(n));
    this.nodeConnections = [];
  }

  public dispose(): void {
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
