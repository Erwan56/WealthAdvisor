// Règles Bourse (PRD §7.2, issue 15) — 3 règles/angles : concentration par Ligne, cash
// dormant en Enveloppe, angle fiscal PEA vs CTO (contexte, pas une anomalie à seuil).

import { db } from '../../db/client.js';
import { yearsBetween } from '../dates.js';
import { RULES } from '../rule-constants.js';
import type { EntityRow, Finding } from '../types.js';

interface BourseLineRow {
  id: number;
  entity_id: number;
  envelope_id: number;
  libelle: string;
  valeur_actuelle: number;
  quantite: number | null;
  pru: number | null;
  est_compte_especes: 0 | 1;
}

interface BourseEnvelopeRow {
  id: number;
  entity_id: number;
  libelle: string;
  type: string;
  date_ouverture: string | null;
}

function concentrationParLigne(lines: BourseLineRow[]): Finding[] {
  const findings: Finding[] = [];
  const byEntity = new Map<number, BourseLineRow[]>();
  for (const l of lines) {
    const list = byEntity.get(l.entity_id) ?? [];
    list.push(l);
    byEntity.set(l.entity_id, list);
  }

  for (const [entityId, entityLines] of byEntity) {
    const total = entityLines.reduce((s, l) => s + l.valeur_actuelle, 0);
    if (total <= 0) continue;

    for (const line of entityLines.filter((l) => !l.est_compte_especes)) {
      const pct = line.valeur_actuelle / total;
      if (pct <= RULES.bourse.concentrationLigneSeuilPct) continue;

      findings.push({
        id: `bourse-concentration-${line.id}`,
        domaine: 'bourse',
        type: 'anomalie',
        entity_id: entityId,
        titre: `Concentration excessive — ${line.libelle}`,
        detail: `Cette Ligne dépasse ${RULES.bourse.concentrationLigneSeuilPct * 100} % du total bourse cumulé (PEA+PEA-PME+CTO) de l'Entité. Rééquilibrage possible vers d'autres Lignes/Enveloppes déjà détenues.`,
        chiffres: { valeur_ligne: line.valeur_actuelle, total_bourse_entite: total, part_pct: pct * 100 },
        confiance: 'fiable',
      });
    }
  }
  return findings;
}

function cashDormant(lines: BourseLineRow[], envelopes: BourseEnvelopeRow[]): Finding[] {
  const findings: Finding[] = [];
  const envById = new Map(envelopes.map((e) => [e.id, e]));
  const byEnvelope = new Map<number, BourseLineRow[]>();
  for (const l of lines) {
    const list = byEnvelope.get(l.envelope_id) ?? [];
    list.push(l);
    byEnvelope.set(l.envelope_id, list);
  }

  for (const [envelopeId, envLines] of byEnvelope) {
    const env = envById.get(envelopeId);
    if (!env) continue;
    const total = envLines.reduce((s, l) => s + l.valeur_actuelle, 0);
    if (total <= 0) continue;
    const cash = envLines.find((l) => l.est_compte_especes);
    if (!cash) continue;

    const pct = cash.valeur_actuelle / total;
    if (pct <= RULES.bourse.cashDormantEnveloppeSeuilPct) continue;

    findings.push({
      id: `bourse-cash-dormant-${envelopeId}`,
      domaine: 'bourse',
      type: 'anomalie',
      entity_id: env.entity_id,
      titre: `Cash dormant — ${env.libelle}`,
      detail: `Le compte espèces dépasse ${RULES.bourse.cashDormantEnveloppeSeuilPct * 100} % de la valeur de l'Enveloppe.`,
      chiffres: { cash: cash.valeur_actuelle, total_enveloppe: total, part_pct: pct * 100 },
      confiance: 'fiable',
    });
  }
  return findings;
}

function angleFiscal(lines: BourseLineRow[], envelopes: BourseEnvelopeRow[]): Finding[] {
  const findings: Finding[] = [];
  const now = new Date();

  for (const env of envelopes.filter((e) => (e.type === 'PEA' || e.type === 'PEA-PME') && e.date_ouverture)) {
    const anciennete = yearsBetween(new Date(env.date_ouverture!), now);
    findings.push({
      id: `bourse-angle-pea-${env.id}`,
      domaine: 'bourse',
      type: 'contexte',
      entity_id: env.entity_id,
      titre: `Ancienneté fiscale — ${env.libelle}`,
      detail: `${anciennete >= RULES.bourse.peaAngleAncienneteAns ? 'Au-delà' : 'En deçà'} du seuil des ${RULES.bourse.peaAngleAncienneteAns} ans (exonération d'IR sur les gains après clôture/retrait, hors prélèvements sociaux).`,
      chiffres: { anciennete_ans: anciennete, seuil_ans: RULES.bourse.peaAngleAncienneteAns },
      confiance: 'fiable',
    });
  }

  for (const line of lines.filter((l) => !l.est_compte_especes && l.quantite != null && l.pru != null)) {
    const env = envelopes.find((e) => e.id === line.envelope_id);
    if (!env || env.type !== 'CTO') continue;

    const plusValue = line.valeur_actuelle - line.quantite! * line.pru!;
    findings.push({
      id: `bourse-angle-cto-${line.id}`,
      domaine: 'bourse',
      type: 'contexte',
      entity_id: line.entity_id,
      titre: `Plus-value latente CTO — ${line.libelle}`,
      detail: `Plus-value latente avant fiscalité (flat tax 30-31,4 % en cas de cession).`,
      chiffres: { plus_value_latente: plusValue, valeur_actuelle: line.valeur_actuelle, cout_acquisition: line.quantite! * line.pru! },
      confiance: 'fiable',
    });
  }

  return findings;
}

export function bourseFindings(_entities: EntityRow[]): Finding[] {
  const lines = db
    .prepare(
      `SELECT l.id, l.entity_id, l.envelope_id, l.libelle, l.valeur_actuelle, lb.quantite, lb.pru, lb.est_compte_especes
       FROM lines l JOIN line_bourse lb ON lb.line_id = l.id
       WHERE l.domaine = 'bourse'`
    )
    .all() as BourseLineRow[];

  const envelopes = db
    .prepare(
      `SELECT env.id, env.entity_id, env.libelle, eb.type, env.date_ouverture
       FROM envelopes env JOIN envelope_bourse eb ON eb.envelope_id = env.id
       WHERE env.domaine = 'bourse'`
    )
    .all() as BourseEnvelopeRow[];

  return [...concentrationParLigne(lines), ...cashDormant(lines, envelopes), ...angleFiscal(lines, envelopes)];
}
