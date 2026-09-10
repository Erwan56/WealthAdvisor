import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from './db/client.js';
import { avPerRouter } from './routes/avper.js';
import { banquesRouter } from './routes/banques.js';
import { bourseRouter } from './routes/bourse.js';
import { conseilsRouter } from './routes/conseils.js';
import { cryptoRouter } from './routes/crypto.js';
import { entitiesRouter } from './routes/entities.js';
import { immobilierRouter } from './routes/immobilier.js';
import { liquiditesRouter } from './routes/liquidites.js';
import { objectifsRouter } from './routes/objectifs.js';
import { peScpiRouter } from './routes/peScpi.js';
import { profilRouter } from './routes/profil.js';
import { reportingRouter } from './routes/reporting.js';
import { typesCompteLiquiditesRouter } from './routes/typesCompteLiquidites.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

migrate();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/entities', entitiesRouter);
app.use('/api/banques', banquesRouter);
app.use('/api/types-compte-liquidites', typesCompteLiquiditesRouter);
app.use('/api/liquidites', liquiditesRouter);
app.use('/api/bourse', bourseRouter);
app.use('/api/immobilier', immobilierRouter);
app.use('/api/av-per', avPerRouter);
app.use('/api/crypto', cryptoRouter);
app.use('/api/pe-scpi', peScpiRouter);
app.use('/api/reporting', reportingRouter);
app.use('/api/profil', profilRouter);
app.use('/api/objectifs', objectifsRouter);
app.use('/api/conseils', conseilsRouter);

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
