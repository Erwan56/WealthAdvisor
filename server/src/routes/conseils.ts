import { Router } from 'express';
import { runAdviceEngine } from '../advice/engine.js';

export const conseilsRouter = Router();

// GET /api/conseils?entity_id=<id>|all — Findings déterministes courants (PRD §6-§7, ticket 3).
// Les Findings transverses (entity_id: null — IFI, seuil AV 150k, plafond PER, expositions
// crypto/PE calculées sur le Patrimoine net total) sont toujours inclus : ils ne sont pas
// rattachables à une seule Entité par construction.
conseilsRouter.get('/', (req, res) => {
  const entityIdRaw = req.query.entity_id as string | undefined;
  const findings = runAdviceEngine();

  if (!entityIdRaw || entityIdRaw === 'all') {
    return res.json({ findings });
  }

  const entityId = Number(entityIdRaw);
  res.json({ findings: findings.filter((f) => f.entity_id === null || f.entity_id === entityId) });
});
