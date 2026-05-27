import { Vec3 } from '../utils/vec3.js';

export class Ray {
  constructor(origin, direction) {
    this.origin = origin;
    this.direction = direction;
  }

  at(t) {
    return this.origin.add(this.direction.mul(t));
  }
}
