import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from './db/client.js';
import { bourseRouter } from './routes/bourse.js';
import { entitiesRouter } from './routes/entities.js';
import { liquiditesRouter } from './routes/liquidites.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

migrate();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/entities', entitiesRouter);
app.use('/api/liquidites', liquiditesRouter);
app.use('/api/bourse', bourseRouter);

// Serve the built web app when present (production / one-click start flow).
const webDist = join(__dirname, '..', '..', 'web', 'dist');
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (_req, res) => {
    res.sendFile(join(webDist, 'index.html'));
  });
}

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`WealthAdvisor server listening on http://localhost:${PORT}`);
});
