// Moteur de conseil hybride — couche déterministe (PRD §6-§8, ticket 3).
//
// Garde-fou numérique : chaque Finding porte déjà tous les chiffres nécessaires
// dans `chiffres` — le LLM (ticket 4) ne recalcule jamais, il cite ces valeurs.

export type Confiance = 'fiable' | 'a_verifier';

export type FindingType =
  | 'anomalie' // seuil déterministe franchi, actionnable
  | 'contexte'; // angle informatif toujours transmis (ex. fiscal PEA/CTO), pas un seuil

export type FindingDomaine = 'liquidites' | 'bourse' | 'immobilier' | 'av_per' | 'crypto' | 'pe_scpi' | 'transverse';

export interface Finding {
  id: string;
  domaine: FindingDomaine;
  type: FindingType;
  // null = résultat transverse (toutes Entités confondues), pas rattachable à une seule Entité.
  entity_id: number | null;
  titre: string;
  detail: string;
  chiffres: Record<string, number | string | null>;
  confiance: Confiance;
}

export interface EntityRow {
  id: number;
  libelle: string;
  type: 'personnelle' | 'activite_service' | 'detention_immobiliere';
  charges_fixes_professionnelles: number | null;
  locked: 0 | 1;
}

export interface ProfilRow {
  id: 1;
  date_naissance: string | null;
  horizon_global: string | null;
  tmi: number | null;
  plafond_per_annuel: number | null;
  depenses_mensuelles_courantes: number | null;
  mois_reserve_visees: number;
  statut_marital: string | null;
  personnes_a_charge: number | null;
  risque_bucket: 'prudent' | 'equilibre' | 'dynamique' | null;
  risque_connaissance: 'novice' | 'initie' | 'expert' | null;
  risque_override_manuel: 0 | 1;
}
