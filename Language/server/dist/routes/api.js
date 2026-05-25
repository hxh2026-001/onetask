"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Compiler_1 = require("../compiler/Compiler");
const DatabaseManager_1 = require("../database/DatabaseManager");
const scenarios_1 = require("../scenarios/scenarios");
const router = (0, express_1.Router)();
const compiler = new Compiler_1.Compiler();
const db = (0, DatabaseManager_1.getDatabase)();
router.post('/compile', (req, res) => {
    const { code, scenario } = req.body;
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: '缺少代码参数' });
    }
    try {
        const result = compiler.compile({ code, scenario });
        return res.json(result);
    }
    catch (e) {
        return res.status(500).json({ error: e.message || '编译错误' });
    }
});
router.get('/scenarios', (req, res) => {
    const scenarios = (0, scenarios_1.getAllScenarios)();
    return res.json(scenarios);
});
router.get('/scenarios/:id', (req, res) => {
    const scenario = (0, scenarios_1.getScenario)(req.params.id);
    if (!scenario) {
        return res.status(404).json({ error: '场景未找到' });
    }
    return res.json(scenario);
});
router.get('/snippets', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const snippets = db.getSnippets(limit);
    return res.json(snippets);
});
router.get('/snippets/:id', (req, res) => {
    const snippet = db.getSnippet(req.params.id);
    if (!snippet) {
        return res.status(404).json({ error: '代码片段未找到' });
    }
    return res.json(snippet);
});
router.delete('/snippets/:id', (req, res) => {
    const success = db.deleteSnippet(req.params.id);
    if (!success) {
        return res.status(404).json({ error: '代码片段未找到' });
    }
    return res.json({ success: true });
});
router.get('/errors', (req, res) => {
    const snippetId = req.query.snippetId;
    const limit = parseInt(req.query.limit) || 100;
    const errors = db.getErrorLogs(snippetId, limit);
    return res.json(errors);
});
router.get('/health', (req, res) => {
    return res.json({ status: 'ok', uptime: process.uptime() });
});
exports.default = router;
//# sourceMappingURL=api.js.map