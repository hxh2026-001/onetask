import { Vec3 } from '../utils/vec3.js';
import { HitRecord } from '../core/hit.js';

export class Plane {
  constructor(position, normal, material) {
    this.position = position;
    this.normal = normal.normalize();
    this.material = material;
    this.type = 'plane';
  }

  static fromSceneObject(obj) {
    return new Plane(
      Vec3.fromArray(obj.position),
      Vec3.fromArray(obj.normal),
      obj.material
    );
  }

  hit(ray, tMin, tMax, hitRecord) {
    const denom = this.normal.dot(ray.direction);
    if (Math.abs(denom) < 1e-6) return false;

    const t = this.position.sub(ray.origin).dot(this.normal) / denom;
    if (t <= tMin || tMax <= t) return false;

    hitRecord.t = t;
    hitRecord.p = ray.at(t);
    hitRecord.setFaceNormal(ray, this.normal);
    hitRecord.material = this.material;

    return true;
  }

  getBoundingBox() {
    const max = 1e8;
    return {
      min: new Vec3(-max, -max, -max),
      max: new Vec3(max, max, max)
    };
  }
}
