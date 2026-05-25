import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createServer } from 'http';
import { NFABuilder } from './nfa-builder.js';
import { DFABuilder } from './dfa-builder.js';
import { DFAMinimizer } from './dfa-minimizer.js';
import { RegexMatcher } from './regex-matcher.js';
import { DatabaseManager } from './database.js';
import { NFA, DFA, MinimizedDFA, PRESET_SCENARIOS } from './types.js';

const app = new Hono();
const db = new DatabaseManager('./regex_visualizer.db');

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type']
}));

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/presets', (c) => {
  return c.json({ presets: PRESET_SCENARIOS });
});

app.post('/api/build', async (c) => {
  try {
    const body = await c.req.json();
    const { pattern, testText } = body;

    if (!pattern) {
      return c.json({ error: 'Pattern is required' }, 400);
    }

    const nfaBuilder = new NFABuilder();
    const dfaBuilder = new DFABuilder();
    const dfaMinimizer = new DFAMinimizer();
    const matcher = new RegexMatcher();

    let nfa: NFA;
    let dfa: DFA;
    let minimizedDfa: MinimizedDFA;
    let matchResult;

    try {
      nfa = nfaBuilder.build(pattern);
    } catch (error: any) {
      return c.json({ error: `NFA build failed: ${error.message}` }, 400);
    }

    try {
      dfa = dfaBuilder.convertToDFA(nfa);
    } catch (error: any) {
      return c.json({ error: `DFA conversion failed: ${error.message}` }, 400);
    }

    try {
      minimizedDfa = dfaMinimizer.minimize(dfa);
    } catch (error: any) {
      return c.json({ error: `DFA minimization failed: ${error.message}` }, 400);
    }

    if (testText) {
      try {
        matchResult = matcher.matchWithNFA(nfa, testText);
      } catch (error: any) {
        matchResult = { error: error.message };
      }
    }

    const historyId = db.saveRegexHistory(pattern, testText || '', matchResult || null);

    db.saveAutomatonSnapshot(historyId, 'NFA', db.serializeNFA(nfa));
    db.saveAutomatonSnapshot(historyId, 'DFA', db.serializeDFA(dfa));
    db.saveAutomatonSnapshot(historyId, 'MINIMIZED_DFA', db.serializeMinimizedDFA(minimizedDfa));

    if (matchResult && matchResult.steps) {
      db.saveMatchLog(historyId, JSON.stringify(matchResult.steps));
    }

    return c.json({
      historyId,
      nfa: {
        states: [...nfa.states.entries()].map(([id, state]) => ({
          id,
          transitions: [...state.transitions.entries()].map(([sym, targets]) => ({
            symbol: sym,
            targets: [...targets]
          })),
          isAccept: state.isAccept,
          label: state.label
        })),
        start: nfa.start,
        accept: nfa.accept,
        alphabet: [...nfa.alphabet],
        buildSteps: nfa.buildSteps.map(step => ({
          step: step.step,
          description: step.description,
          states: [...step.states.entries()].map(([id, state]) => ({
            id,
            transitions: [...state.transitions.entries()].map(([sym, targets]) => ({
              symbol: sym,
              targets: [...targets]
            })),
            isAccept: state.isAccept,
            label: state.label
          })),
          start: step.start,
          accept: step.accept,
          newStateIds: step.newStateIds,
          newTransitions: step.newTransitions
        }))
      },
      dfa: {
        states: [...dfa.states.entries()].map(([id, state]) => ({
          id,
          nfaStates: [...state.nfaStates],
          transitions: [...state.transitions.entries()],
          isAccept: state.isAccept,
          isStart: state.isStart,
          label: state.label
        })),
        start: dfa.start,
        acceptStates: [...dfa.acceptStates],
        alphabet: [...dfa.alphabet],
        buildSteps: dfa.buildSteps.map(step => ({
          step: step.step,
          description: step.description,
          dfaStates: [...step.dfaStates.entries()].map(([id, state]) => ({
            id,
            nfaStates: [...state.nfaStates],
            transitions: [...state.transitions.entries()],
            isAccept: state.isAccept,
            isStart: state.isStart,
            label: state.label
          })),
          epsilonClosureSteps: step.epsilonClosureSteps.map(ecs => ({
            fromState: ecs.fromState,
            visitedStates: [...ecs.visitedStates],
            newVisited: [...ecs.newVisited],
            wave: ecs.wave
          })),
          newStateId: step.newStateId,
          transitionDetails: step.transitionDetails
        }))
      },
      minimizedDfa: {
        states: [...minimizedDfa.states.entries()].map(([id, state]) => ({
          id,
          originalStates: [...state.originalStates],
          transitions: [...state.transitions.entries()],
          isAccept: state.isAccept,
          isStart: state.isStart
        })),
        start: minimizedDfa.start,
        acceptStates: [...minimizedDfa.acceptStates],
        alphabet: [...minimizedDfa.alphabet],
        equivalenceClasses: minimizedDfa.equivalenceClasses,
        mergeSteps: minimizedDfa.mergeSteps.map(step => ({
          ...step,
          partitions: step.partitions.map(p => [...p])
        }))
      },
      matchResult: matchResult || { success: false, matchStart: -1, matchEnd: -1, matchedText: '', steps: [], captureGroups: [], executionTime: 0, stateCount: 0, backtrackCount: 0 }
    });
  } catch (error: any) {
    return c.json({ error: `Build failed: ${error.message}` }, 500);
  }
});

