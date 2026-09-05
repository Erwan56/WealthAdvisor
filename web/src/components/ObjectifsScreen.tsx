import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Entity, LienPatrimoineType, Objectif, ObjectifType } from '../types';
import { CreateObjectifWizard } from './CreateObjectifWizard';
import { ObjectifCard } from './ObjectifCard';
import { TemplatesObjectifModal } from './TemplatesObjectifModal';

interface Props {
  entities: Entity[];
  notify: (message: string, warn?: boolean) => void;
}

// Écran Objectifs — grille de cartes, indépendant du Profil et des onglets
// d'Entité (le Lien patrimoine se règle par Objectif, pas par la navigation
// globale), ticket 09.
export function ObjectifsScreen({ entities, notify }: Props) {
  const [objectifs, setObjectifs] = useState<Objectif[] | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const load = () => {
    api.objectifs.list().then(setObjectifs).catch(() => notify('Erreur de chargement des Objectifs', true));
  };

  useEffect(load, []);

  const createObjectif = async (data: { type: ObjectifType; libelle: string; horizon?: string; montant_cible?: number }) => {
    await api.objectifs.create(data);
    notify('Objectif créé');
    setShowWizard(false);
    load();
  };

  const createFromTemplates = async (keys: string[]) => {
    await api.objectifs.bulk(keys);
    notify(`${keys.length} Objectif(s) créé(s)`);
    setShowTemplates(false);
    load();
  };

  const updateObjectif = async (
    id: number,
    data: {
      horizon?: string | null;
      montant_cible?: number | null;
      lien_patrimoine_type?: LienPatrimoineType | null;
      lien_domaines?: string[];
      lien_entite_id?: number;
    }
  ) => {
    try {
      await api.objectifs.update(id, data);
      notify('Objectif mis à jour');
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const deleteObjectif = async (o: Objectif) => {
    if (!window.confirm(`Supprimer l'Objectif « ${o.libelle} » ?`)) return;
    try {
      await api.objectifs.delete(o.id);
      notify('Objectif supprimé', true);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  return (
    <div className="dash-main">
      <div className="dash-toolbar">
        <h2>Objectifs</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn ghost" onClick={() => setShowTemplates(true)}>
            Partir de modèles suggérés
          </button>
          <button type="button" className="btn primary" onClick={() => setShowWizard(true)}>
            + Nouvel Objectif
          </button>
        </div>
      </div>

      {objectifs === null ? (
        <div className="card empty-state">Chargement…</div>
      ) : objectifs.length === 0 ? (
        <div className="card empty-state">Aucun Objectif pour le moment.</div>
      ) : (
        <div className="objectif-grid">
          {objectifs.map((o) => (
            <ObjectifCard key={o.id} objectif={o} entities={entities} onUpdate={updateObjectif} onDelete={deleteObjectif} />
          ))}
        </div>
      )}

      {showWizard && <CreateObjectifWizard onCancel={() => setShowWizard(false)} onCreate={createObjectif} />}
      {showTemplates && <TemplatesObjectifModal onCancel={() => setShowTemplates(false)} onCreate={createFromTemplates} />}
    </div>
  );
}
