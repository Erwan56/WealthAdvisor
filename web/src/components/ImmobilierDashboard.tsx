import { useEffect, useState } from 'react';
import { api } from '../api';
import { euros, fmtDate, pct } from '../format';
import type { Entity, ImmobilierLine } from '../types';
import { CreateLigneImmobilierModal, type NewImmobilierLigneData } from './CreateLigneImmobilierModal';
import { EntityAvatar } from './EntityTabs';
import { ImmobilierLigneJournal } from './ImmobilierLigneJournal';

interface Props {
  entities: Entity[];
  selectedEntity: number | 'all';
  notify: (message: string, warn?: boolean) => void;
}

const REGIME_LABELS: Record<string, string> = {
  nue: 'Location nue',
  meublee: 'Location meublée',
  saisonniere: 'Location saisonnière',
};

export function ImmobilierDashboard({ entities, selectedEntity, notify }: Props) {
  const [lines, setLines] = useState<ImmobilierLine[] | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    api.immobilier
      .listLines(selectedEntity)
      .then(setLines)
      .catch(() => notify('Erreur de chargement des biens', true));
  };

  useEffect(() => {
    setOpenId(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntity]);

  const createLine = async (data: NewImmobilierLigneData) => {
    await api.immobilier.createLine(data);
    notify('Nouveau bien ajouté');
    setShowCreate(false);
    load();
  };

  const deleteLine = async (line: ImmobilierLine) => {
    if (!window.confirm(`Supprimer « ${line.libelle} » et tout son historique ?`)) return;
    try {
      await api.immobilier.deleteLine(line.id);
      notify('Bien supprimé', true);
      if (openId === line.id) setOpenId(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const title = selectedEntity === 'all' ? 'Immobilier — Toutes les Entités' : 'Immobilier';
  const currentEntity = selectedEntity === 'all' ? null : entities.find((e) => e.id === selectedEntity) ?? null;
  const showEntity = selectedEntity === 'all';

  return (
    <div className="dash-main">
      <div className="dash-toolbar">
        <h2>{currentEntity ? `${title} — ${currentEntity.libelle}` : title}</h2>
        {selectedEntity === 'all' ? (
          <span className="muted-hint">Choisissez une Entité pour ajouter un bien</span>
        ) : (
          <button type="button" className="btn primary" onClick={() => setShowCreate(true)}>
            + Ajouter
          </button>
        )}
      </div>

      <div className="card">
        {lines === null ? (
          <div className="empty-state">Chargement…</div>
        ) : lines.length === 0 ? (
          <div className="empty-state">Aucune Ligne Immobilier pour le moment.</div>
        ) : (
          lines.map((line) => {
            const isOpen = openId === line.id;
            const entity = entities.find((e) => e.id === line.entity_id);
            const statutLabel = line.residence_principale
              ? 'Résidence principale'
              : line.regime_location
                ? REGIME_LABELS[line.regime_location] ?? line.regime_location
                : 'Non loué';
            return (
              <div className={`ledger-row ${isOpen ? 'open' : ''}`} key={line.id}>
                <div
                  className={`ledger-row-head ${showEntity ? 'with-entity' : ''}`}
                  onClick={() => setOpenId(isOpen ? null : line.id)}
                >
                  <div>
                    <div className="name">{line.libelle}</div>
                    <div className="sub">
                      {statutLabel}
                      {line.rendement_net != null ? ` · rendement net ${pct(line.rendement_net)}` : ''}
                      {line.cash_flow_mensuel != null ? ` · cash-flow ${euros(line.cash_flow_mensuel)}/mois` : ''}
                    </div>
                  </div>
                  {showEntity && entity && (
                    <div className="ent-cell">
                      <EntityAvatar entity={entity} small />
                      <span>{entity.libelle}</span>
                    </div>
                  )}
                  <div>
                    <div className="val">{euros(line.valeur_actuelle)}</div>
                    <div className="asof">
                      {line.date_derniere_valorisation ? `au ${fmtDate(line.date_derniere_valorisation)}` : 'aucune donnée'}
                    </div>
                  </div>
                  <div className="chev">›</div>
                </div>
                {isOpen && (
                  <div className="ledger-row-body">
                    {line.rendement_brut != null && (
                      <div style={{ padding: '0 22px 12px', fontSize: 12.5, color: 'var(--muted)' }}>
                        Rendement brut <strong className="mono">{pct(line.rendement_brut)}</strong> · Rendement net{' '}
                        <strong className="mono">{line.rendement_net != null ? pct(line.rendement_net) : '—'}</strong> · Cash-flow{' '}
                        <strong className="mono">
                          {line.cash_flow_mensuel != null ? `${euros(line.cash_flow_mensuel)}/mois` : '—'}
                        </strong>
                        {line.cash_flow_annuel != null ? ` (${euros(line.cash_flow_annuel)}/an)` : ''}
                      </div>
                    )}
                    <ImmobilierLigneJournal line={line} notify={notify} onLineChanged={load} />
                    <div style={{ padding: '0 22px' }}>
                      <button
                        type="button"
                        className="btn ghost danger small"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLine(line);
                        }}
                      >
                        Supprimer le bien
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showCreate && (
        <CreateLigneImmobilierModal
          entities={entities}
          defaultEntityId={selectedEntity}
          onCancel={() => setShowCreate(false)}
          onCreate={createLine}
        />
      )}
    </div>
  );
}