app.post('/api/match', async (c) => {
  try {
    const body = await c.req.json();
    const { pattern, testText, engine } = body;

    if (!pattern || !testText) {
      return c.json({ error: 'Pattern and testText are required' }, 400);
    }

    const nfaBuilder = new NFABuilder();
    const dfaBuilder = new DFABuilder();
    const dfaMinimizer = new DFAMinimizer();
    const matcher = new RegexMatcher();

    const nfa = nfaBuilder.build(pattern);
    let matchResult;

    if (engine === 'minimized-dfa') {
      const dfa = dfaBuilder.convertToDFA(nfa);
      const minimizedDfa = dfaMinimizer.minimize(dfa);
      matchResult = matcher.matchWithMinimizedDFA(minimizedDfa, testText);
    } else if (engine === 'dfa') {
      const dfa = dfaBuilder.convertToDFA(nfa);
      matchResult = matcher.matchWithDFA(dfa, testText);
    } else {
      matchResult = matcher.matchWithNFA(nfa, testText);
    }

    return c.json({ matchResult });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

app.get('/api/history', (c) => {
  const history = db.getRegexHistory();
  return c.json({ history });
});

app.get('/api/history/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const snapshots = db.getAutomatonSnapshots(id);
  const logs = db.getMatchLogs(id);
  return c.json({ snapshots, logs });
});

app.delete('/api/history/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  db.deleteRegexHistory(id);
  return c.json({ success: true });
});

app.delete('/api/history', (c) => {
  db.clearHistory();
  return c.json({ success: true });
});

const port = 7002;
console.log(`🚀 Regex Visualizer Backend starting on port ${port}`);

async function handleRequest(nodeReq: any, nodeRes: any): Promise<void> {
  let body: any;
  if (nodeReq.method !== 'GET' && nodeReq.method !== 'DELETE') {
    const chunks: Buffer[] = [];
    for await (const chunk of nodeReq) {
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks).toString();
  }

  const request = new Request(
    `http://localhost:${port}${nodeReq.url}`,
    {
      method: nodeReq.method,
      headers: nodeReq.headers,
      body: body
    }
  );

  try {
    const response = await app.fetch(request);
    nodeRes.statusCode = response.status;
    response.headers.forEach((value, key) => {
      nodeRes.setHeader(key, value);
    });
    nodeRes.end(await response.text());
  } catch (error) {
    console.error('Request error:', error);
    nodeRes.statusCode = 500;
    nodeRes.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

const server = createServer(handleRequest);

server.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📋 API Endpoints:`);
    console.log(`  GET  /api/health`);
    console.log(`  GET  /api/presets`);
    console.log(`  POST /api/build`);
    console.log(`  POST /api/match`);
    console.log(`  GET  /api/history`);
    console.log(`  GET  /api/history/:id`);
    console.log(`  DELETE /api/history/:id`);
  }
});
