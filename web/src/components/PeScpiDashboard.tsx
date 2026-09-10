import { useEffect, useState } from 'react';
import { api } from '../api';
import { euros, fmtDate } from '../format';
import type { Entity, PeScpiEnvelope, PeScpiLine } from '../types';
import { CreateEnveloppePeScpiModal, type NewPeScpiEnveloppeData } from './CreateEnveloppePeScpiModal';
import { CreateLigneScpiModal, type NewPeScpiLigneData } from './CreateLigneScpiModal';
import { EditEnveloppePeScpiModal, type EditPeScpiEnveloppeData } from './EditEnveloppePeScpiModal';
import { EditLigneScpiModal, type EditPeScpiLigneData } from './EditLigneScpiModal';
import { EnveloppeLigneJournal } from './EnveloppeLigneJournal';
import { EntityAvatar } from './EntityAvatar';

interface Props {
  entities: Entity[];
  notify: (message: string, warn?: boolean) => void;
}

const MOUVEMENT_OPTIONS = [
  { value: 'souscription', label: 'Souscription' },
  { value: 'rachat', label: 'Rachat' },
];

export function PeScpiDashboard({ entities, notify }: Props) {
  const [envelopes, setEnvelopes] = useState<PeScpiEnvelope[] | null>(null);
  const [openLineId, setOpenLineId] = useState<number | null>(null);
  const [showCreateEnveloppe, setShowCreateEnveloppe] = useState(false);
  const [addLigneEnvelope, setAddLigneEnvelope] = useState<PeScpiEnvelope | null>(null);
  const [editingEnvelope, setEditingEnvelope] = useState<PeScpiEnvelope | null>(null);
  const [editingLine, setEditingLine] = useState<PeScpiLine | null>(null);

  const load = () => {
    api.peScpi
      .listEnvelopes('all')
      .then(setEnvelopes)
      .catch(() => notify('Erreur de chargement des fonds', true));
  };

  useEffect(load, []);

  const createEnveloppe = async (data: NewPeScpiEnveloppeData) => {
    await api.peScpi.createEnvelope(data);
    notify('Nouveau fonds créé');
    setShowCreateEnveloppe(false);
    load();
  };

  const createLigne = async (envelope: PeScpiEnvelope, data: NewPeScpiLigneData) => {
    await api.peScpi.createLine(envelope.id, data);
    notify('Part ajoutée au fonds');
    setAddLigneEnvelope(null);
    load();
  };

  const saveEnveloppe = async (data: EditPeScpiEnveloppeData) => {
    if (!editingEnvelope) return;
    try {
      await api.peScpi.updateEnvelope(editingEnvelope.id, data);
      notify('Fonds mis à jour');
      setEditingEnvelope(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const saveLigne = async (data: EditPeScpiLigneData) => {
    if (!editingLine) return;
    try {
      await api.peScpi.updateLine(editingLine.id, data);
      notify('Part mise à jour');
      setEditingLine(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const deleteLigne = async (line: PeScpiLine) => {
    if (!window.confirm(`Supprimer « ${line.libelle} » et tout son historique ?`)) return;
    try {
      await api.peScpi.deleteLine(line.id);
      notify('Part supprimée', true);
      if (openLineId === line.id) setOpenLineId(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const deleteEnveloppe = async (envelope: PeScpiEnvelope) => {
    if (!window.confirm(`Supprimer le fonds « ${envelope.libelle} » et toutes ses parts ?`)) return;
    try {
      await api.peScpi.deleteEnvelope(envelope.id);
      notify('Fonds supprimé', true);
      setOpenLineId(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  return (
    <div className="dash-main">
      <div className="dash-toolbar">
        <h2>Private equity / SCPI</h2>
        <button type="button" className="btn primary" onClick={() => setShowCreateEnveloppe(true)}>
          + Ajouter
        </button>
      </div>

      <div className="card">
        {envelopes === null ? (
          <div className="empty-state">Chargement…</div>
        ) : envelopes.length === 0 ? (
          <div className="empty-state">Aucun fonds Private equity / SCPI pour le moment.</div>
        ) : (
          envelopes.map((envelope) => {
            const entity = entities.find((e) => e.id === envelope.entity_id);
            return (
              <div key={envelope.id}>
                <div className="env-group-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {envelope.libelle} · {envelope.type_dispositif}
                    {envelope.duree_blocage != null ? ` · blocage ${envelope.duree_blocage} ans` : ''}
                    {envelope.date_ouverture ? ` · ouvert ${fmtDate(envelope.date_ouverture)}` : ''}
                    {envelope.statut ? ` · ${envelope.statut}` : ''}
                    {entity ? ` · ${entity.libelle}` : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="mono">{euros(envelope.valeur_totale)}</span>
                    <button type="button" className="btn small ghost" onClick={() => setAddLigneEnvelope(envelope)}>
                      + Part
                    </button>
                    <button type="button" className="btn small ghost" onClick={() => setEditingEnvelope(envelope)}>
                      Modifier
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
                      <div className="ledger-row-head with-entity" onClick={() => setOpenLineId(isOpen ? null : line.id)}>
                        <div>
                          <div className="name">{line.libelle}</div>
                          <div className="sub">{line.nombre_parts != null ? `${line.nombre_parts} part(s)` : '—'}</div>
                        </div>
                        {entity && (
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
                          <EnveloppeLigneJournal
                            line={line}
                            notify={notify}
                            onLineChanged={load}
                            api={api.peScpi}
                            mouvementOptions={MOUVEMENT_OPTIONS}
                            mouvementKind="quantite_prix"
                          />
                          <div style={{ padding: '0 22px', display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              className="btn ghost small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingLine(line);
                              }}
                            >
                              Modifier la part
                            </button>
                            <button
                              type="button"
                              className="btn ghost danger small"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLigne(line);
                              }}
                            >
                              Supprimer la part
                            </button>
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
        <CreateEnveloppePeScpiModal entities={entities} onCancel={() => setShowCreateEnveloppe(false)} onCreate={createEnveloppe} />
      )}

      {addLigneEnvelope && (
        <CreateLigneScpiModal
          envelope={addLigneEnvelope}
          onCancel={() => setAddLigneEnvelope(null)}
          onCreate={(data) => createLigne(addLigneEnvelope, data)}
        />
      )}

      {editingEnvelope && (
        <EditEnveloppePeScpiModal envelope={editingEnvelope} onCancel={() => setEditingEnvelope(null)} onSave={saveEnveloppe} />
      )}

      {editingLine && <EditLigneScpiModal line={editingLine} onCancel={() => setEditingLine(null)} onSave={saveLigne} />}
    </div>
  );
}
