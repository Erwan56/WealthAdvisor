import { useEffect, useState } from 'react';
import { api } from '../api';
import { euros, fmtDate } from '../format';
import type { CryptoEnvelope, CryptoLine, Entity } from '../types';
import { CreateEnveloppeCryptoModal, type NewCryptoEnveloppeData } from './CreateEnveloppeCryptoModal';
import { CreateLigneCryptoModal, type NewCryptoLigneData } from './CreateLigneCryptoModal';
import { EditEnveloppeCryptoModal, type EditEnveloppeData } from './EditEnveloppeCryptoModal';
import { EditLigneCryptoModal, type EditLigneData } from './EditLigneCryptoModal';
import { EnveloppeLigneJournal } from './EnveloppeLigneJournal';
import { EntityAvatar } from './EntityAvatar';

interface Props {
  entities: Entity[];
  notify: (message: string, warn?: boolean) => void;
}

export function CryptoDashboard({ entities, notify }: Props) {
  const [envelopes, setEnvelopes] = useState<CryptoEnvelope[] | null>(null);
  const [openLineId, setOpenLineId] = useState<number | null>(null);
  const [showCreateEnveloppe, setShowCreateEnveloppe] = useState(false);
  const [addLigneEnvelope, setAddLigneEnvelope] = useState<CryptoEnvelope | null>(null);
  const [editingEnvelope, setEditingEnvelope] = useState<CryptoEnvelope | null>(null);
  const [editingLine, setEditingLine] = useState<CryptoLine | null>(null);

  const load = () => {
    api.crypto
      .listEnvelopes('all')
      .then(setEnvelopes)
      .catch(() => notify('Erreur de chargement des portefeuilles', true));
  };

  useEffect(load, []);

  const createEnveloppe = async (data: NewCryptoEnveloppeData) => {
    await api.crypto.createEnvelope(data);
    notify('Nouveau portefeuille créé');
    setShowCreateEnveloppe(false);
    load();
  };

  const createLigne = async (envelope: CryptoEnvelope, data: NewCryptoLigneData) => {
    await api.crypto.createLine(envelope.id, data);
    notify('Actif ajouté au portefeuille');
    setAddLigneEnvelope(null);
    load();
  };

  const saveEnveloppe = async (data: EditEnveloppeData) => {
    if (!editingEnvelope) return;
    try {
      await api.crypto.updateEnvelope(editingEnvelope.id, { ...data, plateforme_etrangere: data.plateforme_etrangere ? 1 : 0 });
      notify('Portefeuille mis à jour');
      setEditingEnvelope(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const saveLigne = async (data: EditLigneData) => {
    if (!editingLine) return;
    try {
      await api.crypto.updateLine(editingLine.id, data);
      notify('Actif mis à jour');
      setEditingLine(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const deleteLigne = async (line: CryptoLine) => {
    if (!window.confirm(`Supprimer « ${line.libelle} » et tout son historique ?`)) return;
    try {
      await api.crypto.deleteLine(line.id);
      notify('Actif supprimé', true);
      if (openLineId === line.id) setOpenLineId(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const deleteEnveloppe = async (envelope: CryptoEnvelope) => {
    if (!window.confirm(`Supprimer le portefeuille « ${envelope.libelle} » et tous ses actifs ?`)) return;
    try {
      await api.crypto.deleteEnvelope(envelope.id);
      notify('Portefeuille supprimé', true);
      setOpenLineId(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  return (
    <div className="dash-main">
      <div className="dash-toolbar">
        <h2>Crypto</h2>
        <button type="button" className="btn primary" onClick={() => setShowCreateEnveloppe(true)}>
          + Ajouter
        </button>
      </div>

      <div className="card">
        {envelopes === null ? (
          <div className="empty-state">Chargement…</div>
        ) : envelopes.length === 0 ? (
          <div className="empty-state">Aucun portefeuille Crypto pour le moment.</div>
        ) : (
          envelopes.map((envelope) => {
            const entity = entities.find((e) => e.id === envelope.entity_id);
            return (
              <div key={envelope.id}>
                <div className="env-group-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {envelope.libelle}
                    {envelope.plateforme_etrangere ? ' · plateforme étrangère' : ''}
                    {envelope.date_ouverture ? ` · ouvert ${fmtDate(envelope.date_ouverture)}` : ''}
                    {envelope.statut ? ` · ${envelope.statut}` : ''}
                    {entity ? ` · ${entity.libelle}` : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="mono">{euros(envelope.valeur_totale)}</span>
                    <button type="button" className="btn small ghost" onClick={() => setAddLigneEnvelope(envelope)}>
                      + Actif
                    </button>
                    <button type="button" className="btn small ghost" onClick={() => setEditingEnvelope(envelope)}>
                      Modifier
                    </button>
                    <button type="button" className="btn small ghost danger" onClick={() => deleteEnveloppe(envelope)}>
                      Supprimer
                    </button>
                  </span>
                </div>
                {envelope.lines.length === 0 && (
                  <div className="empty-state" style={{ padding: '10px 20px' }}>
                    Aucun actif pour l’instant — ajoutez-en un via « + Actif ».
                  </div>
                )}
                {envelope.lines.map((line) => {
                  const isOpen = openLineId === line.id;
                  return (
                    <div className={`ledger-row ${isOpen ? 'open' : ''}`} key={line.id}>
                      <div className="ledger-row-head with-entity" onClick={() => setOpenLineId(isOpen ? null : line.id)}>
                        <div>
                          <div className="name">{line.libelle}</div>
                          <div className="sub">
                            {[line.symbole, line.quantite != null ? `qté ${line.quantite}` : null].filter(Boolean).join(' · ') || '—'}
                          </div>
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
                            api={api.crypto}
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
                              Modifier l'actif
                            </button>
                            <button
                              type="button"
                              className="btn ghost danger small"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLigne(line);
                              }}
                            >
                              Supprimer l'actif
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
        <CreateEnveloppeCryptoModal entities={entities} onCancel={() => setShowCreateEnveloppe(false)} onCreate={createEnveloppe} />
      )}

      {addLigneEnvelope && (
        <CreateLigneCryptoModal
          envelope={addLigneEnvelope}
          onCancel={() => setAddLigneEnvelope(null)}
          onCreate={(data) => createLigne(addLigneEnvelope, data)}
        />
      )}

      {editingEnvelope && (
        <EditEnveloppeCryptoModal envelope={editingEnvelope} onCancel={() => setEditingEnvelope(null)} onSave={saveEnveloppe} />
      )}

      {editingLine && (
        <EditLigneCryptoModal line={editingLine} onCancel={() => setEditingLine(null)} onSave={saveLigne} />
      )}
    </div>
  );
}
