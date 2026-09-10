import { useEffect, useState } from 'react';
import { api } from '../api';
import { euros, fmtDate } from '../format';
import type { AvPerEnvelope, AvPerLine, Entity } from '../types';
import { CreateEnveloppeAvPerModal, type NewAvPerEnveloppeData } from './CreateEnveloppeAvPerModal';
import { CreateLigneAvPerModal, type NewAvPerLigneData } from './CreateLigneAvPerModal';
import { EditEnveloppeAvPerModal, type EditAvPerEnveloppeData } from './EditEnveloppeAvPerModal';
import { EditLigneAvPerModal, type EditAvPerLigneData } from './EditLigneAvPerModal';
import { EnveloppeLigneJournal } from './EnveloppeLigneJournal';
import { EntityAvatar } from './EntityAvatar';

interface Props {
  entities: Entity[];
  notify: (message: string, warn?: boolean) => void;
}

const MOUVEMENT_OPTIONS = [
  { value: 'versement', label: 'Versement' },
  { value: 'rachat', label: 'Rachat' },
  { value: 'arbitrage', label: 'Arbitrage' },
];

export function AvPerDashboard({ entities, notify }: Props) {
  const [envelopes, setEnvelopes] = useState<AvPerEnvelope[] | null>(null);
  const [openLineId, setOpenLineId] = useState<number | null>(null);
  const [showCreateEnveloppe, setShowCreateEnveloppe] = useState(false);
  const [addLigneEnvelope, setAddLigneEnvelope] = useState<AvPerEnvelope | null>(null);
  const [editingEnvelope, setEditingEnvelope] = useState<AvPerEnvelope | null>(null);
  const [editingLine, setEditingLine] = useState<AvPerLine | null>(null);

  const load = () => {
    api.avPer
      .listEnvelopes('all')
      .then(setEnvelopes)
      .catch(() => notify('Erreur de chargement des contrats', true));
  };

  useEffect(load, []);

  const createEnveloppe = async (data: NewAvPerEnveloppeData) => {
    await api.avPer.createEnvelope(data);
    notify('Nouveau contrat créé');
    setShowCreateEnveloppe(false);
    load();
  };

  const createLigne = async (envelope: AvPerEnvelope, data: NewAvPerLigneData) => {
    await api.avPer.createLine(envelope.id, data);
    notify('Support ajouté au contrat');
    setAddLigneEnvelope(null);
    load();
  };

  const saveEnveloppe = async (data: EditAvPerEnveloppeData) => {
    if (!editingEnvelope) return;
    try {
      await api.avPer.updateEnvelope(editingEnvelope.id, data);
      notify('Contrat mis à jour');
      setEditingEnvelope(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const saveLigne = async (data: EditAvPerLigneData) => {
    if (!editingLine) return;
    try {
      await api.avPer.updateLine(editingLine.id, data);
      notify('Support mis à jour');
      setEditingLine(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const deleteLigne = async (line: AvPerLine) => {
    if (!window.confirm(`Supprimer « ${line.libelle} » et tout son historique ?`)) return;
    try {
      await api.avPer.deleteLine(line.id);
      notify('Support supprimé', true);
      if (openLineId === line.id) setOpenLineId(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const deleteEnveloppe = async (envelope: AvPerEnvelope) => {
    if (!window.confirm(`Supprimer le contrat « ${envelope.libelle} » et tous ses supports ?`)) return;
    try {
      await api.avPer.deleteEnvelope(envelope.id);
      notify('Contrat supprimé', true);
      setOpenLineId(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  return (
    <div className="dash-main">
      <div className="dash-toolbar">
        <h2>Assurance-vie / PER</h2>
        <button type="button" className="btn primary" onClick={() => setShowCreateEnveloppe(true)}>
          + Ajouter
        </button>
      </div>

      <div className="card">
        {envelopes === null ? (
          <div className="empty-state">Chargement…</div>
        ) : envelopes.length === 0 ? (
          <div className="empty-state">Aucun contrat Assurance-vie / PER pour le moment.</div>
        ) : (
          envelopes.map((envelope) => {
            const entity = entities.find((e) => e.id === envelope.entity_id);
            return (
              <div key={envelope.id}>
                <div className="env-group-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {envelope.libelle} · {envelope.type === 'assurance_vie' ? 'Assurance-vie' : 'PER'}
                    {envelope.date_ouverture ? ` · ouvert ${fmtDate(envelope.date_ouverture)}` : ''}
                    {envelope.statut ? ` · ${envelope.statut}` : ''}
                    {entity ? ` · ${entity.libelle}` : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="mono">{euros(envelope.valeur_totale)}</span>
                    <button type="button" className="btn small ghost" onClick={() => setAddLigneEnvelope(envelope)}>
                      + Support
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
                          <div className="sub">{line.type_support === 'fonds_euro' ? 'Fonds euro' : line.type_support === 'uc' ? 'Unité de compte' : '—'}</div>
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
                            api={api.avPer}
                            mouvementOptions={MOUVEMENT_OPTIONS}
                            mouvementKind="montant"
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
                              Modifier le support
                            </button>
                            <button
                              type="button"
                              className="btn ghost danger small"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLigne(line);
                              }}
                            >
                              Supprimer le support
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
        <CreateEnveloppeAvPerModal entities={entities} onCancel={() => setShowCreateEnveloppe(false)} onCreate={createEnveloppe} />
      )}

      {addLigneEnvelope && (
        <CreateLigneAvPerModal
          envelope={addLigneEnvelope}
          onCancel={() => setAddLigneEnvelope(null)}
          onCreate={(data) => createLigne(addLigneEnvelope, data)}
        />
      )}

      {editingEnvelope && (
        <EditEnveloppeAvPerModal envelope={editingEnvelope} onCancel={() => setEditingEnvelope(null)} onSave={saveEnveloppe} />
      )}

      {editingLine && (
        <EditLigneAvPerModal line={editingLine} onCancel={() => setEditingLine(null)} onSave={saveLigne} />
      )}
    </div>
  );
}
