import { Vec3, lerp } from '../utils/vec3.js';
import { Ray } from './ray.js';
import { HitRecord } from './hit.js';
import { BVHNode } from './bvh.js';
import { Sphere } from '../objects/sphere.js';
import { Plane } from '../objects/plane.js';
import { Cube } from '../objects/cube.js';
import { createMaterialFromScene } from './material.js';

export class Scene {
  constructor(sceneData) {
    this.objects = [];
    this.lights = [];
    this.camera = sceneData.camera;
    this.settings = sceneData.settings;

    sceneData.objects.forEach(obj => {
      const material = createMaterialFromScene(obj.material);
      let newObj;
      switch (obj.type) {
        case 'sphere':
          newObj = Sphere.fromSceneObject({ ...obj, material });
          break;
        case 'plane':
          newObj = Plane.fromSceneObject({ ...obj, material });
          break;
        case 'cube':
          newObj = Cube.fromSceneObject({ ...obj, material });
          break;
      }
      if (newObj) this.objects.push(newObj);
    });

    this.lights = sceneData.lights;

    if (this.settings.enableBVH && this.objects.length > 0) {
      this.bvh = new BVHNode(this.objects, 0, this.objects.length, this.settings.unbalancedBVH);
    } else {
      this.bvh = null;
    }
  }

  hit(ray, tMin, tMax, hitRecord) {
    let hitAnything = false;
    let closestSoFar = tMax;
    const tempRecord = new HitRecord();

    if (this.bvh) {
      hitAnything = this.bvh.hit(ray, tMin, tMax, hitRecord);
    } else {
      this.objects.forEach(obj => {
        if (obj.hit(ray, tMin, closestSoFar, tempRecord)) {
          hitAnything = true;
          closestSoFar = tempRecord.t;
          Object.assign(hitRecord, tempRecord);
        }
      });
    }

    return hitAnything;
  }

  sampleLights(hitRecord) {
    let totalLight = new Vec3();

    this.lights.forEach(light => {
      if (light.type === 'point') {
        const lightPos = Vec3.fromArray(light.position);
        const lightDir = lightPos.sub(hitRecord.p).normalize();
        const distance = lightPos.sub(hitRecord.p).length();
        const attenuation = light.intensity / (distance * distance);
        const ndotl = Math.max(0, hitRecord.normal.dot(lightDir));

        const shadowRay = new Ray(hitRecord.p.add(hitRecord.normal.mul(0.001)), lightDir);
        const shadowHit = new HitRecord();
        const inShadow = this.hit(shadowRay, 0.001, distance, shadowHit);

        if (!inShadow) {
          const lightColor = Vec3.fromArray(light.color);
          totalLight = totalLight.add(lightColor.mul(attenuation * ndotl));
        }
      } else if (light.type === 'area') {
        const lightPos = Vec3.fromArray(light.position);
        let sampleLight = new Vec3();

        for (let s = 0; s < 4; s++) {
          const jitter = new Vec3(
            (Math.random() - 0.5) * light.size,
            (Math.random() - 0.5) * light.size,
            (Math.random() - 0.5) * light.size
          );
          const samplePos = lightPos.add(jitter);
          const lightDir = samplePos.sub(hitRecord.p).normalize();
          const distance = samplePos.sub(hitRecord.p).length();
          const attenuation = light.intensity / (distance * distance);
          const ndotl = Math.max(0, hitRecord.normal.dot(lightDir));

          const shadowRay = new Ray(hitRecord.p.add(hitRecord.normal.mul(0.001)), lightDir);
          const shadowHit = new HitRecord();
          const inShadow = this.hit(shadowRay, 0.001, distance, shadowHit);

          if (!inShadow) {
            const lightColor = Vec3.fromArray(light.color);
            sampleLight = sampleLight.add(lightColor.mul(attenuation * ndotl));
          }
        }
        totalLight = totalLight.add(sampleLight.div(4));
      }
    });

    return totalLight;
  }
}

