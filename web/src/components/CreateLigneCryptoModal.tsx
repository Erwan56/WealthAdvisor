import { useState } from 'react';
import { today } from '../format';
import type { CryptoEnvelope } from '../types';

export interface NewCryptoLigneData {
  libelle: string;
  symbole: string;
  quantite: number;
  valeur_initiale: number;
  date: string;
}

interface Props {
  envelope: CryptoEnvelope;
  onCancel: () => void;
  onCreate: (data: NewCryptoLigneData) => Promise<void>;
}

export function CreateLigneCryptoModal({ envelope, onCancel, onCreate }: Props) {
  const [symbole, setSymbole] = useState('');
  const [quantite, setQuantite] = useState('');
  const [valeur, setValeur] = useState('');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!symbole.trim()) {
      setError('Symbole requis');
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
        libelle: symbole.trim(),
        symbole: symbole.trim(),
        quantite: Number(quantite),
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
          <h3>Nouvel actif — {envelope.libelle}</h3>
          <p>Ajoute une Ligne-actif directement dans ce portefeuille.</p>
        </div>

        <div className="field-row highlight">
          <label>Symbole</label>
          <input className="field-input" value={symbole} onChange={(e) => setSymbole(e.target.value)} placeholder="ex. BTC, ETH…" />
        </div>
        <div className="field-row">
          <label>Quantité</label>
          <input className="field-input" type="number" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
        </div>
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
            Ajouter l'actif
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
