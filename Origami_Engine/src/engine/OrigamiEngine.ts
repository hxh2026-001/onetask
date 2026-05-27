import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PresetModels, getPresetById, PresetModel } from '../data/PresetModels';
import { KawasakiJustinTheorem, DevelopabilityResult } from '../algorithms/KawasakiJustin';
import { OrigamiDatabase } from '../database/Database';

export class OrigamiEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  private database: OrigamiDatabase;
  
  private currentModel: PresetModel | null = null;
  private mesh: THREE.Mesh | null = null;
  private creaseLines: THREE.Line[] = [];
  private vertexMarkers: THREE.Mesh[] = [];
  private unfoldPathLines: THREE.Line[] = [];
  
  private animationTime = 0;
  private isFolding = false;
  private foldProgress = 0;
  private developabilityResult: DevelopabilityResult | null = null;
  
  private pulsePhase = 0;
  private fanPhase = 0;
  
  constructor() {
    this.container = document.getElementById('app')!;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(5, 5, 5);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    this.database = new OrigamiDatabase();
    
    this.initLights();
    this.createUI();
  }

  private initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(10, 10, 10);
    this.scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-10, -10, -10);
    this.scene.add(directionalLight2);
    
    const pointLight = new THREE.PointLight(0x4fc3f7, 1, 100);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);
  }

  private createUI() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(20, 20, 40, 0.9);
      padding: 20px;
      border-radius: 12px;
      color: white;
      font-family: 'Segoe UI', sans-serif;
      z-index: 100;
      min-width: 280px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
    `;
    
    const title = document.createElement('h2');
    title.textContent = '刚性折纸动力学模拟器';
    title.style.marginBottom = '20px';
    title.style.fontSize = '18px';
    title.style.color = '#4fc3f7';
    panel.appendChild(title);
    
    const presetButtons = PresetModels.map((preset, index) => {
      const button = document.createElement('button');
      button.textContent = `预设${index + 1}：${preset.name}`;
      button.style.cssText = `
        display: block;
        width: 100%;
        padding: 12px 16px;
        margin-bottom: 10px;
        background: linear-gradient(135deg, #1a1a3e, #2d2d5a);
        border: 1px solid #4fc3f7;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s;
        text-align: left;
      `;
      button.addEventListener('mouseover', () => {
        button.style.background = 'linear-gradient(135deg, #2d2d5a, #3d3d7a)';
        button.style.boxShadow = '0 0 15px rgba(79, 195, 247, 0.3)';
      });
      button.addEventListener('mouseout', () => {
        button.style.background = 'linear-gradient(135deg, #1a1a3e, #2d2d5a)';
        button.style.boxShadow = 'none';
      });
      button.addEventListener('click', () => this.loadPreset(preset.id));
      return button;
    });
    
    presetButtons.forEach(btn => panel.appendChild(btn));
    
    const foldButton = document.createElement('button');
    foldButton.textContent = '开始折叠';
    foldButton.style.cssText = `
      display: block;
      width: 100%;
      padding: 12px 16px;
      margin-top: 15px;
      background: linear-gradient(135deg, #4fc3f7, #29b6f6);
      border: none;
      border-radius: 8px;
      color: #0a0a1a;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s;
    `;
    foldButton.addEventListener('mouseover', () => {
      foldButton.style.boxShadow = '0 0 20px rgba(79, 195, 247, 0.5)';
    });
    foldButton.addEventListener('mouseout', () => {
      foldButton.style.boxShadow = 'none';
    });
    foldButton.addEventListener('click', () => this.toggleFolding());
    panel.appendChild(foldButton);
    
    this.infoDiv = document.createElement('div');
    this.infoDiv.style.cssText = `
      margin-top: 15px;
      padding: 12px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.5;
      max-height: 150px;
      overflow-y: auto;
    `;
    panel.appendChild(this.infoDiv);
    
    this.container.appendChild(panel);
  }

  private infoDiv: HTMLDivElement;

  private async loadPreset(presetId: string) {
    await this.database.init();
    
    const preset = getPresetById(presetId);
    if (!preset) return;
    
    this.currentModel = preset;
    
    await this.database.saveModel({
      name: preset.name,
      description: preset.description,
      vertices: JSON.stringify(preset.vertices),
      creases: JSON.stringify(preset.creases),
      angles: JSON.stringify(Array.from(preset.vertexAngles.entries())),
      preset_type: presetId
    });
    
    this.developabilityResult = KawasakiJustinTheorem.checkDevelopability(preset.vertexAngles);
    
    this.infoDiv.innerHTML = `
      <div><strong>模型:</strong> ${preset.name}</div>
      <div><strong>描述:</strong> ${preset.description}</div>
      <div><strong>顶点数:</strong> ${preset.vertices.length}</div>
      <div><strong>折痕数:</strong> ${preset.creases.length}</div>
      <div><strong>可展性:</strong> ${this.developabilityResult.isDevelopable ? '✓ 可展' : '✗ 不可展'}</div>
      <div style="margin-top: 8px; color: ${this.developabilityResult.isDevelopable ? '#66bb6a' : '#ef5350'}">
        ${this.developabilityResult.message}
      </div>
    `;
    
    this.createOrigamiMesh();
  }

  private createOrigamiMesh() {
    this.clearScene();
    
    if (!this.currentModel) return;
    
    const { vertices, creases } = this.currentModel;
    
    const geometry = new THREE.BufferGeometry();
    
    const positions: number[] = [];
    const colors: number[] = [];
    const faces: number[] = [];
    
    vertices.forEach(v => {
      positions.push(v.x, v.y, v.z);
      colors.push(0.8, 0.8, 0.9);
    });
    
    for (let i = 0; i < vertices.length - 1; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const hasCrease = creases.some(c => 
          (c.start === i && c.end === j) || (c.start === j && c.end === i)
        );
        if (hasCrease) {
          faces.push(0, i, j);
        }
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(faces);
    
    const material = new THREE.MeshPhongMaterial({
      color: 0x4fc3f7,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
    
    this.createCreaseLines();
    this.createVertexMarkers();
    this.createUnfoldPath();
  }

  private createCreaseLines() {
    if (!this.currentModel) return;
    
    this.currentModel.creases.forEach((crease, index) => {
      const start = this.currentModel!.vertices[crease.start];
      const end = this.currentModel!.vertices[crease.end];
      
      const points = [
        new THREE.Vector3(start.x, start.y, start.z),
        new THREE.Vector3(end.x, end.y, end.z)
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      const color = crease.type === 'mountain' ? 0xef5350 : 
                    crease.type === 'valley' ? 0x4fc3f7 : 0x9e9e9e;
      
      const material = new THREE.LineBasicMaterial({ 
        color,
        linewidth: 3,
        transparent: true,
        opacity: 0.9
      });
      
      const line = new THREE.Line(geometry, material);
      line.userData = { creaseIndex: index, pulseOffset: index * 0.5 };
      this.creaseLines.push(line);
      this.scene.add(line);
    });
  }

  private createVertexMarkers() {
    if (!this.currentModel) return;
    
    this.currentModel.vertices.forEach((vertex, index) => {
      const geometry = new THREE.SphereGeometry(0.08, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.set(vertex.x, vertex.y, vertex.z);
      marker.userData = { vertexIndex: index, originalPosition: { ...vertex } };
      this.vertexMarkers.push(marker);
      this.scene.add(marker);
    });
  }

  private createUnfoldPath() {
    if (!this.currentModel) return;
    
    const center = new THREE.Vector3(0, 0, 0);
    
    this.currentModel.vertices.forEach((vertex, index) => {
      const points = [
        center.clone(),
        new THREE.Vector3(vertex.x, vertex.y, vertex.z)
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineDashedMaterial({
        color: 0x7c4dff,
        dashSize: 0.1,
        gapSize: 0.1,
        transparent: true,
        opacity: 0.6
      });
      
      const line = new THREE.Line(geometry, material);
      line.computeLineDistances();
      line.userData = { pathIndex: index };
      this.unfoldPathLines.push(line);
      this.scene.add(line);
    });
  }

  private clearScene() {
    this.creaseLines.forEach(line => this.scene.remove(line));
    this.creaseLines = [];
    
    this.vertexMarkers.forEach(marker => this.scene.remove(marker));
    this.vertexMarkers = [];
    
    this.unfoldPathLines.forEach(line => this.scene.remove(line));
    this.unfoldPathLines = [];
    
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
      this.mesh = null;
    }
  }

  private toggleFolding() {
    this.isFolding = !this.isFolding;
  }

  private applyFoldAnimation() {
    if (!this.mesh || !this.currentModel) return;
    
    const time = this.animationTime * 0.5;
    this.foldProgress = this.isFolding ? Math.min(this.foldProgress + 0.01, 1) : Math.max(this.foldProgress - 0.01, 0);
    
    const positions = this.mesh.geometry.attributes.position.array as Float32Array;
    const originalPositions = this.currentModel.vertices;
    
    for (let i = 0; i < originalPositions.length; i++) {
      const vertex = originalPositions[i];
      const foldAngle = this.foldProgress * Math.PI / 2;
      
      const x = vertex.x;
      const y = vertex.y * Math.cos(foldAngle) - vertex.z * Math.sin(foldAngle);
      const z = vertex.y * Math.sin(foldAngle) + vertex.z * Math.cos(foldAngle);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
    
    this.updateVertexMarkers();
    this.updateCreaseLines();
    this.updateUnfoldPath();
  }

  private updateVertexMarkers() {
    this.vertexMarkers.forEach((marker, index) => {
      const original = marker.userData.originalPosition;
      const foldAngle = this.foldProgress * Math.PI / 2;
      
      marker.position.x = original.x;
      marker.position.y = original.y * Math.cos(foldAngle) - original.z * Math.sin(foldAngle);
      marker.position.z = original.y * Math.sin(foldAngle) + original.z * Math.cos(foldAngle);
      
      const scale = 1 + Math.sin(this.fanPhase + index) * 0.3;
      marker.scale.set(scale, scale, scale);
      
      if (!this.developabilityResult?.isDevelopable) {
        const errorIntensity = Math.sin(this.animationTime * 3 + index) * 0.5 + 0.5;
        (marker.material as THREE.MeshBasicMaterial).color.setHex(
          errorIntensity > 0.7 ? 0xef5350 : 0xffeb3b
        );
      }
    });
  }

  private updateCreaseLines() {
    this.pulsePhase += 0.05;
    
    this.creaseLines.forEach((line, index) => {
      const material = line.material as THREE.LineBasicMaterial;
      const offset = line.userData.pulseOffset;
      
      material.opacity = 0.6 + Math.sin(this.pulsePhase + offset) * 0.4;
      
      if (!this.developabilityResult?.isDevelopable && 
          (this.developabilityResult?.kawasakiViolations.includes(index) ||
           this.developabilityResult?.justinViolations.includes(index))) {
        material.color.setHex(0xef5350);
        material.opacity = 0.9;
      }
    });
  }

  private updateUnfoldPath() {
    this.unfoldPathLines.forEach((line, index) => {
      const material = line.material as THREE.LineDashedMaterial;
      material.opacity = 0.3 + Math.sin(this.animationTime * 2 + index) * 0.3;
    });
  }

  private animate() {
    this.animationTime += 0.016;
    this.fanPhase += 0.02;
    
    this.applyFoldAnimation();
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    
    requestAnimationFrame(() => this.animate());
  }

  public init() {
    this.animate();
  }

  public handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}