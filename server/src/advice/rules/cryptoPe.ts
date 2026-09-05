// Règles Crypto & Private equity/SCPI (PRD §7.5, issue 18) — exposition par Profil de
// risque (crypto), exposition plate (PE/SCPI), échéance de blocage (PE/SCPI).

import { db } from '../../db/client.js';
import { lineIdsForDomain } from '../../db/scope.js';
import { buildValueSeries, latestValue } from '../../db/timeseries.js';
import { addMonths, deadlineStatus } from '../dates.js';
import { RULES } from '../rule-constants.js';
import type { EntityRow, Finding, ProfilRow } from '../types.js';

interface PeScpiEnvelopeRow {
  id: number;
  entity_id: number;
  libelle: string;
  date_ouverture: string | null;
  duree_blocage: number | null;
}

function expositionCrypto(patrimoineNet: number, profil: ProfilRow): Finding[] {
  if (patrimoineNet <= 0 || !profil.risque_bucket) return [];

  const lineIds = lineIdsForDomain('all', 'crypto');
  const total = latestValue(buildValueSeries(lineIds, { net: false }));
  if (total <= 0) return [];

  const pct = total / patrimoineNet;
  const seuil = RULES.cryptoPe.cryptoExpositionSeuilParBucket[profil.risque_bucket];
  if (pct <= seuil) return [];

  return [
    {
      id: 'crypto-exposition',
      domaine: 'crypto',
      type: 'anomalie',
      entity_id: null,
      titre: 'Exposition crypto au-delà du repère du Profil de risque',
      detail: `Repère indicatif (pas une norme sourcée ferme) pour un profil ${profil.risque_bucket} : au-delà de ${seuil * 100} % du Patrimoine net total.`,
      chiffres: { valeur_crypto: total, patrimoine_net_total: patrimoineNet, part_pct: pct * 100, seuil_pct: seuil * 100, bucket: profil.risque_bucket },
      confiance: 'fiable',
    },
  ];
}

function expositionPeScpi(patrimoineNet: number): Finding[] {
  if (patrimoineNet <= 0) return [];
  const lineIds = lineIdsForDomain('all', 'pe_scpi');
  const total = latestValue(buildValueSeries(lineIds, { net: false }));
  if (total <= 0) return [];

  const pct = total / patrimoineNet;
  if (pct <= RULES.cryptoPe.peScpiExpositionSeuilPct) return [];

  return [
    {
      id: 'pe-scpi-exposition',
      domaine: 'pe_scpi',
      type: 'anomalie',
      entity_id: null,
      titre: 'Exposition Private equity/SCPI au-delà du repère',
      detail: `Seuil plat de ${RULES.cryptoPe.peScpiExpositionSeuilPct * 100} % du Patrimoine net total, non modulé par le Profil de risque (pas de grille sourcée par bucket pour ce domaine) — jugement de conception, ton hedged.`,
      chiffres: { valeur_pe_scpi: total, patrimoine_net_total: patrimoineNet, part_pct: pct * 100, seuil_pct: RULES.cryptoPe.peScpiExpositionSeuilPct * 100 },
      confiance: 'fiable',
    },
  ];
}

function echeanceBlocage(envelopes: PeScpiEnvelopeRow[]): Finding[] {
  const findings: Finding[] = [];
  for (const env of envelopes.filter((e) => e.date_ouverture && e.duree_blocage != null)) {
    const echeance = addMonths(new Date(env.date_ouverture!), Math.round(env.duree_blocage! * 12));
    const status = deadlineStatus(echeance, RULES.cryptoPe.peScpiBlocageAlerteMoisAvant);
    if (!status) continue;

    findings.push({
      id: `pe-scpi-blocage-${env.id}`,
      domaine: 'pe_scpi',
      type: 'contexte',
      entity_id: env.entity_id,
      titre: `Échéance de blocage ${status === 'imminent' ? 'proche' : 'franchie'} — ${env.libelle}`,
      detail: `Durée de blocage renseignée pour cette Enveloppe (${env.duree_blocage} an${env.duree_blocage! >= 2 ? 's' : ''}).`,
      chiffres: { date_echeance: echeance.toISOString().slice(0, 10), duree_blocage_ans: env.duree_blocage },
      confiance: 'fiable',
    });
  }
  return findings;
}

export function cryptoPeFindings(_entities: EntityRow[], profil: ProfilRow): Finding[] {
  const patrimoineNet = latestValue(buildValueSeries(lineIdsForDomain('all'), { net: true }));

  const envelopes = db
    .prepare(
      `SELECT env.id, env.entity_id, env.libelle, env.date_ouverture, epc.duree_blocage
       FROM envelopes env JOIN envelope_pe_scpi epc ON epc.envelope_id = env.id
       WHERE env.domaine = 'pe_scpi'`
    )
    .all() as PeScpiEnvelopeRow[];

  return [...expositionCrypto(patrimoineNet, profil), ...expositionPeScpi(patrimoineNet), ...echeanceBlocage(envelopes)];
}
