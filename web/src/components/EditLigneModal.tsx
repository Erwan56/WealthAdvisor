import { useState } from 'react';
import type { LiquiditeLine } from '../types';

export interface EditLigneData {
  libelle: string;
  type_compte?: string | null;
  plafond?: number | null;
  taux?: number | null;
  banque?: string | null;
}

interface Props {
  line: LiquiditeLine;
  onCancel: () => void;
  onSave: (data: EditLigneData) => Promise<void>;
}

export function EditLigneModal({ line, onCancel, onSave }: Props) {
  const [libelle, setLibelle] = useState(line.libelle);
  const [typeCompte, setTypeCompte] = useState(line.type_compte ?? '');
  const [plafond, setPlafond] = useState(line.plafond !== null ? String(line.plafond) : '');
  const [taux, setTaux] = useState(line.taux !== null ? String(line.taux) : '');
  const [banque, setBanque] = useState(line.banque ?? '');
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
        type_compte: typeCompte.trim() || null,
        plafond: plafond ? Number(plafond) : null,
        taux: taux ? Number(taux) : null,
        banque: banque.trim() || null,
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
          <h3>Modifier la Ligne</h3>
          <p>{line.libelle}</p>
        </div>

        <div className="field-row">
          <label>Libellé</label>
          <input className="field-input" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Type de compte</label>
          <input className="field-input" value={typeCompte} onChange={(e) => setTypeCompte(e.target.value)} placeholder="ex. Livret A, LDDS, compte courant…" />
        </div>
        <div className="field-row">
          <label>Banque</label>
          <input className="field-input" value={banque} onChange={(e) => setBanque(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Plafond du livret</label>
          <input className="field-input" type="number" value={plafond} onChange={(e) => setPlafond(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Taux de rémunération actuel (%)</label>
          <input className="field-input" type="number" step="0.01" value={taux} onChange={(e) => setTaux(e.target.value)} />
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
