import { useEffect, useState } from 'react';
import { api } from '../api';
import { euros, fmtDate, pct } from '../format';
import type { BourseEnvelope, BourseLine, Entity } from '../types';
import { BourseLigneJournal } from './BourseLigneJournal';
import { CreateEnveloppeBourseModal, type NewEnveloppeData } from './CreateEnveloppeBourseModal';
import { CreateLigneBourseModal, type NewBourseLigneData } from './CreateLigneBourseModal';
import { EditEnveloppeBourseModal, type EditEnveloppeData } from './EditEnveloppeBourseModal';
import { EditLigneBourseModal, type EditLigneData } from './EditLigneBourseModal';
import { EntityAvatar } from './EntityAvatar';

// What this dashboard registers with the app shell (App.tsx) so its refresh action
// renders at the dashboard-global level instead of inside its own card — generic
// mechanism, only Bourse opts in today (valorisation-bourse-temps-reel, ticket 07).
export interface DomainRefreshAction {
  label: string;
  busyLabel: string;
  busy: boolean;
  onClick: () => void;
}

type EchecRaison = 'isin_non_trouve' | 'devise_non_convertible' | 'source_indisponible';

const FAIL_REASON_LABEL: Record<EchecRaison, string> = {
  isin_non_trouve: 'ISIN non trouvé',
  devise_non_convertible: 'Devise non convertible',
  source_indisponible: 'Source de cours indisponible',
};

interface Props {
  entities: Entity[];
  notify: (message: string, warn?: boolean) => void;
  onDomainAction?: (action: DomainRefreshAction | null) => void;
}

// Titre | Qté | ISIN | Coût acq. | Cours | Valorisation | PV € | PV % | chevron
const PERF_GRID = '1.3fr 56px 110px 90px 90px 100px 90px 80px 18px';

function pvColor(v: number | null): string {
  if (v == null) return 'var(--muted)';
  return v >= 0 ? 'var(--good)' : 'var(--bad)';
}

// Plus-value €/% (valorisation-bourse-temps-reel, ticket 06) — "—" tant que le coût
// d'acquisition n'est pas saisi ou qu'aucune Valorisation n'existe pour la Ligne.
function plusValue(line: BourseLine): { eur: number; pct: number } | null {
  if (line.cout_acquisition_unitaire == null || line.date_derniere_valorisation == null || line.quantite == null) {
    return null;
  }
  const cout = line.quantite * line.cout_acquisition_unitaire;
  const eur = line.valeur_actuelle - cout;
  return { eur, pct: cout !== 0 ? (eur / cout) * 100 : 0 };
}

function coursActuel(line: BourseLine): number | null {
  if (line.quantite == null || line.quantite === 0) return null;
  return line.valeur_actuelle / line.quantite;
}

function envelopeAggregate(envelope: BourseEnvelope): number | null {
  let sum = 0;
  let has = false;
  for (const line of envelope.lines) {
    const pv = plusValue(line);
    if (pv) {
      sum += pv.eur;
      has = true;
    }
  }
  return has ? sum : null;
}

