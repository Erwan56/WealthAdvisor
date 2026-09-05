import { useEffect, useState } from 'react';
import { api } from '../api';
import { euros, fmtDate } from '../format';
import type { CryptoEnvelope, CryptoLine, Entity } from '../types';
import { CreateEnveloppeCryptoModal, type NewCryptoEnveloppeData } from './CreateEnveloppeCryptoModal';
import { CreateLigneCryptoModal, type NewCryptoLigneData } from './CreateLigneCryptoModal';
import { EnveloppeLigneJournal } from './EnveloppeLigneJournal';
import { EntityAvatar } from './EntityTabs';

interface Props {
  entities: Entity[];
  selectedEntity: number | 'all';
  notify: (message: string, warn?: boolean) => void;
}

const MOUVEMENT_OPTIONS = [
  { value: 'achat', label: 'Achat' },
  { value: 'vente', label: 'Vente' },
];

export function CryptoDashboard({ entities, selectedEntity, notify }: Props) {
  const [envelopes, setEnvelopes] = useState<CryptoEnvelope[] | null>(null);
  const [openLineId, setOpenLineId] = useState<number | null>(null);
  const [showCreateEnveloppe, setShowCreateEnveloppe] = useState(false);
  const [addLigneEnvelope, setAddLigneEnvelope] = useState<CryptoEnvelope | null>(null);

  const load = () => {
    api.crypto
      .listEnvelopes(selectedEntity)
      .then(setEnvelopes)
      .catch(() => notify('Erreur de chargement des portefeuilles', true));
  };

  useEffect(() => {
    setOpenLineId(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntity]);

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

  const title = selectedEntity === 'all' ? 'Crypto — Toutes les Entités' : 'Crypto';
  const currentEntity = selectedEntity === 'all' ? null : entities.find((e) => e.id === selectedEntity) ?? null;
  const showEntity = selectedEntity === 'all';

  return (
    <div className="dash-main">
      <div className="dash-toolbar">
        <h2>{currentEntity ? `${title} — ${currentEntity.libelle}` : title}</h2>
        {selectedEntity === 'all' ? (
          <span className="muted-hint">Choisissez une Entité pour ajouter un portefeuille</span>
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
                    {showEntity && entity ? ` · ${entity.libelle}` : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="mono">{euros(envelope.valeur_totale)}</span>
                    <button type="button" className="btn small ghost" onClick={() => setAddLigneEnvelope(envelope)}>
                      + Actif
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
                            {[line.symbole, line.quantite != null ? `qté ${line.quantite}` : null].filter(Boolean).join(' · ') || '—'}
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
                          <EnveloppeLigneJournal
                            line={line}
                            notify={notify}
                            onLineChanged={load}
                            api={api.crypto}
                            mouvementOptions={MOUVEMENT_OPTIONS}
                            mouvementKind="quantite_prix"
                          />
                          <div style={{ padding: '0 22px' }}>
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
        <CreateEnveloppeCryptoModal
          entities={entities}
          defaultEntityId={selectedEntity}
          onCancel={() => setShowCreateEnveloppe(false)}
          onCreate={createEnveloppe}
        />
      )}

      {addLigneEnvelope && (
        <CreateLigneCryptoModal
          envelope={addLigneEnvelope}
          onCancel={() => setAddLigneEnvelope(null)}
          onCreate={(data) => createLigne(addLigneEnvelope, data)}
        />
      )}
    </div>
  );
}
