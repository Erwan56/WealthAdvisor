import { useState } from 'react';
import { OBJECTIF_TEMPLATES } from '../types';

interface Props {
  onCancel: () => void;
  onCreate: (keys: string[]) => Promise<void>;
}

export function TemplatesObjectifModal({ onCancel, onCreate }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) => setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const submit = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await onCreate(selected);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="create-panel">
        <div className="create-panel-head">
          <h3>Partir de modèles suggérés</h3>
          <p>Chaque Objectif reste ensuite modifiable individuellement.</p>
        </div>
        <div style={{ padding: '10px 22px 4px' }} className="type-choice">
          {OBJECTIF_TEMPLATES.map((t) => (
            <label key={t.key} className={`type-option ${selected.includes(t.key) ? 'selected' : ''}`}>
              <input type="checkbox" checked={selected.includes(t.key)} onChange={() => toggle(t.key)} />
              <div className="to-name">{t.libelle}</div>
            </label>
          ))}
        </div>
        <div className="btn-row">
          <button type="button" className="btn primary" disabled={saving || selected.length === 0} onClick={submit}>
            Créer {selected.length > 0 ? `(${selected.length})` : ''}
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
