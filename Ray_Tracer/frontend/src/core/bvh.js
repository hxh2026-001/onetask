import { Vec3 } from '../utils/vec3.js';
import { HitRecord } from './hit.js';

function surroundingBox(box0, box1) {
  return {
    min: new Vec3(
      Math.min(box0.min.x, box1.min.x),
      Math.min(box0.min.y, box1.min.y),
      Math.min(box0.min.z, box1.min.z)
    ),
    max: new Vec3(
      Math.max(box0.max.x, box1.max.x),
      Math.max(box0.max.y, box1.max.y),
      Math.max(box0.max.z, box1.max.z)
    )
  };
}

function boxHit(box, ray, tMin, tMax) {
  for (let i = 0; i < 3; i++) {
    const invD = 1 / ray.direction[['x', 'y', 'z'][i]];
    let t0 = (box.min[['x', 'y', 'z'][i]] - ray.origin[['x', 'y', 'z'][i]]) * invD;
    let t1 = (box.max[['x', 'y', 'z'][i]] - ray.origin[['x', 'y', 'z'][i]]) * invD;
    if (invD < 0) [t0, t1] = [t1, t0];
    tMin = Math.max(t0, tMin);
    tMax = Math.min(t1, tMax);
    if (tMax <= tMin) return false;
  }
  return true;
}

export class BVHNode {
  constructor(objects, start, end, unbalanced = false) {
    this.left = null;
    this.right = null;
    this.box = null;

    const axis = Math.floor(Math.random() * 3);
    const comparator = unbalanced
      ? (a, b) => 1
      : (a, b) => {
          const boxA = a.getBoundingBox();
          const boxB = b.getBoundingBox();
          return boxA.min[['x', 'y', 'z'][axis]] - boxB.min[['x', 'y', 'z'][axis]];
        };

    const objectSpan = end - start;

    if (objectSpan === 1) {
      this.left = this.right = objects[start];
    } else if (objectSpan === 2) {
      if (comparator(objects[start], objects[start + 1]) < 0) {
        this.left = objects[start];
        this.right = objects[start + 1];
      } else {
        this.left = objects[start + 1];
        this.right = objects[start];
      }
    } else {
      objects.slice(start, end).sort(comparator);
      const mid = start + Math.floor(objectSpan / 2);
      this.left = new BVHNode(objects, start, mid, unbalanced);
      this.right = new BVHNode(objects, mid, end, unbalanced);
    }

    const boxLeft = this.left.getBoundingBox();
    const boxRight = this.right.getBoundingBox();
    this.box = surroundingBox(boxLeft, boxRight);
  }

  hit(ray, tMin, tMax, hitRecord) {
    if (!boxHit(this.box, ray, tMin, tMax)) return false;

    const hitLeft = this.left.hit(ray, tMin, tMax, hitRecord);
    const hitRight = this.right.hit(ray, tMin, hitLeft ? hitRecord.t : tMax, hitRecord);

    return hitLeft || hitRight;
  }

  getBoundingBox() {
    return this.box;
  }
}
