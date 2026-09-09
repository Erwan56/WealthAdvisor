import { useState } from 'react';
import { AV_PER_SUPPORT_TYPES, type AvPerLine, type AvPerSupportType } from '../types';

export interface EditAvPerLigneData {
  libelle: string;
  nom_support?: string | null;
  type_support?: AvPerSupportType | null;
}

interface Props {
  line: AvPerLine;
  onCancel: () => void;
  onSave: (data: EditAvPerLigneData) => Promise<void>;
}

export function EditLigneAvPerModal({ line, onCancel, onSave }: Props) {
  const [nomSupport, setNomSupport] = useState(line.nom_support ?? line.libelle);
  const [typeSupport, setTypeSupport] = useState<AvPerSupportType>(line.type_support ?? 'fonds_euro');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!nomSupport.trim()) {
      setError('Nom du support requis');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        libelle: nomSupport.trim(),
        nom_support: nomSupport.trim(),
        type_support: typeSupport,
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
          <h3>Modifier le support</h3>
          <p>{line.libelle}</p>
        </div>

        <div className="field-row">
          <label>Nom</label>
          <input className="field-input" value={nomSupport} onChange={(e) => setNomSupport(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Type de support</label>
          <select className="field-input" value={typeSupport} onChange={(e) => setTypeSupport(e.target.value as AvPerSupportType)}>
            {AV_PER_SUPPORT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'fonds_euro' ? 'Fonds euro' : 'Unité de compte'}
              </option>
            ))}
          </select>
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
