// Règles Immobilier (PRD §7.3, issue 16) — rentabilité anormale, prêt bientôt soldé
// (déclencheur de l'angle vendre/garder), proximité du seuil IFI.

import { db } from '../../db/client.js';
import { deadlineStatus, yearsBetween } from '../dates.js';
import { FISCAL } from '../fiscal-constants.js';
import { RULES } from '../rule-constants.js';
import type { EntityRow, Finding } from '../types.js';

interface ImmobilierLineRow {
  id: number;
  entity_id: number;
  libelle: string;
  valeur_actuelle: number;
  prix_acquisition_total: number | null;
  date_acquisition: string | null;
  residence_principale: 0 | 1;
  capital_restant_du: number | null;
  loyer: number | null;
  charges: number | null;
  taxe_fonciere: number | null;
  assurance: number | null;
  frais_gestion: number | null;
  mensualite: number | null;
}

function currentLines(): ImmobilierLineRow[] {
  return db
    .prepare(
      `SELECT
        l.id, l.entity_id, l.libelle, l.valeur_actuelle,
        li.prix_acquisition_total, li.date_acquisition, li.residence_principale,
        vi.capital_restant_du, vi.loyer, vi.charges, vi.taxe_fonciere, vi.assurance, vi.frais_gestion, vi.mensualite
       FROM lines l
       JOIN line_immobilier li ON li.line_id = l.id
       LEFT JOIN valorisations lv ON lv.id = (SELECT v.id FROM valorisations v WHERE v.line_id = l.id ORDER BY v.date DESC, v.id DESC LIMIT 1)
       LEFT JOIN valorisation_immobilier vi ON vi.valorisation_id = lv.id
       WHERE l.domaine = 'immobilier'`
    )
    .all() as ImmobilierLineRow[];
}

// Convention (server/src/routes/immobilier.ts `withDerived`) : loyer/charges/assurance/
// frais_gestion/mensualité sont mensuels, taxe foncière est annuelle.
function rendementNet(row: ImmobilierLineRow): number | null {
  if (row.loyer == null || !row.prix_acquisition_total) return null;
  const loyerAnnuel = row.loyer * 12;
  const chargesAnnuelles =
    (row.charges ?? 0) * 12 + (row.taxe_fonciere ?? 0) + (row.assurance ?? 0) * 12 + (row.frais_gestion ?? 0) * 12;
  return ((loyerAnnuel - chargesAnnuelles) / row.prix_acquisition_total) * 100;
}

function cashFlowMensuel(row: ImmobilierLineRow): number | null {
  if (row.loyer == null) return null;
  return (
    row.loyer -
    (row.charges ?? 0) -
    (row.taxe_fonciere ?? 0) / 12 -
    (row.assurance ?? 0) -
    (row.frais_gestion ?? 0) -
    (row.mensualite ?? 0)
  );
}

function rentabiliteAnormale(rows: ImmobilierLineRow[]): Finding[] {
  const findings: Finding[] = [];
  for (const row of rows.filter((r) => r.loyer != null)) {
    const net = rendementNet(row);
    const cashFlow = cashFlowMensuel(row);
    if (net == null || cashFlow == null) continue;

    const rendementBas = net < RULES.immobilier.rendementNetAnormalSeuilPct * 100;
    const cashFlowNegatif = cashFlow < 0;
    if (!rendementBas && !cashFlowNegatif) continue;

    findings.push({
      id: `immobilier-rentabilite-${row.id}`,
      domaine: 'immobilier',
      type: 'anomalie',
      entity_id: row.entity_id,
      titre: `Rentabilité anormale — ${row.libelle}`,
      detail: [
        rendementBas ? `Rendement net de charges < ${RULES.immobilier.rendementNetAnormalSeuilPct * 100} %` : null,
        cashFlowNegatif ? 'Cash-flow mensuel négatif' : null,
      ]
        .filter(Boolean)
        .join(' — '),
      chiffres: { rendement_net_pct: net, cash_flow_mensuel: cashFlow, seuil_rendement_pct: RULES.immobilier.rendementNetAnormalSeuilPct * 100 },
      confiance: 'fiable',
    });
  }
  return findings;
}

