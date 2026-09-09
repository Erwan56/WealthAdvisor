import { useState } from 'react';
import type { PeScpiLine } from '../types';

export interface EditPeScpiLigneData {
  libelle: string;
  nombre_parts?: number | null;
}

interface Props {
  line: PeScpiLine;
  onCancel: () => void;
  onSave: (data: EditPeScpiLigneData) => Promise<void>;
}

export function EditLigneScpiModal({ line, onCancel, onSave }: Props) {
  const [libelle, setLibelle] = useState(line.libelle);
  const [nombreParts, setNombreParts] = useState(line.nombre_parts !== null ? String(line.nombre_parts) : '');
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
        nombre_parts: nombreParts ? Number(nombreParts) : null,
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
          <h3>Modifier la part</h3>
          <p>{line.libelle}</p>
        </div>

        <div className="field-row">
          <label>Libellé</label>
          <input className="field-input" value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="ex. Souscription 2024" />
        </div>
        <div className="field-row">
          <label>Nombre de parts</label>
          <input className="field-input" type="number" value={nombreParts} onChange={(e) => setNombreParts(e.target.value)} />
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
