import { Vec3 } from '../utils/vec3.js';

export class HitRecord {
  constructor() {
    this.t = Infinity;
    this.p = new Vec3();
    this.normal = new Vec3();
    this.material = null;
    this.frontFace = true;
  }

  setFaceNormal(ray, outwardNormal) {
    this.frontFace = ray.direction.dot(outwardNormal) < 0;
    this.normal = this.frontFace ? outwardNormal : outwardNormal.negate();
  }
}
