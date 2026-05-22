export type LABColor = {
  l: number;
  a: number;
  b: number;
};

export type OperationResult = {
  result: LABColor;
  overflow: boolean;
  floatError: number;
  executionTime: number;
};

export type DistanceResult = {
  distance: number;
  originalDistance: number;
  distortion: number;
  isInGamut: boolean;
};

export type GroupAxiomCheck = {
  closure: { passed: boolean; violations: string[] };
  associativity: { passed: boolean; counterExamples: { left: LABColor; right: LABColor }[] };
  identity: { passed: boolean; identity: LABColor | null };
  inverse: { passed: boolean; missingInverses: LABColor[] };
  allPassed: boolean;
};

const GAMUT_BOUNDS = {
  l: { min: 0, max: 100 },
  a: { min: -128, max: 127 },
  b: { min: -128, max: 127 }
};

export function clampToGamut(color: LABColor): LABColor {
  return {
    l: Math.max(GAMUT_BOUNDS.l.min, Math.min(GAMUT_BOUNDS.l.max, color.l)),
    a: Math.max(GAMUT_BOUNDS.a.min, Math.min(GAMUT_BOUNDS.a.max, color.a)),
    b: Math.max(GAMUT_BOUNDS.b.min, Math.min(GAMUT_BOUNDS.b.max, color.b))
  };
}

export function isInGamut(color: LABColor, epsilon: number = 0.001): boolean {
  return (
    color.l >= GAMUT_BOUNDS.l.min - epsilon &&
    color.l <= GAMUT_BOUNDS.l.max + epsilon &&
    color.a >= GAMUT_BOUNDS.a.min - epsilon &&
    color.a <= GAMUT_BOUNDS.a.max + epsilon &&
    color.b >= GAMUT_BOUNDS.b.min - epsilon &&
    color.b <= GAMUT_BOUNDS.b.max + epsilon
  );
}

export function addColors(c1: LABColor, c2: LABColor): OperationResult {
  const startTime = performance.now();

  const raw = {
    l: c1.l + c2.l,
    a: c1.a + c2.a,
    b: c1.b + c2.b
  };

  const clamped = clampToGamut(raw);

  const floatError =
    Math.abs(raw.l - clamped.l) +
    Math.abs(raw.a - clamped.a) +
    Math.abs(raw.b - clamped.b);

  const executionTime = performance.now() - startTime;

  return {
    result: clamped,
    overflow: raw.l !== clamped.l || raw.a !== clamped.a || raw.b !== clamped.b,
    floatError,
    executionTime
  };
}

export function multiplyColors(c1: LABColor, c2: LABColor): OperationResult {
  const startTime = performance.now();

  const normalized1 = {
    l: c1.l / 100,
    a: c1.a / 128,
    b: c1.b / 128
  };
  const normalized2 = {
    l: c2.l / 100,
    a: c2.a / 128,
    b: c2.b / 128
  };

  const raw = {
    l: normalized1.l * normalized2.l * 100,
    a: normalized1.a * normalized2.a * 128,
    b: normalized1.b * normalized2.b * 128
  };

  const clamped = clampToGamut(raw);

  const floatError =
    Math.abs(raw.l - clamped.l) +
    Math.abs(raw.a - clamped.a) +
    Math.abs(raw.b - clamped.b);

  const executionTime = performance.now() - startTime;

  return {
    result: clamped,
    overflow: raw.l !== clamped.l || raw.a !== clamped.a || raw.b !== clamped.b,
    floatError,
    executionTime
  };
}

export function scaleColor(c: LABColor, scalar: number): OperationResult {
  const startTime = performance.now();

  const raw = {
    l: c.l * scalar,
    a: c.a * scalar,
    b: c.b * scalar
  };

  const clamped = clampToGamut(raw);

  const floatError =
    Math.abs(raw.l - clamped.l) +
    Math.abs(raw.a - clamped.a) +
    Math.abs(raw.b - clamped.b);

  const executionTime = performance.now() - startTime;

  return {
    result: clamped,
    overflow: raw.l !== clamped.l || raw.a !== clamped.a || raw.b !== clamped.b,
    floatError,
    executionTime
  };
}

