import { useState } from 'react';
import { api } from '../api';
import type { Entity, EntityType } from '../types';
import { EntityAvatar } from './EntityAvatar';
import { EntityFormPanel } from './EntityFormPanel';
import { ReferenceListEditor } from './ReferenceListEditor';

interface Props {
  entities: Entity[];
  onEntitiesChanged: () => void;
  notify: (message: string, warn?: boolean) => void;
}

const TABS = [
  { key: 'entites', label: 'Entités' },
  { key: 'banques', label: 'Banques' },
  { key: 'types_compte', label: 'Types de compte' },
] as const;

type Tab = (typeof TABS)[number]['key'];

// Écran top-level de gestion des listes de référence transverses — Entités,
// Banques, Types de compte Liquidités — distinct de Profil (ticket 05).
export function ConfigurationScreen({ entities, onEntitiesChanged, notify }: Props) {
  const [tab, setTab] = useState<Tab>('entites');
  const [editingEntity, setEditingEntity] = useState<Entity | 'new' | null>(null);

  const submitEntity = async (data: { libelle: string; type: EntityType; charges_fixes_professionnelles?: number }) => {
    if (editingEntity && editingEntity !== 'new') {
      await api.entities.update(editingEntity.id, data);
      notify(`Entité « ${data.libelle} » modifiée`);
    } else {
      await api.entities.create(data);
      notify(`Entité « ${data.libelle} » créée`);
    }
    setEditingEntity(null);
    onEntitiesChanged();
  };

  const deleteEntity = async (entity: Entity) => {
    if (!window.confirm(`Supprimer l'Entité « ${entity.libelle} » et tout son patrimoine ?`)) return;
    try {
      await api.entities.delete(entity.id);
      notify(`Entité « ${entity.libelle} » supprimée`);
      onEntitiesChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur lors de la suppression', true);
    }
  };

  return (
    <div className="dash-main">
      <div className="dash-toolbar">
        <h2>Configuration</h2>
      </div>

      <nav className="anchor-nav">
        {TABS.map((t) => (
          <button type="button" key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'entites' && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <table className="report-table">
            <tbody>
              {entities.map((e) => (
                <tr key={e.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <EntityAvatar entity={e} small />
                    {e.libelle}
                  </td>
                  <td>{e.type === 'personnelle' ? 'Personnelle' : e.type === 'activite_service' ? 'Activité de service' : 'Détention immobilière'}</td>
                  <td>{e.charges_fixes_professionnelles != null ? `${e.charges_fixes_professionnelles} €/mois` : '—'}</td>
                  <td style={{ width: 1, whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <button type="button" className="btn small ghost" onClick={() => setEditingEntity(e)}>
                      Modifier
                    </button>
                    {!e.locked && (
                      <button type="button" className="btn small ghost" onClick={() => deleteEntity(e)}>
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="btn-row" style={{ paddingLeft: 0 }}>
            <button type="button" className="btn primary" onClick={() => setEditingEntity('new')}>
              + Nouvelle Entité
            </button>
          </div>
        </div>
      )}

      {tab === 'banques' && <ReferenceListEditor itemLabel="Banque" api={api.banques} notify={notify} />}
      {tab === 'types_compte' && <ReferenceListEditor itemLabel="Type de compte" api={api.typesCompte} notify={notify} />}

      {editingEntity && (
        <EntityFormPanel
          entity={editingEntity === 'new' ? undefined : editingEntity}
          onCancel={() => setEditingEntity(null)}
          onSubmit={submitEntity}
        />
      )}
    </div>
  );
}
