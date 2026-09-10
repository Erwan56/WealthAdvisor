import { useEffect, useState } from 'react';
import { api } from '../api';
import { euros, fmtDate, today } from '../format';
import type { ImmobilierLine, ImmobilierValorisation } from '../types';

interface Props {
  line: ImmobilierLine;
  notify: (message: string, warn?: boolean) => void;
  onLineChanged: () => void;
}

function pretConfigure(line: ImmobilierLine): boolean {
  return (
    line.capital_emprunte_initial != null &&
    line.taux_annuel != null &&
    line.duree_mois != null &&
    line.date_depart != null
  );
}

export function ImmobilierLigneJournal({ line, notify, onLineChanged }: Props) {
  const [history, setHistory] = useState<ImmobilierValorisation[] | null>(null);
  const [newDate, setNewDate] = useState(today());
  const [newValeur, setNewValeur] = useState(String(line.valeur_actuelle));
  const hasPret = pretConfigure(line);
  const [capitalRestantDu, setCapitalRestantDu] = useState(line.capital_restant_du != null ? String(line.capital_restant_du) : '');
  const [mensualite, setMensualite] = useState(line.mensualite != null ? String(line.mensualite) : '');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editValeur, setEditValeur] = useState('');

  const [loyer, setLoyer] = useState(line.loyer != null ? String(line.loyer) : '');
  const [charges, setCharges] = useState(line.charges != null ? String(line.charges) : '');
  const [taxeFonciere, setTaxeFonciere] = useState(line.taxe_fonciere != null ? String(line.taxe_fonciere) : '');
  const [assurance, setAssurance] = useState(line.assurance != null ? String(line.assurance) : '');
  const [fraisGestion, setFraisGestion] = useState(line.frais_gestion != null ? String(line.frais_gestion) : '');
  const [savingLocatif, setSavingLocatif] = useState(false);

  const load = () => {
    api.immobilier.listValorisations(line.id).then(setHistory).catch(() => notify('Erreur de chargement', true));
  };

  useEffect(load, [line.id]);

  const addEntry = async () => {
    const valeur = Number(newValeur);
    if (!newDate || Number.isNaN(valeur)) {
      notify('Date et valeur requises', true);
      return;
    }
    setSaving(true);
    try {
      await api.immobilier.addValorisation(line.id, {
        date: newDate,
        valeur,
        capital_restant_du: !hasPret && capitalRestantDu ? Number(capitalRestantDu) : undefined,
        mensualite: !hasPret && mensualite ? Number(mensualite) : undefined,
      });
      notify('Nouvelle entrée ajoutée au journal');
      load();
      onLineChanged();
    } catch (err) {
      notify((err as Error).message, true);
    } finally {
      setSaving(false);
    }
  };

  // « Modifier » (ticket 10) — met à jour la dernière Valorisation en place plutôt que
  // d'en créer une nouvelle : loyer/charges/taxe foncière/assurance/frais de gestion sont
  // des faits qui changent sans que ce soit un nouveau point d'historique de valeur.
  const saveLocatif = async () => {
    if (!history || history.length === 0) return;
    const latest = history[history.length - 1];
    setSavingLocatif(true);
    try {
      await api.immobilier.updateValorisation(latest.id, {
        loyer: loyer ? Number(loyer) : undefined,
        charges: charges ? Number(charges) : undefined,
        taxe_fonciere: taxeFonciere ? Number(taxeFonciere) : undefined,
        assurance: assurance ? Number(assurance) : undefined,
        frais_gestion: fraisGestion ? Number(fraisGestion) : undefined,
      });
      notify('Paramètres locatifs mis à jour');
      load();
      onLineChanged();
    } catch (err) {
      notify((err as Error).message, true);
    } finally {
      setSavingLocatif(false);
    }
  };

  const startEdit = (entry: ImmobilierValorisation) => {
    setEditingId(entry.id);
    setEditDate(entry.date);
    setEditValeur(String(entry.valeur));
  };

  const confirmEdit = async () => {
    if (editingId === null) return;
    try {
      await api.immobilier.updateValorisation(editingId, { date: editDate, valeur: Number(editValeur) });
      notify('Entrée corrigée');
      setEditingId(null);
      load();
      onLineChanged();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const removeEntry = async (id: number) => {
    if (!window.confirm('Supprimer cette entrée du journal ?')) return;
    try {
      await api.immobilier.deleteValorisation(id);
      notify('Entrée supprimée', true);
      load();
      onLineChanged();
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const rev = history ? [...history].reverse() : [];

  return (
    <div className="journal">
      <div className="journal-new">
        <div className="jn-title">Nouvelle entrée</div>
        <div className="grid">
          <div>
            <label>Date</label>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </div>
          <div>
            <label>Valeur estimée</label>
            <input type="number" value={newValeur} onChange={(e) => setNewValeur(e.target.value)} />
          </div>
        </div>
        {hasPret ? (
          <div className="jn-hint">Capital restant dû et mensualité sont calculés depuis le Prêt immobilier configuré.</div>
        ) : (
          <details className="disclosure">
            <summary>Prêt (capital restant dû, mensualité)</summary>
            <div className="disclosure-body">
              <div className="field-row">
                <label>Capital restant dû</label>
                <input className="field-input" type="number" value={capitalRestantDu} onChange={(e) => setCapitalRestantDu(e.target.value)} />
              </div>
              <div className="field-row">
                <label>Mensualité de prêt</label>
                <input className="field-input" type="number" value={mensualite} onChange={(e) => setMensualite(e.target.value)} />
              </div>
            </div>
          </details>
        )}
        <div className="btn-row" style={{ padding: '12px 0 0' }}>
          <button type="button" className="btn primary" disabled={saving} onClick={addEntry}>
            Ajouter au journal
          </button>
        </div>
      </div>

      <div className="journal-new">
        <div className="jn-title">Paramètres locatifs courants</div>
        <div className="grid">
          <div>
            <label>Loyer mensuel</label>
            <input type="number" value={loyer} onChange={(e) => setLoyer(e.target.value)} />
          </div>
          <div>
            <label>Charges mensuelles</label>
            <input type="number" value={charges} onChange={(e) => setCharges(e.target.value)} />
          </div>
          <div>
            <label>Taxe foncière annuelle</label>
            <input type="number" value={taxeFonciere} onChange={(e) => setTaxeFonciere(e.target.value)} />
          </div>
          <div>
            <label>Assurance mensuelle</label>
            <input type="number" value={assurance} onChange={(e) => setAssurance(e.target.value)} />
          </div>
          <div>
            <label>Frais de gestion mensuels</label>
            <input type="number" value={fraisGestion} onChange={(e) => setFraisGestion(e.target.value)} />
          </div>
        </div>
        <div className="btn-row" style={{ padding: '12px 0 0' }}>
          <button
            type="button"
            className="btn primary"
            disabled={savingLocatif || !history || history.length === 0}
            onClick={saveLocatif}
          >
            Modifier
          </button>
        </div>
      </div>

      {history === null ? (
        <div className="t-empty">Chargement…</div>
      ) : rev.length === 0 ? (
        <div className="t-empty">Aucune Valorisation antérieure — ce sera la première entrée du journal.</div>
      ) : (
        <div className="timeline">
          {rev.map((entry, i) => {
            if (editingId === entry.id) {
              return (
                <div className="t-edit-row" key={entry.id}>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                  <input type="number" value={editValeur} onChange={(e) => setEditValeur(e.target.value)} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn small primary" onClick={confirmEdit}>
                      OK
                    </button>
                    <button type="button" className="btn small ghost" onClick={() => setEditingId(null)}>
                      Annuler
                    </button>
                  </div>
                </div>
              );
            }
            const prev = rev[i + 1];
            let delta: React.ReactNode = (
              <span className="delta up" style={{ opacity: 0.6 }}>
                première entrée
              </span>
            );
            if (prev) {
              const d = entry.valeur - prev.valeur;
              const pctVal = prev.valeur !== 0 ? ((d / prev.valeur) * 100).toFixed(1) : '—';
              delta = (
                <span className={`delta ${d >= 0 ? 'up' : 'down'}`}>
                  {d >= 0 ? '+' : ''}
                  {euros(d)} ({d >= 0 ? '+' : ''}
                  {pctVal}%)
                </span>
              );
            }
            return (
              <div className={`t-item ${i === 0 ? 'first' : ''}`} key={entry.id}>
                <div className="d">{fmtDate(entry.date)}</div>
                <div className="v">{euros(entry.valeur)}</div>
                {delta}
                <div className="actions">
                  <button type="button" className="btn icon ghost" title="Corriger" onClick={() => startEdit(entry)}>
                    ✎
                  </button>
                  <button
                    type="button"
                    className="btn icon ghost danger"
                    title="Supprimer"
                    onClick={() => removeEntry(entry.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
