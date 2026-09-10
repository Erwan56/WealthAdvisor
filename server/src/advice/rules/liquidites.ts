// Règles Liquidités (PRD §7.1, issues 14/25/13) — 3 règles socle + réserve de précaution
// immobilier (transverse liquidités↔immobilier).

import { db } from '../../db/client.js';
import { RULES } from '../rule-constants.js';
import type { EntityRow, Finding, ProfilRow } from '../types.js';

interface LiquiditeLineRow {
  id: number;
  entity_id: number;
  libelle: string;
  valeur_actuelle: number;
  taux: number | null;
  reserve_pour_line_id: number | null;
}

// Rémunéré/non-rémunéré se lit sur `taux` (`taux > 0` ⇒ rémunéré), indépendamment du
// libellé du Type de compte choisi — remplace l'ancienne inférence fragile par regex sur
// le texte libre du champ (refonte-saisie-patrimoine, ticket 04). Un compte courant est
// non-rémunéré ; un livret personnel est rémunéré — seules ces deux natures existent dans
// le domaine Liquidités, PRD §2.1.
function estRemunere(taux: number | null): boolean {
  return !!taux && taux > 0;
}

function liquiditesLines(): LiquiditeLineRow[] {
  return db
    .prepare(
      `SELECT l.id, l.entity_id, l.libelle, l.valeur_actuelle, ll.taux, ll.reserve_pour_line_id
       FROM lines l JOIN line_liquidites ll ON ll.line_id = l.id
       WHERE l.domaine = 'liquidites'`
    )
    .all() as LiquiditeLineRow[];
}

function ruleA(lines: LiquiditeLineRow[], entities: Map<number, EntityRow>, profil: ProfilRow): Finding[] {
  if (!profil.depenses_mensuelles_courantes) return [];
  const seuil = profil.depenses_mensuelles_courantes * (1 + RULES.liquidites.compteCourantMargeSecurite);

  return lines
    .filter((l) => entities.get(l.entity_id)?.type === 'personnelle' && !estRemunere(l.taux))
    .filter((l) => l.valeur_actuelle > seuil)
    .map((l) => ({
      id: `liquidites-compte-dormant-${l.id}`,
      domaine: 'liquidites',
      type: 'anomalie',
      entity_id: l.entity_id,
      titre: `Compte courant dormant — ${l.libelle}`,
      detail: `Le solde dépasse le seuil d'1 mois de dépenses + 15 % de marge. Surplus transférable vers un livret, un compte-titres, un contrat, un portefeuille ou un fonds existant.`,
      chiffres: {
        solde: l.valeur_actuelle,
        seuil,
        surplus: l.valeur_actuelle - seuil,
        depenses_mensuelles: profil.depenses_mensuelles_courantes,
      },
      confiance: 'fiable',
    }));
}

function ruleB(lines: LiquiditeLineRow[], entities: Map<number, EntityRow>, profil: ProfilRow): Finding[] {
  if (!profil.depenses_mensuelles_courantes) return [];
  const livretsPerso = lines.filter(
    (l) => entities.get(l.entity_id)?.type === 'personnelle' && estRemunere(l.taux)
  );
  if (livretsPerso.length === 0) return [];

  const total = livretsPerso.reduce((s, l) => s + l.valeur_actuelle, 0);
  const cible = profil.mois_reserve_visees * profil.depenses_mensuelles_courantes;
  if (total <= cible) return [];

  return [
    {
      id: 'liquidites-fonds-precaution',
      domaine: 'liquidites',
      type: 'anomalie',
      entity_id: null,
      titre: 'Fonds de précaution au-delà de la cible',
      detail: `Le total des livrets personnels dépasse la cible de ${profil.mois_reserve_visees} mois de dépenses. Surplus investissable ailleurs (un compte-titres, un contrat, un portefeuille ou un fonds existant).`,
      chiffres: { total_livrets: total, cible, surplus: total - cible, mois_reserve_visees: profil.mois_reserve_visees },
      confiance: 'fiable',
    },
  ];
}

function ruleC(lines: LiquiditeLineRow[], entities: EntityRow[]): Finding[] {
  const findings: Finding[] = [];
  for (const entity of entities.filter((e) => e.type === 'activite_service')) {
    if (!entity.charges_fixes_professionnelles) continue;
    const total = lines.filter((l) => l.entity_id === entity.id).reduce((s, l) => s + l.valeur_actuelle, 0);
    const seuil = RULES.liquidites.tresorerieProMoisCharges * entity.charges_fixes_professionnelles;
    if (total <= seuil) continue;

    findings.push({
      id: `liquidites-tresorerie-pro-${entity.id}`,
      domaine: 'liquidites',
      type: 'anomalie',
      entity_id: entity.id,
      titre: `Trésorerie professionnelle dormante — ${entity.libelle}`,
      detail: `La trésorerie de l'Entité dépasse ${RULES.liquidites.tresorerieProMoisCharges} mois de charges fixes professionnelles. Provisions fiscales/sociales non modélisées — le surplus réel peut être moindre.`,
      chiffres: {
        tresorerie: total,
        seuil,
        surplus: total - seuil,
        charges_fixes_professionnelles: entity.charges_fixes_professionnelles,
      },
      confiance: 'fiable',
    });
  }
  return findings;
}

function reserveImmobilier(lines: LiquiditeLineRow[]): Finding[] {
  const findings: Finding[] = [];
  for (const line of lines.filter((l) => l.reserve_pour_line_id != null)) {
    const bien = db
      .prepare("SELECT id, libelle, valeur_actuelle FROM lines WHERE id = ? AND domaine = 'immobilier'")
      .get(line.reserve_pour_line_id!) as { id: number; libelle: string; valeur_actuelle: number } | undefined;
    if (!bien) continue;

    const cible = bien.valeur_actuelle * RULES.liquidites.reserveImmobilierPctDefaut;
    const surplus = line.valeur_actuelle - cible;
    if (surplus <= 0) continue;

    findings.push({
      id: `liquidites-reserve-immobilier-${line.id}`,
      domaine: 'liquidites',
      type: 'contexte',
      entity_id: line.entity_id,
      titre: `Surplus investissable sur la réserve — ${line.libelle}`,
      detail: `Réserve dédiée au bien « ${bien.libelle} » : au-delà de la cible par défaut (${RULES.liquidites.reserveImmobilierPctDefaut * 100} % de la valeur du bien/an), le surplus peut être orienté vers un livret, un compte-titres, un contrat, un portefeuille ou un fonds existant — sous réserve de disponibilité rapide.`,
      chiffres: {
        solde_reserve: line.valeur_actuelle,
        cible,
        surplus,
        valeur_bien: bien.valeur_actuelle,
        pct_cible: RULES.liquidites.reserveImmobilierPctDefaut,
      },
      confiance: 'fiable',
    });
  }
  return findings;
}

export function liquiditesFindings(entities: EntityRow[], profil: ProfilRow): Finding[] {
  const lines = liquiditesLines();
  const entityById = new Map(entities.map((e) => [e.id, e]));
  return [
    ...ruleA(lines, entityById, profil),
    ...ruleB(lines, entityById, profil),
    ...ruleC(lines, entities),
    ...reserveImmobilier(lines),
  ];
}
