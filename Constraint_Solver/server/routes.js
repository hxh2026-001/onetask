const Router = require('koa-router');
const { 
  saveScene, 
  loadScene, 
  listScenes, 
  deleteScene,
  saveSolveStep,
  getSolveHistory,
  clearSolveHistory
} = require('./db');
const { solveConstraints } = require('./solver');
const { getPreset, listPresets } = require('./presets');

const router = new Router({ prefix: '/api' });

router.get('/presets', async (ctx) => {
  ctx.body = listPresets();
});

router.get('/presets/:type', async (ctx) => {
  const preset = getPreset(ctx.params.type);
  if (!preset) {
    ctx.status = 404;
    ctx.body = { error: '预设场景不存在' };
    return;
  }
  ctx.body = preset;
});

router.post('/presets/:type/save', async (ctx) => {
  const preset = getPreset(ctx.params.type);
  if (!preset) {
    ctx.status = 404;
    ctx.body = { error: '预设场景不存在' };
    return;
  }
  const sceneId = await saveScene(preset);
  ctx.body = { sceneId, ...preset };
});

router.get('/scenes', async (ctx) => {
  ctx.body = await listScenes();
});

router.get('/scenes/:id', async (ctx) => {
  const scene = await loadScene(parseInt(ctx.params.id));
  if (!scene) {
    ctx.status = 404;
    ctx.body = { error: '场景不存在' };
    return;
  }
  ctx.body = scene;
});

router.post('/scenes', async (ctx) => {
  const sceneData = ctx.request.body;
  if (!sceneData.name || !sceneData.elements || !sceneData.constraints) {
    ctx.status = 400;
    ctx.body = { error: '缺少必要字段' };
    return;
  }
  const sceneId = await saveScene(sceneData);
  ctx.body = { sceneId, ...sceneData };
});

router.delete('/scenes/:id', async (ctx) => {
  await deleteScene(parseInt(ctx.params.id));
  ctx.body = { success: true };
});

router.post('/solve', async (ctx) => {
  const { elements, constraints, sceneId, saveToHistory = true } = ctx.request.body;
  
  if (!elements || !constraints) {
    ctx.status = 400;
    ctx.body = { error: '缺少 elements 或 constraints' };
    return;
  }
  
  if (saveToHistory && sceneId) {
    await clearSolveHistory(sceneId);
  }
  
  const saveHistoryFn = saveToHistory && sceneId 
    ? (id, iter, res, maxV, elemStates, consStates, path) => 
        saveSolveStep(id, iter, res, maxV, elemStates, consStates, path)
    : null;
  
  const result = solveConstraints(elements, constraints, {
    saveHistory: saveHistoryFn,
    sceneId
  });
  
  ctx.body = result;
});

router.post('/analyze', async (ctx) => {
  const { elements, constraints } = ctx.request.body;
  
  if (!elements || !constraints) {
    ctx.status = 400;
    ctx.body = { error: '缺少 elements 或 constraints' };
    return;
  }
  
  const { analyzeConstraintSystem } = require('./constraint_graph');
  const analysis = analyzeConstraintSystem(elements, constraints);
  
  ctx.body = analysis;
});

router.get('/scenes/:id/history', async (ctx) => {
  const history = await getSolveHistory(parseInt(ctx.params.id));
  ctx.body = history;
});

router.delete('/scenes/:id/history', async (ctx) => {
  await clearSolveHistory(parseInt(ctx.params.id));
  ctx.body = { success: true };
});

router.get('/health', async (ctx) => {
  ctx.body = { status: 'ok', time: new Date().toISOString() };
});

module.exports = router;
