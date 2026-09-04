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

export type BourseEnvelopeType = 'PEA' | 'PEA-PME' | 'CTO';

export const BOURSE_ENVELOPE_TYPES: BourseEnvelopeType[] = ['PEA', 'PEA-PME', 'CTO'];

export interface BourseLine {
  id: number;
  entity_id: number;
  envelope_id: number;
  libelle: string;
  valeur_actuelle: number;
  date_derniere_valorisation: string | null;
  note: string | null;
  nom_isin: string | null;
  quantite: number | null;
  pru: number | null;
  est_compte_especes: 0 | 1;
}

export interface BourseEnvelope {
  id: number;
  entity_id: number;
  entity_libelle: string;
  entity_type: EntityType;
  libelle: string;
  type: BourseEnvelopeType;
  date_ouverture: string | null;
  statut: string | null;
  valeur_totale: number;
  lines: BourseLine[];
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
