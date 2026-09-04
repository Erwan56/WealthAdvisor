import type { Entity, EntityType, LiquiditeLine, Valorisation } from './types';

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
};
