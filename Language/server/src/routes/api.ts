import { Router, Request, Response } from 'express';
import { Compiler } from '../compiler/Compiler';
import { getDatabase } from '../database/DatabaseManager';
import { getAllScenarios, getScenario } from '../scenarios/scenarios';

const router = Router();
const compiler = new Compiler();
const db = getDatabase();

router.post('/compile', (req: Request, res: Response) => {
  const { code, scenario } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: '缺少代码参数' });
  }

  try {
    const result = compiler.compile({ code, scenario });
    return res.json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || '编译错误' });
  }
});

router.get('/scenarios', (req: Request, res: Response) => {
  const scenarios = getAllScenarios();
  return res.json(scenarios);
});

router.get('/scenarios/:id', (req: Request, res: Response) => {
  const scenario = getScenario(req.params.id);
  if (!scenario) {
    return res.status(404).json({ error: '场景未找到' });
  }
  return res.json(scenario);
});

router.get('/snippets', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const snippets = db.getSnippets(limit);
  return res.json(snippets);
});

router.get('/snippets/:id', (req: Request, res: Response) => {
  const snippet = db.getSnippet(req.params.id);
  if (!snippet) {
    return res.status(404).json({ error: '代码片段未找到' });
  }
  return res.json(snippet);
});

router.delete('/snippets/:id', (req: Request, res: Response) => {
  const success = db.deleteSnippet(req.params.id);
  if (!success) {
    return res.status(404).json({ error: '代码片段未找到' });
  }
  return res.json({ success: true });
});

router.get('/errors', (req: Request, res: Response) => {
  const snippetId = req.query.snippetId as string;
  const limit = parseInt(req.query.limit as string) || 100;
  const errors = db.getErrorLogs(snippetId, limit);
  return res.json(errors);
});

router.get('/health', (req: Request, res: Response) => {
  return res.json({ status: 'ok', uptime: process.uptime() });
});

export default router;
