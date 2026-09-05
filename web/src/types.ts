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

export interface ImmobilierLine {
  id: number;
  entity_id: number;
  entity_libelle: string;
  entity_type: EntityType;
  libelle: string;
  valeur_actuelle: number;
  date_derniere_valorisation: string | null;
  note: string | null;
  prix_acquisition_total: number | null;
  date_acquisition: string | null;
  residence_principale: 0 | 1;
  regime_location: string | null;
  capital_restant_du: number | null;
  loyer: number | null;
  charges: number | null;
  taxe_fonciere: number | null;
  assurance: number | null;
  frais_gestion: number | null;
  mensualite: number | null;
  rendement_brut: number | null;
  rendement_net: number | null;
  cash_flow_mensuel: number | null;
  cash_flow_annuel: number | null;
}

export interface ImmobilierValorisation extends Valorisation {
  capital_restant_du: number | null;
  loyer: number | null;
  charges: number | null;
  taxe_fonciere: number | null;
  assurance: number | null;
  frais_gestion: number | null;
  mensualite: number | null;
}

export type AvPerEnvelopeType = 'assurance_vie' | 'per';
export const AV_PER_ENVELOPE_TYPES: AvPerEnvelopeType[] = ['assurance_vie', 'per'];
export type AvPerSupportType = 'fonds_euro' | 'uc';
export const AV_PER_SUPPORT_TYPES: AvPerSupportType[] = ['fonds_euro', 'uc'];

export interface AvPerLine {
  id: number;
  entity_id: number;
  envelope_id: number;
  libelle: string;
  valeur_actuelle: number;
  date_derniere_valorisation: string | null;
  note: string | null;
  nom_support: string | null;
  type_support: AvPerSupportType | null;
}

export interface AvPerEnvelope {
  id: number;
  entity_id: number;
  entity_libelle: string;
  entity_type: EntityType;
  libelle: string;
  type: AvPerEnvelopeType;
  date_ouverture: string | null;
  statut: string | null;
  valeur_totale: number;
  lines: AvPerLine[];
}

export interface CryptoLine {
  id: number;
  entity_id: number;
  envelope_id: number;
  libelle: string;
  valeur_actuelle: number;
  date_derniere_valorisation: string | null;
  note: string | null;
  symbole: string | null;
  quantite: number | null;
}

export interface CryptoEnvelope {
  id: number;
  entity_id: number;
  entity_libelle: string;
  entity_type: EntityType;
  libelle: string;
  date_ouverture: string | null;
  statut: string | null;
  plateforme_etrangere: 0 | 1;
  prix_acquisition_cumule: number | null;
  valeur_totale: number;
  lines: CryptoLine[];
}

export type PeScpiDispositif = 'FCPR' | 'FIP' | 'FCPI' | 'SCPI';
export const PE_SCPI_DISPOSITIFS: PeScpiDispositif[] = ['FCPR', 'FIP', 'FCPI', 'SCPI'];

export interface PeScpiLine {
  id: number;
  entity_id: number;
  envelope_id: number;
  libelle: string;
  valeur_actuelle: number;
  date_derniere_valorisation: string | null;
  note: string | null;
  nombre_parts: number | null;
}

export interface PeScpiEnvelope {
  id: number;
  entity_id: number;
  entity_libelle: string;
  entity_type: EntityType;
  libelle: string;
  type_dispositif: PeScpiDispositif;
  duree_blocage: number | null;
  date_ouverture: string | null;
  statut: string | null;
  valeur_totale: number;
  lines: PeScpiLine[];
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
