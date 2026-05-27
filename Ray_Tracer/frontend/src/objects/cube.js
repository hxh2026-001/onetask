import { Vec3 } from '../utils/vec3.js';
import { HitRecord } from '../core/hit.js';

export class Cube {
  constructor(position, size, material) {
    this.position = position;
    this.size = size;
    this.material = material;
    this.type = 'cube';
    this.halfSize = size / 2;
  }

  static fromSceneObject(obj) {
    return new Cube(
      Vec3.fromArray(obj.position),
      obj.size,
      obj.material
    );
  }

  hit(ray, tMin, tMax, hitRecord) {
    let min = this.position.x - this.halfSize;
    let max = this.position.x + this.halfSize;
    let t0 = (min - ray.origin.x) / ray.direction.x;
    let t1 = (max - ray.origin.x) / ray.direction.x;
    if (t0 > t1) [t0, t1] = [t1, t0];
    let tNear = t0;
    let tFar = t1;
    let normal = ray.direction.x > 0 ? new Vec3(-1, 0, 0) : new Vec3(1, 0, 0);

    min = this.position.y - this.halfSize;
    max = this.position.y + this.halfSize;
    t0 = (min - ray.origin.y) / ray.direction.y;
    t1 = (max - ray.origin.y) / ray.direction.y;
    if (t0 > t1) [t0, t1] = [t1, t0];
    if (t0 > tNear) {
      tNear = t0;
      normal = ray.direction.y > 0 ? new Vec3(0, -1, 0) : new Vec3(0, 1, 0);
    }
    tFar = Math.min(t1, tFar);

    if (tFar <= tNear) return false;

    min = this.position.z - this.halfSize;
    max = this.position.z + this.halfSize;
    t0 = (min - ray.origin.z) / ray.direction.z;
    t1 = (max - ray.origin.z) / ray.direction.z;
    if (t0 > t1) [t0, t1] = [t1, t0];
    if (t0 > tNear) {
      tNear = t0;
      normal = ray.direction.z > 0 ? new Vec3(0, 0, -1) : new Vec3(0, 0, 1);
    }
    tFar = Math.min(t1, tFar);

    if (tFar <= tNear) return false;

    if (tNear > tMin && tNear < tMax) {
      hitRecord.t = tNear;
      hitRecord.p = ray.at(tNear);
      hitRecord.setFaceNormal(ray, normal);
      hitRecord.material = this.material;
      return true;
    }

    return false;
  }

  getBoundingBox() {
    return {
      min: new Vec3(
        this.position.x - this.halfSize,
        this.position.y - this.halfSize,
        this.position.z - this.halfSize
      ),
      max: new Vec3(
        this.position.x + this.halfSize,
        this.position.y + this.halfSize,
        this.position.z + this.halfSize
      )
    };
  }
}