export class Renderer {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Float32Array(width * height * 3);
    this.sampleCount = 0;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Float32Array(width * height * 3);
    this.sampleCount = 0;
  }

  reset() {
    this.data = new Float32Array(this.width * this.height * 3);
    this.sampleCount = 0;
  }

  getCameraRay(scene, u, v) {
    const camPos = Vec3.fromArray(scene.camera.position);
    const lookAt = Vec3.fromArray(scene.camera.lookAt);
    const up = new Vec3(0, 1, 0);

    const fov = (scene.camera.fov * Math.PI) / 180;
    const aspectRatio = this.width / this.height;
    const viewportHeight = 2 * Math.tan(fov / 2);
    const viewportWidth = viewportHeight * aspectRatio;

    const w = camPos.sub(lookAt).normalize();
    const uVec = up.cross(w).normalize();
    const vVec = w.cross(uVec);

    const viewportU = uVec.mul(viewportWidth);
    const viewportV = vVec.negate().mul(viewportHeight);
    const pixelDeltaU = viewportU.div(this.width);
    const pixelDeltaV = viewportV.div(this.height);
    const viewportUpperLeft = camPos
      .sub(w)
      .sub(viewportU.div(2))
      .sub(viewportV.div(2));
    const pixel00Loc = viewportUpperLeft.add(pixelDeltaU.add(pixelDeltaV).div(2));

    const pixelCenter = pixel00Loc
      .add(pixelDeltaU.mul(u))
      .add(pixelDeltaV.mul(v));
    const rayDirection = pixelCenter.sub(camPos).normalize();

    return new Ray(camPos, rayDirection);
  }

  rayColor(scene, ray, depth) {
    const hitRecord = new HitRecord();

    if (depth <= 0) {
      return new Vec3(0, 0, 0);
    }

    if (scene.hit(ray, 0.001, Infinity, hitRecord)) {
      const directLight = scene.sampleLights(hitRecord);
      const scatterResult = hitRecord.material.scatter(ray, hitRecord);

      if (scatterResult.scattered) {
        const indirect = this.rayColor(scene, scatterResult.scattered, depth - 1).mul(scatterResult.attenuation);
        return directLight.add(indirect);
      }
      return directLight;
    }

    const unitDirection = ray.direction.normalize();
    const t = 0.5 * (unitDirection.y + 1);
    return lerp(new Vec3(1, 1, 1), new Vec3(0.5, 0.7, 1), t);
  }

  render(scene) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (y * this.width + x) * 3;

        const u = x + (Math.random() - 0.5);
        const v = y + (Math.random() - 0.5);
        const ray = this.getCameraRay(scene, u, v);

        const color = this.rayColor(scene, ray, scene.settings.maxDepth);

        const oldWeight = this.sampleCount / (this.sampleCount + 1);
        const newWeight = 1 / (this.sampleCount + 1);

        this.data[idx] = this.data[idx] * oldWeight + color.x * newWeight;
        this.data[idx + 1] = this.data[idx + 1] * oldWeight + color.y * newWeight;
        this.data[idx + 2] = this.data[idx + 2] * oldWeight + color.z * newWeight;
      }
    }
    this.sampleCount++;
  }

  fillImageData(imageData) {
    const data = imageData.data;
    for (let i = 0; i < this.width * this.height; i++) {
      const idx = i * 4;
      const srcIdx = i * 3;

      const r = this.data[srcIdx];
      const g = this.data[srcIdx + 1];
      const b = this.data[srcIdx + 2];

      data[idx] = Math.min(255, Math.max(0, Math.sqrt(r) * 255));
      data[idx + 1] = Math.min(255, Math.max(0, Math.sqrt(g) * 255));
      data[idx + 2] = Math.min(255, Math.max(0, Math.sqrt(b) * 255));
      data[idx + 3] = 255;
    }
  }
}
