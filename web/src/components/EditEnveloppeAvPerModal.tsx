import { useState } from 'react';
import { AV_PER_ENVELOPE_TYPES, type AvPerEnvelope, type AvPerEnvelopeType } from '../types';

export interface EditAvPerEnveloppeData {
  libelle: string;
  type: AvPerEnvelopeType;
  date_ouverture?: string | null;
  statut?: string | null;
}

interface Props {
  envelope: AvPerEnvelope;
  onCancel: () => void;
  onSave: (data: EditAvPerEnveloppeData) => Promise<void>;
}

export function EditEnveloppeAvPerModal({ envelope, onCancel, onSave }: Props) {
  const [envLibelle, setEnvLibelle] = useState(envelope.libelle);
  const [type, setType] = useState<AvPerEnvelopeType>(envelope.type);
  const [dateOuverture, setDateOuverture] = useState(envelope.date_ouverture ?? '');
  const [statut, setStatut] = useState(envelope.statut ?? 'Actif');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!envLibelle.trim()) {
      setError('Libellé du contrat requis');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        libelle: envLibelle.trim(),
        type,
        date_ouverture: dateOuverture || null,
        statut: statut || null,
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
          <h3>Modifier le contrat</h3>
          <p>{envelope.libelle}</p>
        </div>

        <div className="field-row">
          <label>Libellé du contrat</label>
          <input className="field-input" value={envLibelle} onChange={(e) => setEnvLibelle(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Type</label>
          <select className="field-input" value={type} onChange={(e) => setType(e.target.value as AvPerEnvelopeType)}>
            {AV_PER_ENVELOPE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'assurance_vie' ? 'Assurance-vie' : 'PER'}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label>Date d'ouverture</label>
          <input className="field-input" type="date" value={dateOuverture} onChange={(e) => setDateOuverture(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Statut</label>
          <select className="field-input" value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="Actif">Actif</option>
            <option value="Clôturé">Clôturé</option>
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
