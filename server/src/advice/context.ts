// Assemblage du contexte transmis au LLM à chaque demande de conseil (PRD §6) : patrimoine
// total + profil + tous les résultats déterministes pertinents, sans scoping par domaine ou
// Entité — décision actée en grilling (issue 04), justifiée par le besoin de vision
// transversale du chat consultatif.

import { db } from '../db/client.js';
import { lineIdsForDomain } from '../db/scope.js';
import { buildValueSeries, latestValue } from '../db/timeseries.js';
import { runAdviceEngine } from './engine.js';
import type { EntityRow, Finding, ProfilRow } from './types.js';

export interface AdviceContext {
  patrimoine_total: number;
  patrimoine_net: number;
  entities: { id: number; libelle: string; type: EntityRow['type'] }[];
  profil: ProfilRow;
  findings: Finding[];
}

export function buildAdviceContext(): AdviceContext {
  const entities = db.prepare('SELECT * FROM entities').all() as EntityRow[];
  const profil = db.prepare('SELECT * FROM profil WHERE id = 1').get() as ProfilRow;
  const allLineIds = lineIdsForDomain('all');

  return {
    patrimoine_total: latestValue(buildValueSeries(allLineIds, { net: false })),
    patrimoine_net: latestValue(buildValueSeries(allLineIds, { net: true })),
    entities: entities.map((e) => ({ id: e.id, libelle: e.libelle, type: e.type })),
    profil,
    findings: runAdviceEngine(),
  };
}