export function deltaE(c1: LABColor, c2: LABColor): number {
  const dL = c1.l - c2.l;
  const da = c1.a - c2.a;
  const db = c1.b - c2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function computeDistanceMatrix(
  colors: LABColor[]
): { matrix: number[][]; distances: { pair: [number, number]; distance: number }[] } {
  const n = colors.length;
  const matrix: number[][] = [];
  const distances: { pair: [number, number]; distance: number }[] = [];

  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      const d = deltaE(colors[i], colors[j]);
      matrix[i][j] = d;
      if (i < j) {
        distances.push({ pair: [i, j], distance: d });
      }
    }
  }

  return { matrix, distances };
}

export function computeNonlinearDistance(c1: LABColor, c2: LABColor, gamma: number = 2.2): DistanceResult {
  const originalDistance = deltaE(c1, c2);

  const warpedC1 = {
    l: Math.pow(c1.l / 100, gamma) * 100,
    a: Math.pow(Math.abs(c1.a) / 128, gamma) * 128 * Math.sign(c1.a),
    b: Math.pow(Math.abs(c1.b) / 128, gamma) * 128 * Math.sign(c1.b)
  };
  const warpedC2 = {
    l: Math.pow(c2.l / 100, gamma) * 100,
    a: Math.pow(Math.abs(c2.a) / 128, gamma) * 128 * Math.sign(c2.a),
    b: Math.pow(Math.abs(c2.b) / 128, gamma) * 128 * Math.sign(c2.b)
  };

  const warpedDistance = deltaE(warpedC1, warpedC2);

  const distortion =
    originalDistance === 0 ? 0 : Math.abs(warpedDistance - originalDistance) / originalDistance;

  return {
    distance: warpedDistance,
    originalDistance,
    distortion,
    isInGamut: isInGamut(warpedC1) && isInGamut(warpedC2)
  };
}

export function checkClosure(colors: LABColor[], operation: "add" | "multiply"): {
  closed: boolean;
  violations: { color1: LABColor; color2: LABColor; result: LABColor }[];
} {
  const violations: { color1: LABColor; color2: LABColor; result: LABColor }[] = [];

  for (const c1 of colors) {
    for (const c2 of colors) {
      const result = operation === "add" ? addColors(c1, c2).result : multiplyColors(c1, c2).result;
      if (!colors.some((c) => Math.abs(c.l - result.l) < 0.001 && Math.abs(c.a - result.a) < 0.001 && Math.abs(c.b - result.b) < 0.001)) {
        if (!isInGamut(result)) {
          violations.push({ color1: c1, color2: c2, result });
        }
      }
    }
  }

  return { closed: violations.length === 0, violations };
}

export function checkAssociativity(
  colors: LABColor[],
  operation: "add" | "multiply",
  epsilon: number = 0.001
): { passed: boolean; counterExamples: { left: LABColor; right: LABColor; difference: number }[] } {
  const counterExamples: { left: LABColor; right: LABColor; difference: number }[] = [];

  for (const a of colors) {
    for (const b of colors) {
      for (const c of colors) {
        const op = operation === "add" ? addColors : multiplyColors;

        const ab = op(a, b).result;
        const left = op(ab, c).result;

        const bc = op(b, c).result;
        const right = op(a, bc).result;

        const diff = deltaE(left, right);
        if (diff > epsilon) {
          counterExamples.push({ left, right, difference: diff });
        }
      }
    }
  }

  return { passed: counterExamples.length === 0, counterExamples };
}

export function checkIdentity(
  colors: LABColor[],
  operation: "add" | "multiply",
  epsilon: number = 0.001
): { passed: boolean; identity: LABColor | null } {
  const identity = operation === "add" ? { l: 0, a: 0, b: 0 } : { l: 100, a: 0, b: 0 };

  if (!colors.some((c) => Math.abs(c.l - identity.l) < epsilon && Math.abs(c.a - identity.a) < epsilon && Math.abs(c.b - identity.b) < epsilon)) {
    return { passed: false, identity: null };
  }

  const op = operation === "add" ? addColors : multiplyColors;
  for (const c of colors) {
    const result = op(c, identity).result;
    if (deltaE(result, c) > epsilon) {
      return { passed: false, identity: null };
    }
  }

  return { passed: true, identity };
}

