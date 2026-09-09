import { useState } from 'react';
import type { CryptoLine } from '../types';

export interface EditLigneData {
  libelle: string;
  symbole?: string | null;
  quantite?: number | null;
}

interface Props {
  line: CryptoLine;
  onCancel: () => void;
  onSave: (data: EditLigneData) => Promise<void>;
}

export function EditLigneCryptoModal({ line, onCancel, onSave }: Props) {
  const [libelle, setLibelle] = useState(line.libelle);
  const [symbole, setSymbole] = useState(line.symbole ?? '');
  const [quantite, setQuantite] = useState(line.quantite !== null ? String(line.quantite) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!libelle.trim()) {
      setError('Libellé requis');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        libelle: libelle.trim(),
        symbole: symbole.trim() || null,
        quantite: quantite ? Number(quantite) : null,
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
          <h3>Modifier l'actif</h3>
          <p>{line.libelle}</p>
        </div>

        <div className="field-row highlight">
          <label>Symbole</label>
          <input className="field-input" value={symbole} onChange={(e) => setSymbole(e.target.value)} placeholder="ex. BTC, ETH…" />
        </div>
        <div className="field-row">
          <label>Libellé</label>
          <input className="field-input" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Quantité</label>
          <input className="field-input" type="number" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
        </div>

        {error && <div className="error-banner" style={{ margin: '0 22px 12px' }}>{error}</div>}

        <div className="btn-row">
          <button type="button" className="btn primary" disabled={saving} onClick={submit}>
            Enregistrer
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
