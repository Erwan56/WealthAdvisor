// Règles Assurance-vie / PER (PRD §7.4, issue 17) — cap des 8 ans, seuil des 150 000 €
// de versements cumulés par assuré, plafond de déduction PER annuel.

import { db } from '../../db/client.js';
import { addMonths, deadlineStatus } from '../dates.js';
import { FISCAL } from '../fiscal-constants.js';
import { RULES } from '../rule-constants.js';
import type { EntityRow, Finding, ProfilRow } from '../types.js';

interface AvPerEnvelopeRow {
  id: number;
  entity_id: number;
  libelle: string;
  type: 'assurance_vie' | 'per';
  date_ouverture: string | null;
}

function capHuitAns(envelopes: AvPerEnvelopeRow[]): Finding[] {
  const findings: Finding[] = [];
  for (const env of envelopes.filter((e) => e.type === 'assurance_vie' && e.date_ouverture)) {
    const cap = addMonths(new Date(env.date_ouverture!), FISCAL.av.dureeCapAns.valeur * 12);
    const status = deadlineStatus(cap, RULES.avPer.capHuitAnsAlerteMoisAvant);
    if (!status) continue;

    findings.push({
      id: `avper-cap-8ans-${env.id}`,
      domaine: 'av_per',
      type: 'contexte',
      entity_id: env.entity_id,
      titre: `Cap des 8 ans ${status === 'imminent' ? 'imminent' : 'franchi'} — ${env.libelle}`,
      detail: `${status === 'imminent' ? 'Retarder un rachat au-delà de cette date' : 'Contrat désormais éligible au'} taux réduit sur la part IR (${FISCAL.av.tauxReduitApres8Ans.valeur * 100} % + abattement annuel, sous 150 000 € d'encours) plutôt que ${FISCAL.av.tauxPleinApres8AnsAuDela.valeur * 100} %.`,
      chiffres: {
        date_cap_8ans: cap.toISOString().slice(0, 10),
        taux_reduit_pct: FISCAL.av.tauxReduitApres8Ans.valeur * 100,
        taux_plein_pct: FISCAL.av.tauxPleinApres8AnsAuDela.valeur * 100,
        abattement_annuel_seul: FISCAL.av.abattementAnnuelSeul.valeur,
        abattement_annuel_couple: FISCAL.av.abattementAnnuelCouple.valeur,
      },
      confiance: 'fiable',
    });
  }
  return findings;
}

function seuil150k(envelopes: AvPerEnvelopeRow[]): Finding[] {
  const avEnvelopeIds = envelopes.filter((e) => e.type === 'assurance_vie').map((e) => e.id);
  if (avEnvelopeIds.length === 0) return [];

  const placeholders = avEnvelopeIds.map(() => '?').join(',');
  const total =
    (
      db
        .prepare(
          `SELECT COALESCE(SUM(m.montant), 0) AS total
           FROM mouvements m JOIN lines l ON l.id = m.line_id
           WHERE m.type = 'versement' AND l.envelope_id IN (${placeholders})`
        )
        .get(...avEnvelopeIds) as { total: number }
    ).total;

  const seuil = FISCAL.av.seuilVersementsAssure.valeur;
  const restant = seuil - total;
  if (restant > RULES.avPer.seuil150kMargeRestante) return [];

  return [
    {
      id: 'avper-seuil-150k',
      domaine: 'av_per',
      type: 'anomalie',
      entity_id: null,
      titre: 'Seuil des 150 000 € de versements AV proche',
      detail: `Tous contrats d'assurance-vie confondus, le cumul des versements approche le seuil qui fait basculer la part excédentaire du taux réduit (${FISCAL.av.tauxReduitApres8Ans.valeur * 100} %) au taux plein (${FISCAL.av.tauxPleinApres8AnsAuDela.valeur * 100} %) sur les contrats de 8 ans et plus.`,
      chiffres: { versements_cumules: total, seuil, restant },
      confiance: 'fiable',
    },
  ];
}

function plafondPer(envelopes: AvPerEnvelopeRow[], profil: ProfilRow): Finding[] {
  if (!profil.plafond_per_annuel) return [];
  const perEnvelopeIds = envelopes.filter((e) => e.type === 'per').map((e) => e.id);
  if (perEnvelopeIds.length === 0) return [];

  const anneeCourante = new Date().getFullYear().toString();
  const placeholders = perEnvelopeIds.map(() => '?').join(',');
  const total =
    (
      db
        .prepare(
          `SELECT COALESCE(SUM(m.montant), 0) AS total
           FROM mouvements m JOIN lines l ON l.id = m.line_id
           WHERE m.type = 'versement' AND l.envelope_id IN (${placeholders}) AND m.date LIKE ?`
        )
        .get(...perEnvelopeIds, `${anneeCourante}-%`) as { total: number }
    ).total;

  const pctUtilise = total / profil.plafond_per_annuel;
  if (pctUtilise < RULES.avPer.perPlafondSeuilPctUtilise) return [];

  return [
    {
      id: 'avper-plafond-per',
      domaine: 'av_per',
      type: 'anomalie',
      entity_id: null,
      titre: 'Plafond de déduction PER bientôt atteint',
      detail: `Versements PER ${anneeCourante} déjà à ${RULES.avPer.perPlafondSeuilPctUtilise * 100} % ou plus du plafond de déduction annuel saisi en Profil.`,
      chiffres: { versements_annee_courante: total, plafond_per_annuel: profil.plafond_per_annuel, pct_utilise: pctUtilise * 100 },
      confiance: 'fiable',
    },
  ];
}

export function avPerFindings(_entities: EntityRow[], profil: ProfilRow): Finding[] {
  const envelopes = db
    .prepare(
      `SELECT env.id, env.entity_id, env.libelle, ea.type, env.date_ouverture
       FROM envelopes env JOIN envelope_av_per ea ON ea.envelope_id = env.id
       WHERE env.domaine = 'av_per'`
    )
    .all() as AvPerEnvelopeRow[];

  return [...capHuitAns(envelopes), ...seuil150k(envelopes), ...plafondPer(envelopes, profil)];
}
