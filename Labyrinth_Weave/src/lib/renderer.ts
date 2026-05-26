import { Node, Edge, GraphData } from './graph';

export interface RippleEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export interface FogParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  targetAlpha: number;
}

export interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

export interface PathEraseEffect {
  path: { x: number; y: number }[];
  progress: number;
  alpha: number;
}

export interface EdgePulseEffect {
  edgeKey: string;
  progress: number;
  direction: 'in' | 'out';
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private animationFrameId: number | null = null;
  
  private ripples: RippleEffect[] = [];
  private fogParticles: FogParticle[] = [];
  private fireworkParticles: FireworkParticle[] = [];
  private pathEraseEffects: PathEraseEffect[] = [];
  private edgePulseEffects: Map<string, EdgePulseEffect> = new Map();
  
  private exploredNodes: Set<number> = new Set();
  private currentPath: number[] = [];
  private visitedNodes: number[] = [];
  private lastVisitedTime: Map<number, number> = new Map();
  
  private colors = {
    background: '#0f172a',
    node: '#334155',
    nodeStart: '#22c55e',
    nodeEnd: '#ef4444',
    nodeVisited: '#3b82f6',
    nodePath: '#f59e0b',
    nodeObstacle: '#dc2626',
    edge: '#475569',
    edgePath: '#f59e0b',
    edgeBlocked: '#7f1d1d',
    edgeNegative: '#a855f7',
    text: '#e2e8f0',
    fog: '#1e293b'
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  private drawEdge(
    from: Node,
    to: Node,
    edge: Edge,
    pulseMultiplier: number = 1
  ): void {
    const ctx = this.ctx;
    
    let color = this.colors.edge;
    let lineWidth = 2 * pulseMultiplier;
    
    if (edge.isBlocked) {
      color = this.colors.edgeBlocked;
      lineWidth = 3;
    } else if (edge.weight < 0) {
      color = this.colors.edgeNegative;
      lineWidth = 3;
    }
    
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    
    if (Math.abs(edge.weight) > 1) {
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      ctx.fillStyle = edge.weight < 0 ? '#c084fc' : this.colors.text;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(edge.weight.toString(), midX, midY - 8);
    }
  }

  private drawNode(node: Node, isVisited: boolean, isInPath: boolean): void {
    const ctx = this.ctx;
    const radius = isInPath ? 18 : (isVisited ? 16 : 14);
    
    let color = this.colors.node;
    if (node.isStart) color = this.colors.nodeStart;
    else if (node.isEnd) color = this.colors.nodeEnd;
    else if (node.isObstacle) color = this.colors.nodeObstacle;
    else if (isInPath) color = this.colors.nodePath;
    else if (isVisited) color = this.colors.nodeVisited;
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    ctx.strokeStyle = isInPath ? '#fbbf24' : (isVisited ? '#60a5fa' : '#64748b');
    ctx.lineWidth = 2;
    ctx.stroke();
    
    if (node.isStart || node.isEnd) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.isStart ? 'S' : 'E', node.x, node.y);
    }
  }

  private drawRipples(): void {
    const ctx = this.ctx;
    this.ripples = this.ripples.filter(ripple => {
      ripple.radius += 3;
      ripple.alpha -= 0.02;
      
      if (ripple.alpha <= 0 || ripple.radius >= ripple.maxRadius) {
        return false;
      }
      
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = ripple.color.replace('1)', `${ripple.alpha})`);
      ctx.lineWidth = 2;
      ctx.stroke();
      
      return true;
    });
  }

  private drawFireworks(): void {
    const ctx = this.ctx;
    this.fireworkParticles = this.fireworkParticles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.alpha -= 0.02;
      p.size *= 0.98;
      
      if (p.alpha <= 0) return false;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace('1)', `${p.alpha})`);
      ctx.fill();
      
      return true;
    });
  }

  private drawFog(): void {
    const ctx = this.ctx;
    this.fogParticles.forEach(fog => {
      fog.alpha += (fog.targetAlpha - fog.alpha) * 0.05;
      
      if (fog.alpha > 0.01) {
        ctx.beginPath();
        ctx.arc(fog.x, fog.y, fog.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(30, 41, 59, ${fog.alpha})`;
        ctx.fill();
      }
    });
  }

  private drawPathErase(): void {
    const ctx = this.ctx;
    this.pathEraseEffects = this.pathEraseEffects.filter(effect => {
      effect.progress += 0.03;
      effect.alpha = 1 - effect.progress;
      
      if (effect.progress >= 1) return false;
      
      const endIndex = Math.floor(effect.path.length * effect.progress);
      
      ctx.beginPath();
      for (let i = endIndex; i < effect.path.length; i++) {
        const point = effect.path[i];
        if (i === endIndex) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      }
      ctx.strokeStyle = `rgba(239, 68, 68, ${effect.alpha})`;
      ctx.lineWidth = 4;
      ctx.stroke();
      
      return true;
    });
  }

  addRipple(x: number, y: number, color: string = 'rgba(59, 130, 246, 1)'): void {
    this.ripples.push({
      x,
      y,
      radius: 5,
      maxRadius: 60,
      alpha: 0.8,
      color
    });
  }

  addFireworks(x: number, y: number): void {
    const colors = [
      'rgba(251, 191, 36, 1)',
      'rgba(239, 68, 68, 1)',
      'rgba(34, 197, 94, 1)',
      'rgba(59, 130, 246, 1)',
      'rgba(168, 85, 247, 1)'
    ];
    
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 5;
      this.fireworkParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 3
      });
    }
  }

  addPathErase(path: { x: number; y: number }[]): void {
    this.pathEraseEffects.push({
      path,
      progress: 0,
      alpha: 1
    });
  }

  addEdgePulse(from: number, to: number): void {
    const key = `${from}-${to}`;
    this.edgePulseEffects.set(key, {
      edgeKey: key,
      progress: 0,
      direction: 'in'
    });
  }

  clearFogAroundNode(node: Node, radius: number = 100): void {
    this.fogParticles.forEach(fog => {
      const dx = fog.x - node.x;
      const dy = fog.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius) {
        fog.targetAlpha = Math.max(0, fog.targetAlpha - (1 - dist / radius) * 0.5);
      }
    });
  }

  initFog(): void {
    this.fogParticles = [];
    for (let i = 0; i < 200; i++) {
      this.fogParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 20 + Math.random() * 40,
        alpha: 0.7,
        targetAlpha: 0.7
      });
    }
  }

  setVisitedNodes(nodes: number[]): void {
    this.visitedNodes = nodes;
    nodes.forEach(id => this.exploredNodes.add(id));
  }

  setCurrentPath(path: number[]): void {
    this.currentPath = path;
  }

  render(graph: GraphData): void {
    const ctx = this.ctx;
    
    ctx.fillStyle = this.colors.background;
    ctx.fillRect(0, 0, this.width, this.height);
    
    this.drawFog();
    
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
    
    const drawnEdges = new Set<string>();
    for (const edge of graph.edges) {
      const edgeKey = `${Math.min(edge.from, edge.to)}-${Math.max(edge.from, edge.to)}`;
      if (drawnEdges.has(edgeKey)) continue;
      drawnEdges.add(edgeKey);
      
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) continue;
      
      let pulseMultiplier = 1;
      const pulse = this.edgePulseEffects.get(`${edge.from}-${edge.to}`) || 
                    this.edgePulseEffects.get(`${edge.to}-${edge.from}`);
      if (pulse) {
        pulse.progress += pulse.direction === 'in' ? 0.1 : -0.1;
        if (pulse.progress >= 1) {
          pulse.direction = 'out';
        } else if (pulse.progress <= 0) {
          this.edgePulseEffects.delete(pulse.edgeKey);
          pulse.progress = 0;
        }
        pulseMultiplier = 1 + pulse.progress * 1.5;
      }
      
      this.drawEdge(from, to, edge, pulseMultiplier);
    }
    
    this.drawRipples();
    this.drawPathErase();
    
    for (const node of graph.nodes) {
      const isVisited = this.visitedNodes.includes(node.id);
      const isInPath = this.currentPath.includes(node.id);
      this.drawNode(node, isVisited, isInPath);
    }
    
    if (this.currentPath.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < this.currentPath.length; i++) {
        const node = nodeMap.get(this.currentPath[i]);
        if (!node) continue;
        if (i === 0) ctx.moveTo(node.x, node.y);
        else ctx.lineTo(node.x, node.y);
      }
      ctx.strokeStyle = this.colors.nodePath;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    
    this.drawFireworks();
  }

  startAnimationLoop(graph: GraphData): void {
    const animate = () => {
      this.render(graph);
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  clearEffects(): void {
    this.ripples = [];
    this.fireworkParticles = [];
    this.pathEraseEffects = [];
    this.edgePulseEffects.clear();
    this.exploredNodes.clear();
    this.visitedNodes = [];
    this.currentPath = [];
  }
}
