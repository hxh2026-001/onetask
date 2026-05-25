import { ChronoMazeScene } from './ChronoMazeScene';

export class AnimationManager {
  private scene: ChronoMazeScene;
  private dissolveOverlay: HTMLDivElement | null = null;
  private dissolveActive: boolean = false;

  constructor(scene: ChronoMazeScene) {
    this.scene = scene;
    this.createDissolveOverlay();
  }

  private createDissolveOverlay() {
    this.dissolveOverlay = document.createElement('div');
    this.dissolveOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;
    document.body.appendChild(this.dissolveOverlay);
  }

  triggerSweep() {
    this.scene.triggerSweepAnimation();
  }

  triggerDissolve() {
    if (!this.dissolveOverlay || this.dissolveActive) return;

    this.dissolveActive = true;

    const textElement = document.createElement('div');
    textElement.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 48px;
      font-weight: bold;
      color: #4a9eff;
      text-shadow: 0 0 20px #4a9eff;
      animation: dissolve 1.5s forwards;
    `;
    textElement.textContent = '历法转换中...';

    this.dissolveOverlay.appendChild(textElement);

    setTimeout(() => {
      textElement.remove();
      this.dissolveActive = false;
    }, 1500);
  }

  triggerTrail() {
    // 轨迹残影效果通过场景内部实现
    console.log('轨迹残影效果已触发');
  }

  triggerHeartbeat() {
    this.scene.triggerHeartbeatAnimation();
  }

  triggerMosaic() {
    this.scene.triggerMosaicAnimation();

    if (this.dissolveOverlay) {
      const errorElement = document.createElement('div');
      errorElement.style.cssText = `
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 32px;
        font-weight: bold;
        color: #ff4757;
        text-shadow: 0 0 20px #ff4757;
        animation: heartbeat 1s infinite;
      `;
      errorElement.textContent = '⚠ 坐标转换错误 ⚠';

      this.dissolveOverlay.appendChild(errorElement);

      setTimeout(() => {
        errorElement.remove();
      }, 3000);
    }
  }

  triggerTimezoneEffect() {
    this.scene.demonstrateTimezoneOffset();
  }

  triggerLoopEffect() {
    this.scene.demonstrateEndlessLoop();
  }

  triggerPrecisionEffect() {
    this.scene.demonstratePrecisionLoss();
  }

  triggerOverwriteEffect() {
    this.scene.demonstratePathOverwrite();
  }

  destroy() {
    if (this.dissolveOverlay) {
      this.dissolveOverlay.remove();
      this.dissolveOverlay = null;
    }
  }
}
