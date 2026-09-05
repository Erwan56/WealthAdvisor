// Moteur de conseil hybride — couche déterministe uniquement (ticket 3, PRD §6).
//
// Skeleton volontairement simple : recalcule tous les Findings depuis l'état courant du
// patrimoine/profil à chaque appel (pas de persistance — PRD §6 "conseil éphémère"), pas de
// job périodique. Le ticket 4 branchera le CLI Claude Code par-dessus, en lui transmettant
// ces Findings comme contexte déjà calculé (garde-fou numérique : le LLM ne recalcule jamais).

import { db } from '../db/client.js';
import { avPerFindings } from './rules/avper.js';
import { bourseFindings } from './rules/bourse.js';
import { cryptoPeFindings } from './rules/cryptoPe.js';
import { immobilierFindings } from './rules/immobilier.js';
import { liquiditesFindings } from './rules/liquidites.js';
import type { EntityRow, Finding, ProfilRow } from './types.js';

export function runAdviceEngine(): Finding[] {
  const entities = db.prepare('SELECT * FROM entities').all() as EntityRow[];
  const profil = db.prepare('SELECT * FROM profil WHERE id = 1').get() as ProfilRow;

  return [
    ...liquiditesFindings(entities, profil),
    ...bourseFindings(entities),
    ...immobilierFindings(entities),
    ...avPerFindings(entities, profil),
    ...cryptoPeFindings(entities, profil),
  ];
}