export function checkInverse(
  colors: LABColor[],
  operation: "add" | "multiply",
  epsilon: number = 0.001
): { passed: boolean; missingInverses: LABColor[] } {
  const identity = operation === "add" ? { l: 0, a: 0, b: 0 } : { l: 100, a: 0, b: 0 };
  const op = operation === "add" ? addColors : multiplyColors;
  const missingInverses: LABColor[] = [];

  for (const c of colors) {
    let found = false;
    for (const d of colors) {
      const result = op(c, d).result;
      if (deltaE(result, identity) < epsilon) {
        found = true;
        break;
      }
    }
    if (!found) {
      missingInverses.push(c);
    }
  }

  return { passed: missingInverses.length === 0, missingInverses };
}

export function checkGroupAxioms(colors: LABColor[], operation: "add" | "multiply"): GroupAxiomCheck {
  const closureResult = checkClosure(colors, operation);
  const associativityResult = checkAssociativity(colors, operation);
  const identityResult = checkIdentity(colors, operation);
  const inverseResult = checkInverse(colors, operation);

  return {
    closure: {
      passed: closureResult.closed,
      violations: closureResult.violations.map((v) => `(${v.color1.l},${v.color1.a},${v.color1.b}) ${operation} (${v.color2.l},${v.color2.a},${v.color2.b}) → (${v.result.l},${v.result.a},${v.result.b})`)
    },
    associativity: {
      passed: associativityResult.passed,
      counterExamples: associativityResult.counterExamples
    },
    identity: {
      passed: identityResult.passed,
      identity: identityResult.identity
    },
    inverse: {
      passed: inverseResult.passed,
      missingInverses: inverseResult.missingInverses
    },
    allPassed:
      closureResult.closed &&
      associativityResult.passed &&
      identityResult.passed &&
      inverseResult.passed
  };
}

export function batchOperation(
  colors: LABColor[],
  operation: "add" | "multiply",
  iterations: number = 1000
): {
  results: LABColor[];
  totalTime: number;
  averageTime: number;
  overflowCount: number;
  totalFloatError: number;
} {
  const startTime = performance.now();
  const results: LABColor[] = [];
  let overflowCount = 0;
  let totalFloatError = 0;

  for (let i = 0; i < iterations; i++) {
    const c1 = colors[Math.floor(Math.random() * colors.length)];
    const c2 = colors[Math.floor(Math.random() * colors.length)];
    const result = operation === "add" ? addColors(c1, c2) : multiplyColors(c1, c2);
    results.push(result.result);
    if (result.overflow) overflowCount++;
    totalFloatError += result.floatError;
  }

  const totalTime = performance.now() - startTime;

  return {
    results,
    totalTime,
    averageTime: totalTime / iterations,
    overflowCount,
    totalFloatError
  };
}

export function labToHex(color: LABColor): string {
  const clamped = clampToGamut(color);
  const y = (clamped.l + 16) / 116;
  const x = clamped.a / 500 + y;
  const z = y - clamped.b / 200;

  const xyz = {
    x: 0.95047 * (Math.pow(x, 3) > 0.008856 ? Math.pow(x, 3) : (x - 16 / 116) / 7.787),
    y: 1.0 * (Math.pow(y, 3) > 0.008856 ? Math.pow(y, 3) : (y - 16 / 116) / 7.787),
    z: 1.08883 * (Math.pow(z, 3) > 0.008856 ? Math.pow(z, 3) : (z - 16 / 116) / 7.787)
  };

  const r = xyz.x * 3.2406 + xyz.y * -1.5372 + xyz.z * -0.4986;
  const g = xyz.x * -0.9689 + xyz.y * 1.8758 + xyz.z * 0.0415;
  const b = xyz.x * 0.0557 + xyz.y * -0.204 + xyz.z * 1.057;

  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const toHex = (v: number) => {
    const hex = Math.round(clamp(v) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToLab(hex: string): LABColor {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const srgbToLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375;
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175;
  const z = lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041;

  const refX = 0.95047;
  const refY = 1.0;
  const refZ = 1.08883;

  const f = (t: number) =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

  const fx = f(x / refX);
  const fy = f(y / refY);
  const fz = f(z / refZ);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}
