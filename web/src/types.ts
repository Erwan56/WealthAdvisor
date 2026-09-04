export type EntityType = 'personnelle' | 'activite_service' | 'detention_immobiliere';

export interface Entity {
  id: number;
  libelle: string;
  type: EntityType;
  locked: 0 | 1;
  charges_fixes_professionnelles: number | null;
}

export interface LiquiditeLine {
  id: number;
  entity_id: number;
  entity_libelle: string;
  entity_type: EntityType;
  libelle: string;
  valeur_actuelle: number;
  date_derniere_valorisation: string | null;
  note: string | null;
  type_compte: string | null;
  plafond: number | null;
  taux: number | null;
  banque: string | null;
  reserve_pour_line_id: number | null;
}

export interface Valorisation {
  id: number;
  date: string;
  valeur: number;
}

export const DOMAIN_LABELS: Record<string, string> = {
  liquidites: 'Liquidités',
  bourse: 'Bourse',
  immobilier: 'Immobilier',
  av_per: 'Assurance-vie / PER',
  crypto: 'Crypto',
  pe_scpi: 'Private equity / SCPI',
};

export const DOMAIN_KEYS = Object.keys(DOMAIN_LABELS);
