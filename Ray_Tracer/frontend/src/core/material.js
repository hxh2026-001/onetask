import { Vec3, randomUnitVector, randomInUnitSphere } from '../utils/vec3.js';
import { Ray } from './ray.js';

export class Material {
  static scatter(ray, hitRecord) {
    return { scattered: false, attenuation: new Vec3() };
  }
}

export class Lambertian extends Material {
  constructor(color) {
    super();
    this.albedo = Vec3.fromArray(color);
    this.type = 'lambertian';
  }

  scatter(ray, hitRecord) {
    let scatterDirection = hitRecord.normal.add(randomUnitVector());
    if (scatterDirection.lengthSquared() < 1e-8) {
      scatterDirection = hitRecord.normal;
    }
    const scattered = new Ray(hitRecord.p, scatterDirection);
    const attenuation = this.albedo;
    return { scattered: true, attenuation, scattered };
  }
}

export class Metal extends Material {
  constructor(color, fuzz = 0) {
    super();
    this.albedo = Vec3.fromArray(color);
    this.fuzz = Math.min(fuzz, 1);
    this.type = 'metal';
  }

  scatter(ray, hitRecord) {
    const reflected = ray.direction.normalize().reflect(hitRecord.normal);
    const scattered = new Ray(
      hitRecord.p,
      reflected.add(randomInUnitSphere().mul(this.fuzz))
    );
    const attenuation = this.albedo;
    return {
      scattered: scattered.direction.dot(hitRecord.normal) > 0,
      attenuation,
      scattered
    };
  }
}

export class Dielectric extends Material {
  constructor(color, ior) {
    super();
    this.albedo = Vec3.fromArray(color);
    this.ior = ior;
    this.type = 'glass';
  }

  reflectance(cos, refIdx) {
    let r0 = (1 - refIdx) / (1 + refIdx);
    r0 = r0 * r0;
    return r0 + (1 - r0) * Math.pow(1 - cos, 5);
  }

  scatter(ray, hitRecord) {
    const attenuation = this.albedo;
    const refractionRatio = hitRecord.frontFace ? (1 / this.ior) : this.ior;

    const unitDirection = ray.direction.normalize();
    const cosTheta = Math.min(unitDirection.negate().dot(hitRecord.normal), 1);
    const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);

    const cannotRefract = refractionRatio * sinTheta > 1;
    let direction;

    if (cannotRefract || this.reflectance(cosTheta, refractionRatio) > Math.random()) {
      direction = unitDirection.reflect(hitRecord.normal);
    } else {
      direction = unitDirection.refract(hitRecord.normal, refractionRatio);
    }

    const scattered = new Ray(hitRecord.p, direction);
    return { scattered: true, attenuation, scattered };
  }
}

export function createMaterialFromScene(mat) {
  switch (mat.type) {
    case 'lambertian':
      return new Lambertian(mat.color);
    case 'mirror':
      return new Metal(mat.color, 0);
    case 'metal':
      return new Metal(mat.color, mat.fuzz || 0);
    case 'glass':
      return new Dielectric(mat.color, mat.ior || 1.5);
    default:
      return new Lambertian(mat.color || [0.5, 0.5, 0.5]);
  }
}
