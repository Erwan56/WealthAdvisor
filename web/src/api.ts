import type { BourseEnvelope, BourseEnvelopeType, BourseLine, Entity, EntityType, LiquiditeLine, Valorisation } from './types';

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
    create: (data: { libelle: string; type: EntityType }) =>
      request<Entity>('/entities', { method: 'POST', body: JSON.stringify(data) }),
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
    addValorisation: (
      lineId: number,
      data: { date: string; valeur: number; mouvement?: { type: string; montant?: number } }
    ) =>
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
      line: {
        libelle: string;
        nom_isin?: string;
        quantite?: number;
        pru?: number;
        valeur_initiale: number;
        date: string;
      };
    }) => request<BourseEnvelope>('/bourse/envelopes', { method: 'POST', body: JSON.stringify(data) }),
    updateEnvelope: (
      id: number,
      data: Partial<Pick<BourseEnvelope, 'libelle' | 'type' | 'date_ouverture' | 'statut'>>
    ) => request<BourseEnvelope>(`/bourse/envelopes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEnvelope: (id: number) => request<void>(`/bourse/envelopes/${id}`, { method: 'DELETE' }),
    createLine: (
      envelopeId: number,
      data: { libelle: string; nom_isin?: string; quantite?: number; pru?: number; valeur_initiale: number; date: string }
    ) => request<BourseLine>(`/bourse/envelopes/${envelopeId}/lines`, { method: 'POST', body: JSON.stringify(data) }),
    updateLine: (id: number, data: Partial<Pick<BourseLine, 'libelle' | 'note' | 'nom_isin' | 'quantite' | 'pru'>>) =>
      request<BourseLine>(`/bourse/lines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteLine: (id: number) => request<void>(`/bourse/lines/${id}`, { method: 'DELETE' }),
    listValorisations: (lineId: number) => request<Valorisation[]>(`/bourse/lines/${lineId}/valorisations`),
    addValorisation: (
      lineId: number,
      data: {
        date: string;
        valeur: number;
        mouvement?: { type: string; montant?: number; quantite?: number; prix_unitaire?: number };
      }
    ) =>
      request<Valorisation>(`/bourse/lines/${lineId}/valorisations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateValorisation: (id: number, data: { date?: string; valeur?: number }) =>
      request<Valorisation>(`/bourse/valorisations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteValorisation: (id: number) => request<void>(`/bourse/valorisations/${id}`, { method: 'DELETE' }),
  },
};
