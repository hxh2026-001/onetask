import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api';
import { getDatabase } from './database/DatabaseManager';

const PORT = process.env.PORT || 7002;
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.json({
    name: 'Compiler Sandbox API',
    version: '1.0.0',
    endpoints: {
      compile: 'POST /api/compile',
      scenarios: 'GET /api/scenarios',
      snippets: 'GET /api/snippets',
      errors: 'GET /api/errors',
      health: 'GET /api/health',
    },
  });
});

const db = getDatabase();

app.listen(PORT, () => {
  console.log(`Compiler Sandbox Server running on port ${PORT}`);
  console.log(`Database initialized`);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
