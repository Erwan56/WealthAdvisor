import { useState } from 'react';
import { today } from '../format';
import type { BourseEnvelope } from '../types';

export interface NewBourseLigneData {
  libelle: string;
  nom_isin?: string;
  quantite?: number;
  pru?: number;
  valeur_initiale: number;
  date: string;
}

interface Props {
  envelope: BourseEnvelope;
  onCancel: () => void;
  onCreate: (data: NewBourseLigneData) => Promise<void>;
}

export function CreateLigneBourseModal({ envelope, onCancel, onCreate }: Props) {
  const [nomIsin, setNomIsin] = useState('');
  const [quantite, setQuantite] = useState('');
  const [pru, setPru] = useState('');
  const [valeur, setValeur] = useState('');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!nomIsin.trim()) {
      setError('Nom / ISIN requis');
      return;
    }
    if (!quantite) {
      setError('Quantité requise');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        libelle: nomIsin.trim(),
        nom_isin: nomIsin.trim(),
        quantite: quantite ? Number(quantite) : undefined,
        pru: envelope.type === 'CTO' && pru ? Number(pru) : undefined,
        valeur_initiale: valeur ? Number(valeur) : 0,
        date,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="create-panel">
        <div className="create-panel-head">
          <h3>Nouveau titre — {envelope.libelle}</h3>
          <p>Ajoute une Ligne-titre directement dans cette Enveloppe.</p>
        </div>

        <div className="field-row highlight">
          <label>Nom / ISIN</label>
          <input
            className="field-input"
            value={nomIsin}
            onChange={(e) => setNomIsin(e.target.value)}
            placeholder="ex. LVMH — FR0000121014"
          />
        </div>
        <div className="field-row">
          <label>Quantité</label>
          <input className="field-input" type="number" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
        </div>
        {envelope.type === 'CTO' && (
          <div className="field-row">
            <label>Prix de revient moyen pondéré</label>
            <input className="field-input" type="number" value={pru} onChange={(e) => setPru(e.target.value)} />
          </div>
        )}
        <div className="field-row highlight">
          <label>Date de la valorisation</label>
          <input className="field-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Valeur actuelle</label>
          <input className="field-input" type="number" value={valeur} onChange={(e) => setValeur(e.target.value)} />
        </div>

        {error && <div className="error-banner" style={{ margin: '0 22px 12px' }}>{error}</div>}

        <div className="btn-row">
          <button type="button" className="btn primary" disabled={saving} onClick={submit}>
            Ajouter le titre
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
