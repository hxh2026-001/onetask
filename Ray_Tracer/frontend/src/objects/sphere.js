import { Vec3 } from '../utils/vec3.js';
import { HitRecord } from '../core/hit.js';

export class Sphere {
  constructor(position, radius, material) {
    this.position = position;
    this.radius = radius;
    this.material = material;
    this.type = 'sphere';
  }

  static fromSceneObject(obj) {
    return new Sphere(
      Vec3.fromArray(obj.position),
      obj.radius,
      obj.material
    );
  }

  hit(ray, tMin, tMax, hitRecord) {
    const oc = ray.origin.sub(this.position);
    const a = ray.direction.lengthSquared();
    const halfB = oc.dot(ray.direction);
    const c = oc.lengthSquared() - this.radius * this.radius;
    const discriminant = halfB * halfB - a * c;

    if (discriminant < 0) return false;

    const sqrtD = Math.sqrt(discriminant);
    let root = (-halfB - sqrtD) / a;
    if (root <= tMin || tMax <= root) {
      root = (-halfB + sqrtD) / a;
      if (root <= tMin || tMax <= root) {
        return false;
      }
    }

    hitRecord.t = root;
    hitRecord.p = ray.at(root);
    const outwardNormal = hitRecord.p.sub(this.position).div(this.radius);
    hitRecord.setFaceNormal(ray, outwardNormal);
    hitRecord.material = this.material;

    return true;
  }

  getBoundingBox() {
    return {
      min: new Vec3(
        this.position.x - this.radius,
        this.position.y - this.radius,
        this.position.z - this.radius
      ),
      max: new Vec3(
        this.position.x + this.radius,
        this.position.y + this.radius,
        this.position.z + this.radius
      )
    };
  }
}
