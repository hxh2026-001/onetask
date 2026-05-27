import { OrigamiEngine } from './engine/OrigamiEngine';

const engine = new OrigamiEngine();
engine.init();

window.addEventListener('resize', () => {
  engine.handleResize();
});