export class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static fromArray(arr) {
    return new Vec3(arr[0], arr[1], arr[2]);
  }

  add(v) {
    return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  sub(v) {
    return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  mul(s) {
    if (s instanceof Vec3) {
      return new Vec3(this.x * s.x, this.y * s.y, this.z * s.z);
    }
    return new Vec3(this.x * s, this.y * s, this.z * s);
  }

  div(s) {
    return new Vec3(this.x / s, this.y / s, this.z / s);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v) {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  lengthSquared() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  normalize() {
    const len = this.length();
    return len > 0 ? this.div(len) : new Vec3();
  }

  negate() {
    return new Vec3(-this.x, -this.y, -this.z);
  }

  reflect(n) {
    return this.sub(n.mul(2 * this.dot(n)));
  }

  refract(n, ior) {
    const cosTheta = Math.min(this.negate().dot(n), 1);
    const rOutPerp = this.add(n.mul(cosTheta)).mul(ior);
    const rOutParallel = n.mul(-Math.sqrt(Math.abs(1 - rOutPerp.lengthSquared())));
    return rOutPerp.add(rOutParallel);
  }

  toArray() {
    return [this.x, this.y, this.z];
  }

  clone() {
    return new Vec3(this.x, this.y, this.z);
  }
}

export const randomUnitVector = () => {
  while (true) {
    const v = new Vec3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
    if (v.lengthSquared() < 1) {
      return v.normalize();
    }
  }
};

export const randomInUnitSphere = () => {
  while (true) {
    const v = new Vec3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
    if (v.lengthSquared() < 1) {
      return v;
    }
  }
};

export const lerp = (a, b, t) => a.add(b.sub(a).mul(t));
