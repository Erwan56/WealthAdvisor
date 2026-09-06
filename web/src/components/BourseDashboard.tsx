import { useEffect, useState } from 'react';
import { api } from '../api';
import { euros, fmtDate } from '../format';
import type { BourseEnvelope, BourseLine, Entity } from '../types';
import { BourseLigneJournal } from './BourseLigneJournal';
import { CreateEnveloppeBourseModal, type NewEnveloppeData } from './CreateEnveloppeBourseModal';
import { CreateLigneBourseModal, type NewBourseLigneData } from './CreateLigneBourseModal';
import { EntityAvatar } from './EntityTabs';

interface Props {
  entities: Entity[];
  selectedEntity: number | 'all';
  notify: (message: string, warn?: boolean) => void;
}

export function BourseDashboard({ entities, selectedEntity, notify }: Props) {
  const [envelopes, setEnvelopes] = useState<BourseEnvelope[] | null>(null);
  const [openLineId, setOpenLineId] = useState<number | null>(null);
  const [showCreateEnveloppe, setShowCreateEnveloppe] = useState(false);
  const [addLigneEnvelope, setAddLigneEnvelope] = useState<BourseEnvelope | null>(null);

  const load = () => {
    api.bourse
      .listEnvelopes(selectedEntity)
      .then(setEnvelopes)
      .catch(() => notify('Erreur de chargement des Enveloppes', true));
  };

  useEffect(() => {
    setOpenLineId(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntity]);

  const createEnveloppe = async (data: NewEnveloppeData) => {
    await api.bourse.createEnvelope(data);
    notify('Nouvelle Enveloppe créée');
    setShowCreateEnveloppe(false);
    load();
  };

  const createLigne = async (envelope: BourseEnvelope, data: NewBourseLigneData) => {
    await api.bourse.createLine(envelope.id, data);
    notify('Titre ajouté à l’Enveloppe');
    setAddLigneEnvelope(null);
    load();
  };

  const deleteLigne = async (line: BourseLine) => {
    if (!window.confirm(`Supprimer « ${line.libelle} » et tout son historique ?`)) return;
    try {
      await api.bourse.deleteLine(line.id);
      notify('Titre supprimé', true);
      if (openLineId === line.id) setOpenLineId(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const deleteEnveloppe = async (envelope: BourseEnvelope) => {
    if (!window.confirm(`Supprimer l’Enveloppe « ${envelope.libelle} » et tous ses titres ?`)) return;
    try {
      await api.bourse.deleteEnvelope(envelope.id);
      notify('Enveloppe supprimée', true);
      setOpenLineId(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const title = selectedEntity === 'all' ? 'Bourse — Toutes les Entités' : 'Bourse';
  const currentEntity = selectedEntity === 'all' ? null : entities.find((e) => e.id === selectedEntity) ?? null;
  const showEntity = selectedEntity === 'all';

  return (
    <div className="dash-main">
      <div className="dash-toolbar">
        <h2>{currentEntity ? `${title} — ${currentEntity.libelle}` : title}</h2>
        {selectedEntity === 'all' ? (
          <span className="muted-hint">Choisissez une Entité pour ajouter une Enveloppe</span>
        ) : (
          <button type="button" className="btn primary" onClick={() => setShowCreateEnveloppe(true)}>
            + Ajouter
          </button>
        )}
      </div>

      <div className="card">
        {envelopes === null ? (
          <div className="empty-state">Chargement…</div>
        ) : envelopes.length === 0 ? (
          <div className="empty-state">Aucune Enveloppe Bourse pour le moment.</div>
        ) : (
          envelopes.map((envelope) => {
            const entity = entities.find((e) => e.id === envelope.entity_id);
            return (
              <div key={envelope.id}>
                <div className="env-group-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {envelope.libelle} · {envelope.type}
                    {envelope.date_ouverture ? ` · ouvert ${fmtDate(envelope.date_ouverture)}` : ''}
                    {envelope.statut ? ` · ${envelope.statut}` : ''}
                    {showEntity && entity ? ` · ${entity.libelle}` : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="mono">{euros(envelope.valeur_totale)}</span>
                    <button type="button" className="btn small ghost" onClick={() => setAddLigneEnvelope(envelope)}>
                      + Titre
                    </button>
                    <button type="button" className="btn small ghost danger" onClick={() => deleteEnveloppe(envelope)}>
                      Supprimer
                    </button>
                  </span>
                </div>
                {envelope.lines.map((line) => {
                  const isOpen = openLineId === line.id;
                  return (
                    <div className={`ledger-row ${isOpen ? 'open' : ''}`} key={line.id}>
                      <div
                        className={`ledger-row-head ${showEntity ? 'with-entity' : ''}`}
                        onClick={() => setOpenLineId(isOpen ? null : line.id)}
                      >
                        <div>
                          <div className="name">{line.libelle}</div>
                          <div className="sub">
                            {line.est_compte_especes
                              ? 'Compte espèces'
                              : [line.nom_isin, line.quantite != null ? `qté ${line.quantite}` : null]
                                  .filter(Boolean)
                                  .join(' · ') || '—'}
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
                          <BourseLigneJournal line={line} notify={notify} onLineChanged={load} />
                          <div style={{ padding: '0 22px' }}>
                            {line.est_compte_especes ? (
                              <span className="muted-hint" title="Le compte espèces ne se supprime pas seul — supprimez l’Enveloppe pour le retirer.">
                                Le compte espèces se supprime avec l’Enveloppe
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn ghost danger small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteLigne(line);
                                }}
                              >
                                Supprimer le titre
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {showCreateEnveloppe && (
        <CreateEnveloppeBourseModal
          entities={entities}
          defaultEntityId={selectedEntity}
          onCancel={() => setShowCreateEnveloppe(false)}
          onCreate={createEnveloppe}
        />
      )}

      {addLigneEnvelope && (
        <CreateLigneBourseModal
          envelope={addLigneEnvelope}
          onCancel={() => setAddLigneEnvelope(null)}
          onCreate={(data) => createLigne(addLigneEnvelope, data)}
        />
      )}
    </div>
  );
}
