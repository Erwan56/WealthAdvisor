import type {
  AvPerEnvelope,
  AvPerEnvelopeType,
  AvPerLine,
  AvPerSupportType,
  BourseEnvelope,
  BourseEnvelopeType,
  BourseLine,
  ChatMessage,
  ChatResponse,
  CryptoEnvelope,
  CryptoLine,
  Entity,
  EntityType,
  Finding,
  ImmobilierLine,
  ImmobilierValorisation,
  LienPatrimoineType,
  LiquiditeLine,
  Objectif,
  ObjectifType,
  PeScpiDispositif,
  PeScpiEnvelope,
  PeScpiLine,
  Profil,
  QuestionnaireQuestion,
  ReferenceListItem,
  ReportingDomainDetail,
  ReportingSummary,
  RisqueBucket,
  RisqueConnaissance,
  Valorisation,
} from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erreur ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  entities: {
    list: () => request<Entity[]>('/entities'),
    create: (data: { libelle: string; type: EntityType; charges_fixes_professionnelles?: number }) =>
      request<Entity>('/entities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { libelle: string; type: EntityType; charges_fixes_professionnelles?: number | null }) =>
      request<Entity>(`/entities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/entities/${id}`, { method: 'DELETE' }),
  },
  banques: {
    list: () => request<ReferenceListItem[]>('/banques'),
    create: (libelle: string) => request<ReferenceListItem>('/banques', { method: 'POST', body: JSON.stringify({ libelle }) }),
    update: (id: number, libelle: string) =>
      request<ReferenceListItem>(`/banques/${id}`, { method: 'PUT', body: JSON.stringify({ libelle }) }),
    delete: (id: number) => request<void>(`/banques/${id}`, { method: 'DELETE' }),
  },
  typesCompte: {
    list: () => request<ReferenceListItem[]>('/types-compte-liquidites'),
    create: (libelle: string) =>
      request<ReferenceListItem>('/types-compte-liquidites', { method: 'POST', body: JSON.stringify({ libelle }) }),
    update: (id: number, libelle: string) =>
      request<ReferenceListItem>(`/types-compte-liquidites/${id}`, { method: 'PUT', body: JSON.stringify({ libelle }) }),
    delete: (id: number) => request<void>(`/types-compte-liquidites/${id}`, { method: 'DELETE' }),
  },
  liquidites: {
    listLines: (entityId: number | 'all') =>
      request<LiquiditeLine[]>(`/liquidites/lines?entity_id=${entityId}`),
    createLine: (data: {
      entity_id: number;
      libelle: string;
      type_compte?: string;
      plafond?: number;
      taux?: number;
      banque?: string;
      reserve_pour_line_id?: number | null;
      valeur_initiale: number;
      date: string;
    }) => request<LiquiditeLine>('/liquidites/lines', { method: 'POST', body: JSON.stringify(data) }),
    updateLine: (id: number, data: Partial<LiquiditeLine>) =>
      request<LiquiditeLine>(`/liquidites/lines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteLine: (id: number) => request<void>(`/liquidites/lines/${id}`, { method: 'DELETE' }),
    listValorisations: (lineId: number) => request<Valorisation[]>(`/liquidites/lines/${lineId}/valorisations`),
    addValorisation: (lineId: number, data: { date: string; valeur: number }) =>
      request<Valorisation>(`/liquidites/lines/${lineId}/valorisations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateValorisation: (id: number, data: { date?: string; valeur?: number }) =>
      request<Valorisation>(`/liquidites/valorisations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteValorisation: (id: number) => request<void>(`/liquidites/valorisations/${id}`, { method: 'DELETE' }),
  },
  bourse: {
    listEnvelopes: (entityId: number | 'all') =>
      request<BourseEnvelope[]>(`/bourse/envelopes?entity_id=${entityId}`),
    createEnvelope: (data: {
      entity_id: number;
      libelle: string;
      type: BourseEnvelopeType;
      date_ouverture?: string;
      statut?: string;
    }) => request<BourseEnvelope>('/bourse/envelopes', { method: 'POST', body: JSON.stringify(data) }),
    updateEnvelope: (
      id: number,
      data: Partial<Pick<BourseEnvelope, 'libelle' | 'type' | 'date_ouverture' | 'statut'>>
    ) => request<BourseEnvelope>(`/bourse/envelopes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEnvelope: (id: number) => request<void>(`/bourse/envelopes/${id}`, { method: 'DELETE' }),
    createLine: (
      envelopeId: number,
      data: {
        libelle: string;
        isin?: string;
        quantite?: number;
        cout_acquisition_unitaire: number;
        date_achat: string;
      }
    ) => request<BourseLine>(`/bourse/envelopes/${envelopeId}/lines`, { method: 'POST', body: JSON.stringify(data) }),
    updateLine: (
      id: number,
      data: Partial<
        Pick<BourseLine, 'libelle' | 'note' | 'isin' | 'quantite' | 'cout_acquisition_unitaire' | 'date_achat'>
      >
    ) => request<BourseLine>(`/bourse/lines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteLine: (id: number) => request<void>(`/bourse/lines/${id}`, { method: 'DELETE' }),
    refreshCours: (entityId: number | 'all') =>
      request<{
        rafraichies: { line_id: number; valeur: number; date: string }[];
        echecs: { line_id: number; reason: 'isin_non_trouve' | 'devise_non_convertible' | 'source_indisponible' }[];
      }>('/bourse/lines/refresh-cours', { method: 'POST', body: JSON.stringify({ entity_id: entityId }) }),
    listValorisations: (lineId: number) => request<Valorisation[]>(`/bourse/lines/${lineId}/valorisations`),
    addValorisation: (lineId: number, data: { date: string; valeur: number }) =>
      request<Valorisation>(`/bourse/lines/${lineId}/valorisations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateValorisation: (id: number, data: { date?: string; valeur?: number }) =>
      request<Valorisation>(`/bourse/valorisations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteValorisation: (id: number) => request<void>(`/bourse/valorisations/${id}`, { method: 'DELETE' }),
  },
  immobilier: {
    listLines: (entityId: number | 'all') => request<ImmobilierLine[]>(`/immobilier/lines?entity_id=${entityId}`),
    createLine: (data: {
      entity_id: number;
      libelle: string;
      prix_acquisition_total?: number;
      date_acquisition?: string;
      residence_principale?: boolean;
      regime_location?: string;
      capital_emprunte_initial?: number;
      taux_annuel?: number;
      duree_mois?: number;
      date_depart?: string;
      valeur_initiale: number;
      date: string;
      capital_restant_du?: number;
      loyer?: number;
      charges?: number;
      taxe_fonciere?: number;
      assurance?: number;
      frais_gestion?: number;
      mensualite?: number;
    }) => request<ImmobilierLine>('/immobilier/lines', { method: 'POST', body: JSON.stringify(data) }),
    updateLine: (
      id: number,
      data: Partial<
        Pick<
          ImmobilierLine,
          | 'libelle'
          | 'note'
          | 'prix_acquisition_total'
          | 'date_acquisition'
          | 'residence_principale'
          | 'regime_location'
          | 'capital_emprunte_initial'
          | 'taux_annuel'
          | 'duree_mois'
          | 'date_depart'
        >
      >
    ) => request<ImmobilierLine>(`/immobilier/lines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteLine: (id: number) => request<void>(`/immobilier/lines/${id}`, { method: 'DELETE' }),
    listValorisations: (lineId: number) =>
      request<ImmobilierValorisation[]>(`/immobilier/lines/${lineId}/valorisations`),
    addValorisation: (
      lineId: number,
      data: {
        date: string;
        valeur: number;
        capital_restant_du?: number;
        loyer?: number;
        charges?: number;
        taxe_fonciere?: number;
        assurance?: number;
        frais_gestion?: number;
        mensualite?: number;
      }
    ) =>
      request<ImmobilierValorisation>(`/immobilier/lines/${lineId}/valorisations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateValorisation: (id: number, data: Partial<Omit<ImmobilierValorisation, 'id'>>) =>
      request<ImmobilierValorisation>(`/immobilier/valorisations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteValorisation: (id: number) => request<void>(`/immobilier/valorisations/${id}`, { method: 'DELETE' }),
  },
  avPer: {
    listEnvelopes: (entityId: number | 'all') => request<AvPerEnvelope[]>(`/av-per/envelopes?entity_id=${entityId}`),
    createEnvelope: (data: {
      entity_id: number;
      libelle: string;
      type: AvPerEnvelopeType;
      date_ouverture?: string;
      statut?: string;
    }) => request<AvPerEnvelope>('/av-per/envelopes', { method: 'POST', body: JSON.stringify(data) }),
    updateEnvelope: (
      id: number,
      data: Partial<Pick<AvPerEnvelope, 'libelle' | 'type' | 'date_ouverture' | 'statut'>>
    ) => request<AvPerEnvelope>(`/av-per/envelopes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEnvelope: (id: number) => request<void>(`/av-per/envelopes/${id}`, { method: 'DELETE' }),
    createLine: (
      envelopeId: number,
      data: { libelle: string; nom_support?: string; type_support?: AvPerSupportType; valeur_initiale: number; date: string }
    ) => request<AvPerLine>(`/av-per/envelopes/${envelopeId}/lines`, { method: 'POST', body: JSON.stringify(data) }),
    updateLine: (id: number, data: Partial<Pick<AvPerLine, 'libelle' | 'note' | 'nom_support' | 'type_support'>>) =>
      request<AvPerLine>(`/av-per/lines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteLine: (id: number) => request<void>(`/av-per/lines/${id}`, { method: 'DELETE' }),
    listValorisations: (lineId: number) => request<Valorisation[]>(`/av-per/lines/${lineId}/valorisations`),
    addValorisation: (
      lineId: number,
      data: { date: string; valeur: number; mouvement?: { type: 'versement'; montant: number } }
    ) => request<Valorisation>(`/av-per/lines/${lineId}/valorisations`, { method: 'POST', body: JSON.stringify(data) }),
    updateValorisation: (id: number, data: { date?: string; valeur?: number }) =>
      request<Valorisation>(`/av-per/valorisations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteValorisation: (id: number) => request<void>(`/av-per/valorisations/${id}`, { method: 'DELETE' }),
  },
  crypto: {
    listEnvelopes: (entityId: number | 'all') => request<CryptoEnvelope[]>(`/crypto/envelopes?entity_id=${entityId}`),
    createEnvelope: (data: {
      entity_id: number;
      libelle: string;
      plateforme_etrangere?: boolean;
      prix_acquisition_cumule?: number;
      date_ouverture?: string;
      statut?: string;
    }) => request<CryptoEnvelope>('/crypto/envelopes', { method: 'POST', body: JSON.stringify(data) }),
    updateEnvelope: (
      id: number,
      data: Partial<
        Pick<CryptoEnvelope, 'libelle' | 'plateforme_etrangere' | 'prix_acquisition_cumule' | 'date_ouverture' | 'statut'>
      >
    ) => request<CryptoEnvelope>(`/crypto/envelopes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEnvelope: (id: number) => request<void>(`/crypto/envelopes/${id}`, { method: 'DELETE' }),
    createLine: (
      envelopeId: number,
      data: { libelle: string; symbole: string; quantite: number; valeur_initiale: number; date: string }
    ) => request<CryptoLine>(`/crypto/envelopes/${envelopeId}/lines`, { method: 'POST', body: JSON.stringify(data) }),
    updateLine: (id: number, data: Partial<Pick<CryptoLine, 'libelle' | 'note' | 'symbole' | 'quantite'>>) =>
      request<CryptoLine>(`/crypto/lines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteLine: (id: number) => request<void>(`/crypto/lines/${id}`, { method: 'DELETE' }),
    listValorisations: (lineId: number) => request<Valorisation[]>(`/crypto/lines/${lineId}/valorisations`),
    addValorisation: (lineId: number, data: { date: string; valeur: number }) =>
      request<Valorisation>(`/crypto/lines/${lineId}/valorisations`, { method: 'POST', body: JSON.stringify(data) }),
    updateValorisation: (id: number, data: { date?: string; valeur?: number }) =>
      request<Valorisation>(`/crypto/valorisations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteValorisation: (id: number) => request<void>(`/crypto/valorisations/${id}`, { method: 'DELETE' }),
  },
  peScpi: {
    listEnvelopes: (entityId: number | 'all') => request<PeScpiEnvelope[]>(`/pe-scpi/envelopes?entity_id=${entityId}`),
    createEnvelope: (data: {
      entity_id: number;
      libelle: string;
      type_dispositif: PeScpiDispositif;
      duree_blocage?: number;
      date_ouverture?: string;
      statut?: string;
    }) => request<PeScpiEnvelope>('/pe-scpi/envelopes', { method: 'POST', body: JSON.stringify(data) }),
    updateEnvelope: (
      id: number,
      data: Partial<Pick<PeScpiEnvelope, 'libelle' | 'type_dispositif' | 'duree_blocage' | 'date_ouverture' | 'statut'>>
    ) => request<PeScpiEnvelope>(`/pe-scpi/envelopes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEnvelope: (id: number) => request<void>(`/pe-scpi/envelopes/${id}`, { method: 'DELETE' }),
    createLine: (envelopeId: number, data: { libelle: string; nombre_parts: number; valeur_initiale: number; date: string }) =>
      request<PeScpiLine>(`/pe-scpi/envelopes/${envelopeId}/lines`, { method: 'POST', body: JSON.stringify(data) }),
    updateLine: (id: number, data: Partial<Pick<PeScpiLine, 'libelle' | 'note' | 'nombre_parts'>>) =>
      request<PeScpiLine>(`/pe-scpi/lines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteLine: (id: number) => request<void>(`/pe-scpi/lines/${id}`, { method: 'DELETE' }),
    listValorisations: (lineId: number) => request<Valorisation[]>(`/pe-scpi/lines/${lineId}/valorisations`),
    addValorisation: (lineId: number, data: { date: string; valeur: number }) =>
      request<Valorisation>(`/pe-scpi/lines/${lineId}/valorisations`, { method: 'POST', body: JSON.stringify(data) }),
    updateValorisation: (id: number, data: { date?: string; valeur?: number }) =>
      request<Valorisation>(`/pe-scpi/valorisations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteValorisation: (id: number) => request<void>(`/pe-scpi/valorisations/${id}`, { method: 'DELETE' }),
  },
  reporting: {
    summary: (entityId: number | 'all') => request<ReportingSummary>(`/reporting/summary?entity_id=${entityId}`),
    domain: (domaine: string, entityId: number | 'all') =>
      request<ReportingDomainDetail>(`/reporting/domain/${domaine}?entity_id=${entityId}`),
  },
  profil: {
    get: () => request<Profil>('/profil'),
    update: (data: Partial<Omit<Profil, 'id' | 'risque_bucket' | 'risque_connaissance' | 'risque_override_manuel'>>) =>
      request<Profil>('/profil', { method: 'PUT', body: JSON.stringify(data) }),
    questions: () => request<QuestionnaireQuestion[]>('/profil/questionnaire/questions'),
    reponses: () => request<{ question_index: number; reponse: string; date: string }[]>('/profil/questionnaire/reponses'),
    submitQuestionnaire: (reponses: string[]) =>
      request<Profil>('/profil/questionnaire', { method: 'POST', body: JSON.stringify({ reponses }) }),
    applyRiskOverride: (data: { bucket: RisqueBucket; connaissance?: RisqueConnaissance | null }) =>
      request<Profil>('/profil/risque-override', { method: 'POST', body: JSON.stringify(data) }),
  },
  conseils: {
    findings: (entityId: number | 'all') => request<{ findings: Finding[] }>(`/conseils?entity_id=${entityId}`),
    chat: (message: string, history: ChatMessage[]) =>
      request<ChatResponse>('/conseils/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  },
  objectifs: {
    list: () => request<Objectif[]>('/objectifs'),
    create: (data: {
      type: ObjectifType;
      libelle: string;
      horizon?: string;
      montant_cible?: number;
      lien_patrimoine_type?: LienPatrimoineType;
      lien_domaines?: string[];
      lien_entite_id?: number;
    }) => request<Objectif>('/objectifs', { method: 'POST', body: JSON.stringify(data) }),
    bulk: (templates: string[]) =>
      request<Objectif[]>('/objectifs/bulk', { method: 'POST', body: JSON.stringify({ templates }) }),
    update: (
      id: number,
      data: {
        horizon?: string | null;
        montant_cible?: number | null;
        lien_patrimoine_type?: LienPatrimoineType | null;
        lien_domaines?: string[];
        lien_entite_id?: number;
      }
    ) => request<Objectif>(`/objectifs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/objectifs/${id}`, { method: 'DELETE' }),
  },
};
