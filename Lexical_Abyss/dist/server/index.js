import express from 'express';
import cors from 'cors';
import { NFA } from './nfa.js';
import { dbManager } from './database.js';
const app = express();
const PORT = 3005;
app.use(cors());
app.use(express.json());
app.get('/favicon.ico', (_req, res) => {
    res.status(204).end();
});
app.post('/api/compile', (req, res) => {
    try {
        const { pattern } = req.body;
        const nfa = NFA.fromRegex(pattern);
        res.json({ success: true, nfa });
    }
    catch (error) {
        res.json({ success: false, error: error.message });
    }
});
app.post('/api/match', (req, res) => {
    try {
        const { pattern, input } = req.body;
        const nfa = NFA.fromRegex(pattern);
        const result = NFA.simulate(nfa, input);
        res.json({ success: true, result });
    }
    catch (error) {
        res.json({ success: false, error: error.message });
    }
});
app.post('/api/analyze', (req, res) => {
    try {
        const { pattern } = req.body;
        const analysis = NFA.analyzeTrap(pattern);
        res.json({ success: true, analysis });
    }
    catch (error) {
        res.json({ success: false, error: error.message });
    }
});
app.post('/api/patterns', (req, res) => {
    try {
        const { pattern, name, description } = req.body;
        const id = dbManager.savePattern(pattern, name, description || '');
        res.json({ success: true, id });
    }
    catch (error) {
        res.json({ success: false, error: error.message });
    }
});
app.get('/api/patterns', (_req, res) => {
    try {
        const patterns = dbManager.getPatterns();
        res.json({ success: true, patterns });
    }
    catch (error) {
        res.json({ success: false, error: error.message });
    }
});
app.get('/api/patterns/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const pattern = dbManager.getPatternById(id);
        if (pattern) {
            res.json({ success: true, pattern });
        }
        else {
            res.json({ success: false, error: 'Pattern not found' });
        }
    }
    catch (error) {
        res.json({ success: false, error: error.message });
    }
});
app.delete('/api/patterns/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        dbManager.deletePattern(id);
        res.json({ success: true });
    }
    catch (error) {
        res.json({ success: false, error: error.message });
    }
});
app.post('/api/test-cases', (req, res) => {
    try {
        const { patternId, input, expectedMatch } = req.body;
        const id = dbManager.saveTestCase(patternId, input, expectedMatch);
        res.json({ success: true, id });
    }
    catch (error) {
        res.json({ success: false, error: error.message });
    }
});
app.put('/api/test-cases/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { actualMatch, backtrackCount, timeMs, trapDetected, trapType } = req.body;
        dbManager.updateTestCase(id, actualMatch, backtrackCount, timeMs, trapDetected, trapType);
        res.json({ success: true });
    }
    catch (error) {
        res.json({ success: false, error: error.message });
    }
});
app.get('/api/test-cases/:patternId', (req, res) => {
    try {
        const patternId = parseInt(req.params.patternId, 10);
        const testCases = dbManager.getTestCases(patternId);
        res.json({ success: true, testCases });
    }
    catch (error) {
        res.json({ success: false, error: error.message });
    }
});
app.delete('/api/test-cases/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        dbManager.deleteTestCase(id);
        res.json({ success: true });
    }
    catch (error) {
        res.json({ success: false, error: error.message });
    }
});
app.get('/api/presets', (_req, res) => {
    const presets = [
        {
            id: 1,
            name: '灾难性回溯',
            pattern: '(a+)+b',
            testInput: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            description: '嵌套量词导致指数级回溯'
        },
        {
            id: 2,
            name: '零宽断言嵌套',
            pattern: '(?=(?<=a)*b)*',
            testInput: 'aaaaaaaaabbbbbbbbbbbbbbbbbbbbb',
            description: '复杂断言引发逻辑死锁'
        },
        {
            id: 3,
            name: '字符组补集爆炸',
            pattern: '[^abc]{10,}',
            testInput: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            description: 'NFA转DFA状态爆炸'
        },
        {
            id: 4,
            name: 'Unicode边界陷阱',
            pattern: '\\b{10,}\\B{10,}',
            testInput: 'a b c d e f g h i j k l m n o p',
            description: 'Unicode边界导致匹配异常'
        }
    ];
    res.json({ success: true, presets });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