// Projection de la date de fin de prêt par tendance linéaire du capital restant dû
// (même esprit que linearTrendEstimate pour les Objectifs — ticket 26 — mais série
// décroissante vers 0 plutôt que croissante vers une cible).
function estimateLoanPayoffDate(lineId: number): Date | null {
  const rows = db
    .prepare(
      `SELECT v.date, vi.capital_restant_du
       FROM valorisations v JOIN valorisation_immobilier vi ON vi.valorisation_id = v.id
       WHERE v.line_id = ? AND vi.capital_restant_du IS NOT NULL
       ORDER BY v.date ASC, v.id ASC`
    )
    .all(lineId) as { date: string; capital_restant_du: number }[];

  if (rows.length < 2) return null;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const days = (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86_400_000;
  if (days <= 0) return null;

  const ratePerDay = (last.capital_restant_du - first.capital_restant_du) / days;
  if (last.capital_restant_du <= 0) return new Date(last.date);
  if (ratePerDay >= 0) return null; // capital ne décroît pas : pas de projection fiable

  const daysNeeded = -last.capital_restant_du / ratePerDay;
  return new Date(new Date(last.date).getTime() + daysNeeded * 86_400_000);
}

function pretBientotSolde(rows: ImmobilierLineRow[]): Finding[] {
  const findings: Finding[] = [];
  for (const row of rows.filter((r) => r.capital_restant_du != null && r.capital_restant_du > 0)) {
    const payoff = estimateLoanPayoffDate(row.id);
    if (!payoff) continue;
    const status = deadlineStatus(payoff, RULES.immobilier.pretSoldeAlerteMoisAvant);
    if (!status) continue;

    const net = rendementNet(row);
    const cashFlow = cashFlowMensuel(row);
    const cashFlowPostPret = cashFlow != null ? cashFlow + (row.mensualite ?? 0) : null;
    const anciennete = row.date_acquisition ? yearsBetween(new Date(row.date_acquisition), new Date()) : null;
    const plusValueLatente =
      !row.residence_principale && row.prix_acquisition_total != null
        ? row.valeur_actuelle - row.prix_acquisition_total
        : null;

    findings.push({
      id: `immobilier-pret-solde-${row.id}`,
      domaine: 'immobilier',
      type: 'contexte',
      entity_id: row.entity_id,
      titre: `Prêt ${status === 'imminent' ? 'bientôt soldé' : 'soldé'} — ${row.libelle}`,
      detail: `Échéance estimée du prêt (projection linéaire du capital restant dû). Point d'entrée pour l'angle vendre/garder.`,
      chiffres: {
        echeance_estimee: payoff.toISOString().slice(0, 10),
        rendement_net_pct: net,
        cash_flow_mensuel_courant: cashFlow,
        cash_flow_mensuel_post_pret: cashFlowPostPret,
        plus_value_latente: plusValueLatente,
        anciennete_detention_ans: anciennete,
        residence_principale: row.residence_principale ? 'oui' : 'non',
      },
      confiance: 'fiable',
    });
  }
  return findings;
}

function seuilIfi(rows: ImmobilierLineRow[]): Finding[] {
  let netTotal = 0;
  for (const row of rows) {
    const brut = row.valeur_actuelle - (row.capital_restant_du ?? 0);
    netTotal += row.residence_principale ? brut * (1 - FISCAL.immobilier.ifiAbattementResidencePrincipale.valeur) : brut;
  }
  if (netTotal <= 0) return [];

  const seuil = FISCAL.immobilier.ifiSeuilAssujettissement.valeur;
  const ratio = netTotal / seuil;
  // Contexte permanent (pas seulement au franchissement) tant qu'on approche/dépasse le seuil :
  // pas de convention de "distance" sourcée, on retient une marge de 10 % avant le seuil.
  if (ratio < 0.9) return [];

  return [
    {
      id: 'immobilier-seuil-ifi',
      domaine: 'transverse',
      type: 'anomalie',
      entity_id: null,
      titre: 'Proximité du seuil IFI',
      detail: `Total immobilier net (toutes Entités, résidence principale abattue de 30 %) ${ratio >= 1 ? 'dépasse' : 'approche'} le seuil d'assujettissement à l'IFI. Calcul simplifié : ignore usufruit, biens professionnels exonérés, autres dettes déductibles et parts de SCPI.`,
      chiffres: { total_immobilier_net: netTotal, seuil_ifi: seuil, ratio_pct: ratio * 100 },
      confiance: FISCAL.immobilier.ifiSeuilAssujettissement.confiance,
    },
  ];
}

export function immobilierFindings(_entities: EntityRow[]): Finding[] {
  const rows = currentLines();
  return [...rentabiliteAnormale(rows), ...pretBientotSolde(rows), ...seuilIfi(rows)];
}
