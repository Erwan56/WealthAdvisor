import { useEffect, useState } from 'react';
import { api } from '../api';
import { euros, fmtDate, today } from '../format';
import type { BourseLine, Valorisation } from '../types';

interface Props {
  line: BourseLine;
  notify: (message: string, warn?: boolean) => void;
  onLineChanged: () => void;
}

export function BourseLigneJournal({ line, notify, onLineChanged }: Props) {
  const [history, setHistory] = useState<Valorisation[] | null>(null);
  const [newDate, setNewDate] = useState(today());
  const [newValeur, setNewValeur] = useState(String(line.valeur_actuelle));
  const mouvementOptions = line.est_compte_especes
    ? [
        { value: 'versement', label: 'Versement' },
        { value: 'retrait', label: 'Retrait' },
      ]
    : [
        { value: 'achat', label: 'Achat' },
        { value: 'vente', label: 'Vente' },
      ];
  const [mouvementType, setMouvementType] = useState(mouvementOptions[0].value);
  const [mouvementMontant, setMouvementMontant] = useState('');
  const [mouvementQuantite, setMouvementQuantite] = useState('');
  const [mouvementPrixUnitaire, setMouvementPrixUnitaire] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editValeur, setEditValeur] = useState('');

  const load = () => {
    api.bourse.listValorisations(line.id).then(setHistory).catch(() => notify('Erreur de chargement', true));
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
      const montant = mouvementMontant ? Number(mouvementMontant) : undefined;
      const quantite = mouvementQuantite ? Number(mouvementQuantite) : undefined;
      const prix_unitaire = mouvementPrixUnitaire ? Number(mouvementPrixUnitaire) : undefined;
      const hasMouvement = montant !== undefined || quantite !== undefined || prix_unitaire !== undefined;
      await api.bourse.addValorisation(line.id, {
        date: newDate,
        valeur,
        mouvement: hasMouvement ? { type: mouvementType, montant, quantite, prix_unitaire } : undefined,
      });
      notify('Nouvelle entrée ajoutée au journal');
      setMouvementMontant('');
      setMouvementQuantite('');
      setMouvementPrixUnitaire('');
      load();
      onLineChanged();
    } catch (err) {
      notify((err as Error).message, true);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (entry: Valorisation) => {
    setEditingId(entry.id);
    setEditDate(entry.date);
    setEditValeur(String(entry.valeur));
  };

  const confirmEdit = async () => {
    if (editingId === null) return;
    try {
      await api.bourse.updateValorisation(editingId, { date: editDate, valeur: Number(editValeur) });
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
      await api.bourse.deleteValorisation(id);
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
            <label>Valeur</label>
            <input type="number" value={newValeur} onChange={(e) => setNewValeur(e.target.value)} />
          </div>
        </div>
        <details className="disclosure">
          <summary>Associer un mouvement ({line.est_compte_especes ? 'versement, retrait…' : 'achat, vente…'})</summary>
          <div className="disclosure-body">
            <div className="field-row">
              <label>Type</label>
              <select className="field-input" value={mouvementType} onChange={(e) => setMouvementType(e.target.value)}>
                {mouvementOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {line.est_compte_especes ? (
              <div className="field-row">
                <label>Montant</label>
                <input
                  className="field-input"
                  type="number"
                  value={mouvementMontant}
                  onChange={(e) => setMouvementMontant(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="field-row">
                  <label>Quantité</label>
                  <input
                    className="field-input"
                    type="number"
                    value={mouvementQuantite}
                    onChange={(e) => setMouvementQuantite(e.target.value)}
                  />
                </div>
                <div className="field-row">
                  <label>Prix unitaire</label>
                  <input
                    className="field-input"
                    type="number"
                    value={mouvementPrixUnitaire}
                    onChange={(e) => setMouvementPrixUnitaire(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </details>
        <div className="btn-row" style={{ padding: '12px 0 0' }}>
          <button type="button" className="btn primary" disabled={saving} onClick={addEntry}>
            Ajouter au journal
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
              const pct = prev.valeur !== 0 ? ((d / prev.valeur) * 100).toFixed(1) : '—';
              delta = (
                <span className={`delta ${d >= 0 ? 'up' : 'down'}`}>
                  {d >= 0 ? '+' : ''}
                  {euros(d)} ({d >= 0 ? '+' : ''}
                  {pct}%)
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