export function BourseDashboard({ entities, notify, onDomainAction }: Props) {
  const [envelopes, setEnvelopes] = useState<BourseEnvelope[] | null>(null);
  const [openLineId, setOpenLineId] = useState<number | null>(null);
  const [showCreateEnveloppe, setShowCreateEnveloppe] = useState(false);
  const [addLigneEnvelope, setAddLigneEnvelope] = useState<BourseEnvelope | null>(null);
  const [editingEnvelope, setEditingEnvelope] = useState<BourseEnvelope | null>(null);
  const [editingLine, setEditingLine] = useState<{ envelope: BourseEnvelope; line: BourseLine } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailures, setRefreshFailures] = useState<Record<number, EchecRaison>>({});

  const load = () => {
    api.bourse
      .listEnvelopes('all')
      .then(setEnvelopes)
      .catch(() => notify('Erreur de chargement des comptes', true));
  };

  useEffect(load, []);

  const runRefresh = async () => {
    setRefreshing(true);
    try {
      const { rafraichies, echecs } = await api.bourse.refreshCours('all');
      setRefreshFailures(Object.fromEntries(echecs.map((e) => [e.line_id, e.reason])));
      load();
      notify(
        echecs.length > 0
          ? `Cours actualisés : ${rafraichies.length} réussi(s), ${echecs.length} échec(s)`
          : `Cours actualisés : ${rafraichies.length} titre(s)`,
        echecs.length > 0
      );
    } catch (err) {
      notify((err as Error).message, true);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!onDomainAction) return;
    if (envelopes && envelopes.length > 0) {
      onDomainAction({
        label: 'Actualiser les cours',
        busyLabel: 'Actualisation…',
        busy: refreshing,
        onClick: runRefresh,
      });
    } else {
      onDomainAction(null);
    }
    return () => onDomainAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envelopes, refreshing]);

  const createEnveloppe = async (data: NewEnveloppeData) => {
    await api.bourse.createEnvelope(data);
    notify('Nouveau compte créé');
    setShowCreateEnveloppe(false);
    load();
  };

  const createLigne = async (envelope: BourseEnvelope, data: NewBourseLigneData) => {
    await api.bourse.createLine(envelope.id, data);
    notify('Titre ajouté au compte');
    setAddLigneEnvelope(null);
    load();
  };

  const saveEnveloppe = async (data: EditEnveloppeData) => {
    if (!editingEnvelope) return;
    try {
      await api.bourse.updateEnvelope(editingEnvelope.id, data);
      notify('Compte mis à jour');
      setEditingEnvelope(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const saveLigne = async (data: EditLigneData) => {
    if (!editingLine) return;
    try {
      await api.bourse.updateLine(editingLine.line.id, data);
      notify('Titre mis à jour');
      setEditingLine(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
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
    if (!window.confirm(`Supprimer le compte « ${envelope.libelle} » et tous ses titres ?`)) return;
    try {
      await api.bourse.deleteEnvelope(envelope.id);
      notify('Compte supprimé', true);
      setOpenLineId(null);
      load();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  return (
    <div className="dash-main">
      <div className="dash-toolbar">
        <h2>Bourse</h2>
        <button type="button" className="btn primary" onClick={() => setShowCreateEnveloppe(true)}>
          + Ajouter
        </button>
      </div>

      <div className="card">
        {envelopes === null ? (
          <div className="empty-state">Chargement…</div>
        ) : envelopes.length === 0 ? (
          <div className="empty-state">Aucun compte Bourse pour le moment.</div>
        ) : (
          envelopes.map((envelope) => {
            const entity = entities.find((e) => e.id === envelope.entity_id);
            const aggregate = envelopeAggregate(envelope);
            return (
              <div key={envelope.id}>
                <div className="env-group-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {envelope.libelle} · {envelope.type}
                    {envelope.date_ouverture ? ` · ouvert ${fmtDate(envelope.date_ouverture)}` : ''}
                    {envelope.statut ? ` · ${envelope.statut}` : ''}
                    {entity ? ` · ${entity.libelle}` : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {aggregate != null && (
                      <span className="mono" style={{ color: pvColor(aggregate), fontSize: 11 }}>
                        {aggregate >= 0 ? '+' : ''}
                        {euros(aggregate)}
                      </span>
                    )}
                    <span className="mono">{euros(envelope.valeur_totale)}</span>
                    <button type="button" className="btn small ghost" onClick={() => setAddLigneEnvelope(envelope)}>
                      + Titre
                    </button>
                    <button type="button" className="btn small ghost" onClick={() => setEditingEnvelope(envelope)}>
                      Modifier
                    </button>
                    <button type="button" className="btn small ghost danger" onClick={() => deleteEnveloppe(envelope)}>
                      Supprimer
                    </button>
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: PERF_GRID,
                    gap: 8,
                    padding: '4px 20px',
                    fontSize: 10,
                    color: 'var(--muted)',
                    fontFamily: 'IBM Plex Mono',
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                  }}
                >
                  <span>Titre</span>
                  <span style={{ textAlign: 'right' }}>Qté</span>
                  <span>ISIN</span>
                  <span style={{ textAlign: 'right' }}>Coût acq.</span>
                  <span style={{ textAlign: 'right' }}>Cours</span>
                  <span style={{ textAlign: 'right' }}>Valorisation</span>
                  <span style={{ textAlign: 'right' }}>PV €</span>
                  <span style={{ textAlign: 'right' }}>PV %</span>
                  <span />
                </div>
                {envelope.lines.filter((l) => !l.est_compte_especes).length === 0 && (
                  <div className="empty-state" style={{ padding: '10px 20px' }}>
                    Aucun titre pour l’instant — ajoutez-en un via « + Titre ».
                  </div>
                )}
                {envelope.lines.map((line) => {
                  const isOpen = openLineId === line.id;
                  const pv = plusValue(line);
                  const cours = coursActuel(line);
                  const failure = refreshFailures[line.id];
                  return (
                    <div className={`ledger-row ${isOpen ? 'open' : ''}`} key={line.id}>
                      <div
                        onClick={() => setOpenLineId(isOpen ? null : line.id)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: PERF_GRID,
                          gap: 8,
                          alignItems: 'center',
                          padding: '10px 20px',
                          cursor: 'pointer',
                        }}
                      >
                        <div>
                          <div className="name">{line.libelle}</div>
                          {Boolean(line.est_compte_especes) && <div className="sub">Compte espèces</div>}
                        </div>
                        <div className="mono" style={{ textAlign: 'right', fontSize: 12 }}>
                          {line.est_compte_especes ? '—' : line.quantite ?? '—'}
                        </div>
                        <div className="mono" style={{ fontSize: 11 }}>
                          {line.est_compte_especes ? (
                            '—'
                          ) : line.isin ? (
                            line.isin
                          ) : (
                            <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>non saisi</span>
                          )}
                        </div>
                        <div className="mono" style={{ textAlign: 'right', fontSize: 12 }}>
                          {line.est_compte_especes ? '—' : line.cout_acquisition_unitaire != null ? euros(line.cout_acquisition_unitaire) : '—'}
                        </div>
                        <div className="mono" style={{ textAlign: 'right', fontSize: 12 }}>
                          {line.est_compte_especes ? (
                            '—'
                          ) : failure ? (
                            <span title={FAIL_REASON_LABEL[failure]} style={{ color: 'var(--bad)' }}>
                              ⚠
                            </span>
                          ) : cours != null ? (
                            euros(cours)
                          ) : (
                            '—'
                          )}
                        </div>
                        <div className="mono" style={{ textAlign: 'right', fontSize: 12 }}>{euros(line.valeur_actuelle)}</div>
                        <div className="mono" style={{ textAlign: 'right', fontSize: 12, color: pvColor(pv?.eur ?? null) }}>
                          {pv ? `${pv.eur >= 0 ? '+' : ''}${euros(pv.eur)}` : '—'}
                        </div>
                        <div className="mono" style={{ textAlign: 'right', fontSize: 12, color: pvColor(pv?.pct ?? null) }}>
                          {pv ? `${pv.pct >= 0 ? '+' : ''}${pct(pv.pct)}` : '—'}
                        </div>
                        <div className="chev">›</div>
                      </div>
                      {isOpen && (
                        <div className="ledger-row-body">
                          <BourseLigneJournal line={line} notify={notify} onLineChanged={load} />
                          <div style={{ padding: '0 22px', display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn ghost small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingLine({ envelope, line });
                              }}
                            >
                              Modifier le titre
                            </button>
                            {line.est_compte_especes ? (
                              <span className="muted-hint" title="Le compte espèces ne se supprime pas seul — supprimez le compte pour le retirer.">
                                Le compte espèces se supprime avec le compte
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

      {editingEnvelope && (
        <EditEnveloppeBourseModal
          envelope={editingEnvelope}
          onCancel={() => setEditingEnvelope(null)}
          onSave={saveEnveloppe}
        />
      )}

      {editingLine && (
        <EditLigneBourseModal
          envelope={editingLine.envelope}
          line={editingLine.line}
          onCancel={() => setEditingLine(null)}
          onSave={saveLigne}
        />
      )}
    </div>
  );
}
