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
  isin: string | null;
  quantite: number | null;
  cout_acquisition_unitaire: number | null;
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

// ---------------------------------------------------------------------
// Reporting (ticket 2 — PRD §5.3)
// ---------------------------------------------------------------------
export interface Point {
  date: string;
  value: number;
}

export interface Indicateur {
  label: string;
  value: string;
}

export interface ReportingDomainSummary {
  domaine: string;
  valeur: number;
  part: number;
  variation: number | null;
  sparkline: Point[];
  indicateur_cle: Indicateur | null;
}

export interface ReportingSummary {
  patrimoine_total: number;
  patrimoine_net: number;
  nombre_entites: number;
  domains: ReportingDomainSummary[];
}

export interface ReportingDomainItem {
  id: number;
  libelle: string;
  entity_libelle: string;
  valeur: number;
  delta: number | null;
}

export interface ReportingDomainDetail {
  domaine: string;
  curve: Point[];
  indicateur_cle: Indicateur | null;
  items: ReportingDomainItem[];
}

// ---------------------------------------------------------------------
// Profil & Questionnaire de risque (ticket 2 — PRD §5.4)
// ---------------------------------------------------------------------
export type RisqueBucket = 'prudent' | 'equilibre' | 'dynamique';
export type RisqueConnaissance = 'novice' | 'initie' | 'expert';

export interface Profil {
  id: 1;
  date_naissance: string | null;
  horizon_global: string | null;
  tmi: number | null;
  plafond_per_annuel: number | null;
  depenses_mensuelles_courantes: number | null;
  mois_reserve_visees: number;
  statut_marital: string | null;
  personnes_a_charge: number | null;
  risque_bucket: RisqueBucket | null;
  risque_connaissance: RisqueConnaissance | null;
  risque_override_manuel: 0 | 1;
}

export interface QuestionnaireQuestion {
  index: number;
  title: string;
  options: { value: string; label: string }[];
}

export const RISQUE_BUCKET_LABELS: Record<RisqueBucket, string> = {
  prudent: 'Prudent',
  equilibre: 'Équilibré',
  dynamique: 'Dynamique',
};

export const RISQUE_CONNAISSANCE_LABELS: Record<RisqueConnaissance, string> = {
  novice: 'Novice',
  initie: 'Initié',
  expert: 'Expert',
};

// ---------------------------------------------------------------------
// Objectifs (ticket 2 — PRD §5.5)
// ---------------------------------------------------------------------
export type ObjectifType =
  | 'retraite'
  | 'achat_immobilier'
  | 'transmission'
  | 'securite_urgence'
  | 'independance_financiere'
  | 'projet_libre';

export const OBJECTIF_TYPE_LABELS: Record<ObjectifType, string> = {
  retraite: 'Retraite',
  achat_immobilier: 'Achat immobilier',
  transmission: 'Transmission',
  securite_urgence: 'Sécurité / urgence',
  independance_financiere: 'Indépendance financière',
  projet_libre: 'Projet libre',
};

export type LienPatrimoineType = 'total' | 'domaines' | 'entite';
export type EstimationStatus = 'ok' | 'insufficient' | 'flat_or_negative' | 'no_lien' | 'no_target';

export interface Objectif {
  id: number;
  type: ObjectifType;
  libelle: string;
  horizon: string | null;
  montant_cible: number | null;
  lien_patrimoine_type: LienPatrimoineType | null;
  lien_domaines: string[] | null;
  lien_entite_id: number | null;
  montant_actuel: number | null;
  avancee_pct: number | null;
  estimation_date: string | null;
  estimation_status: EstimationStatus;
}

export const OBJECTIF_TEMPLATES: { key: string; type: ObjectifType; libelle: string }[] = [
  { key: 'fonds_urgence', type: 'securite_urgence', libelle: "Fonds d'urgence" },
  { key: 'retraite', type: 'retraite', libelle: 'Retraite' },
  { key: 'achat_immobilier', type: 'achat_immobilier', libelle: 'Achat immobilier' },
  { key: 'transmission', type: 'transmission', libelle: 'Transmission' },
  { key: 'independance_financiere', type: 'independance_financiere', libelle: 'Indépendance financière' },
];

// Multiplicateur FIRE figé — règle des 4 % (Trinity/Bengen), non ajustable (ticket 12).
export const FIRE_MULTIPLIER = 25;

export const DOMAIN_LABELS: Record<string, string> = {
  liquidites: 'Liquidités',
  bourse: 'Bourse',
  immobilier: 'Immobilier',
  av_per: 'Assurance-vie / PER',
  crypto: 'Crypto',
  pe_scpi: 'Private equity / SCPI',
};

export const DOMAIN_KEYS = Object.keys(DOMAIN_LABELS);

// CSS custom properties (defined in styles.css, light + dark) — one hue per
// Domaine, shared by the Reporting donut, sparklines and legends.
export const DOMAIN_COLOR_VARS: Record<string, string> = {
  liquidites: 'var(--dom-liquidites)',
  bourse: 'var(--dom-bourse)',
  immobilier: 'var(--dom-immobilier)',
  av_per: 'var(--dom-av_per)',
  crypto: 'var(--dom-crypto)',
  pe_scpi: 'var(--dom-pe_scpi)',
};

// ---------------------------------------------------------------------
// Moteur de conseil hybride & chat (ticket 3 déterministe + ticket 4 LLM — PRD §6-§8)
// ---------------------------------------------------------------------
export type Confiance = 'fiable' | 'a_verifier';
export type FindingType = 'anomalie' | 'contexte';
export type FindingDomaine = 'liquidites' | 'bourse' | 'immobilier' | 'av_per' | 'crypto' | 'pe_scpi' | 'transverse';

export interface Finding {
  id: string;
  domaine: FindingDomaine;
  type: FindingType;
  entity_id: number | null;
  titre: string;
  detail: string;
  chiffres: Record<string, number | string | null>;
  confiance: Confiance;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface OverrideProposal {
  bucket: RisqueBucket;
  connaissance: RisqueConnaissance | null;
  raison: string;
}

export interface ChatResponse {
  reponse: string;
  reserves: string[];
  override_propose: OverrideProposal | null;
  alerte_chiffres: number[];
}
