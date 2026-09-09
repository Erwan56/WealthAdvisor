import { useEffect, useState } from 'react';
import { api } from '../api';
import { euros, fmtDate } from '../format';
import { estimateAccruedValue } from '../interest';
import type { Entity, LiquiditeLine } from '../types';
import { CreateLigneModal, type NewLigneData } from './CreateLigneModal';
import { EditLigneModal, type EditLigneData } from './EditLigneModal';
import { EntityAvatar } from './EntityTabs';
import { LigneJournal } from './LigneJournal';

interface Props {
  entities: Entity[];
  selectedEntity: number | 'all';
  notify: (message: string, warn?: boolean) => void;
}

export function LiquiditesDashboard({ entities, selectedEntity, notify }: Props) {
  const [lines, setLines] = useState<LiquiditeLine[] | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingLine, setEditingLine] = useState<LiquiditeLine | null>(null);

  const load = () => {
    api.liquidites
      .listLines(selectedEntity)
      .then(setLines)
      .catch(() => notify('Erreur de chargement des comptes', true));
  };

  useEffect(() => {
    setOpenId(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntity]);

  const createLine = async (data: NewLigneData) => {
    await api.liquidites.createLine(data);
    notify('Nouvelle Ligne ajoutée');
    setShowCreate(false);
    load();
  };

  const saveLine = async (data: EditLigneData) => {
    if (!editingLine) return;
    try {
      await api.liquidites.updateLine(editingLine.id, data);
      notify('Ligne mise à jour');
      setEditingLine(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const deleteLine = async (line: LiquiditeLine) => {
    if (!window.confirm(`Supprimer « ${line.libelle} » et tout son historique ?`)) return;
    try {
      await api.liquidites.deleteLine(line.id);
      notify('Ligne supprimée', true);
      if (openId === line.id) setOpenId(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const title = selectedEntity === 'all' ? 'Liquidités — Toutes les Entités' : 'Liquidités';
  const currentEntity = selectedEntity === 'all' ? null : entities.find((e) => e.id === selectedEntity) ?? null;

  return (
    <div className="dash-main">
      <div className="dash-toolbar">
        <h2>{currentEntity ? `${title} — ${currentEntity.libelle}` : title}</h2>
        {selectedEntity === 'all' ? (
          <span className="muted-hint">Choisissez une Entité pour ajouter un compte</span>
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
          <div className="empty-state">Aucune Ligne de Liquidités pour le moment.</div>
        ) : (
          lines.map((line) => {
            const isOpen = openId === line.id;
            const showEntity = selectedEntity === 'all';
            const entity = entities.find((e) => e.id === line.entity_id);
            return (
              <div className={`ledger-row ${isOpen ? 'open' : ''}`} key={line.id}>
                <div
                  className={`ledger-row-head ${showEntity ? 'with-entity' : ''}`}
                  onClick={() => setOpenId(isOpen ? null : line.id)}
                >
                  <div>
                    <div className="name">{line.libelle}</div>
                    <div className="sub">
                      {[line.type_compte, line.banque].filter(Boolean).join(' · ') || '—'}
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
                    {!!line.taux && line.date_derniere_valorisation && (() => {
                      const estimated =
                        Math.round(estimateAccruedValue(line.valeur_actuelle, line.date_derniere_valorisation, line.taux) * 100) /
                        100;
                      return Math.abs(estimated - line.valeur_actuelle) >= 0.01 ? (
                        <div className="asof accent">≈ {euros(estimated)} aujourd’hui</div>
                      ) : null;
                    })()}
                  </div>
                  <div className="chev">›</div>
                </div>
                {isOpen && (
                  <div className="ledger-row-body">
                    <LigneJournal line={line} notify={notify} onLineChanged={load} />
                    <div style={{ padding: '0 22px', display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn ghost small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLine(line);
                        }}
                      >
                        Modifier la Ligne
                      </button>
                      <button
                        type="button"
                        className="btn ghost danger small"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLine(line);
                        }}
                      >
                        Supprimer la Ligne
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
        <CreateLigneModal
          entities={entities}
          defaultEntityId={selectedEntity}
          onCancel={() => setShowCreate(false)}
          onCreate={createLine}
        />
      )}

      {editingLine && (
        <EditLigneModal line={editingLine} onCancel={() => setEditingLine(null)} onSave={saveLine} />
      )}
    </div>
  );
}
