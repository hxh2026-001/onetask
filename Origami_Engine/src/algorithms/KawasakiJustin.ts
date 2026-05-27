export interface VertexAngle {
  vertexId: number;
  angles: number[];
  isKawasaki: boolean;
  isJustin: boolean;
}

export interface DevelopabilityResult {
  isDevelopable: boolean;
  kawasakiViolations: number[];
  justinViolations: number[];
  message: string;
}

export class KawasakiJustinTheorem {
  static checkKawasakiCondition(angles: number[]): boolean {
    const sum = angles.reduce((acc, angle) => acc + angle, 0);
    const epsilon = 1e-6;
    return Math.abs(sum - Math.PI) < epsilon;
  }

  static checkJustinCondition(angles: number[]): boolean {
    const n = angles.length;
    if (n % 2 !== 0) return false;
    
    let sum1 = 0;
    let sum2 = 0;
    
    for (let i = 0; i < n; i++) {
      if (i % 2 === 0) {
        sum1 += angles[i];
      } else {
        sum2 += angles[i];
      }
    }
    
    const epsilon = 1e-6;
    return Math.abs(sum1 - sum2) < epsilon;
  }

  static analyzeVertex(vertexId: number, angles: number[]): VertexAngle {
    const isKawasaki = this.checkKawasakiCondition(angles);
    const isJustin = this.checkJustinCondition(angles);
    
    return {
      vertexId,
      angles,
      isKawasaki,
      isJustin
    };
  }

  static checkDevelopability(verticesAngles: Map<number, number[]>): DevelopabilityResult {
    const kawasakiViolations: number[] = [];
    const justinViolations: number[] = [];
    
    verticesAngles.forEach((angles, vertexId) => {
      const analysis = this.analyzeVertex(vertexId, angles);
      if (!analysis.isKawasaki) kawasakiViolations.push(vertexId);
      if (!analysis.isJustin) justinViolations.push(vertexId);
    });

    const isDevelopable = kawasakiViolations.length === 0 && justinViolations.length === 0;
    let message = '';
    
    if (isDevelopable) {
      message = '该折纸模型满足 Kawasaki-Justin 定理，具有可展性';
    } else {
      message = '几何约束无法满足：';
      if (kawasakiViolations.length > 0) {
        message += ` Kawasaki 条件在顶点 ${kawasakiViolations.join(', ')} 处被破坏；`;
      }
      if (justinViolations.length > 0) {
        message += ` Justin 条件在顶点 ${justinViolations.join(', ')} 处被破坏；`;
      }
    }

    return {
      isDevelopable,
      kawasakiViolations,
      justinViolations,
      message
    };
  }

  static calculateFoldAngle(currentAngle: number, targetAngle: number, time: number): number {
    const epsilon = 1e-10;
    const diff = targetAngle - currentAngle;
    const folded = currentAngle + diff * (1 - Math.pow(1 - time, 3));
    return Math.abs(folded) < epsilon ? 0 : folded;
  }

  static detectVertexCollision(vertices: { id: number; x: number; y: number; z: number }[]): number[][] {
    const collisions: number[][] = [];
    const threshold = 0.01;
    
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const dx = vertices[i].x - vertices[j].x;
        const dy = vertices[i].y - vertices[j].y;
        const dz = vertices[i].z - vertices[j].z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < threshold) {
          collisions.push([vertices[i].id, vertices[j].id]);
        }
      }
    }
    
    return collisions;
  }

  static detectSelfIntersection(creases: { start: number; end: number; vertices: number[] }[]): boolean {
    for (let i = 0; i < creases.length; i++) {
      for (let j = i + 1; j < creases.length; j++) {
        if (this.segmentsIntersect(creases[i], creases[j])) {
          return true;
        }
      }
    }
    return false;
  }

  private static segmentsIntersect(s1: { start: number; end: number }, s2: { start: number; end: number }): boolean {
    return false;
  }
}