import { useState } from 'react';
import { BOURSE_ENVELOPE_TYPES, type BourseEnvelope, type BourseEnvelopeType } from '../types';

export interface EditEnveloppeData {
  libelle: string;
  type: BourseEnvelopeType;
  date_ouverture?: string | null;
  statut?: string | null;
}

interface Props {
  envelope: BourseEnvelope;
  onCancel: () => void;
  onSave: (data: EditEnveloppeData) => Promise<void>;
}

export function EditEnveloppeBourseModal({ envelope, onCancel, onSave }: Props) {
  const [libelle, setLibelle] = useState(envelope.libelle);
  const [type, setType] = useState<BourseEnvelopeType>(envelope.type);
  const [dateOuverture, setDateOuverture] = useState(envelope.date_ouverture ?? '');
  const [statut, setStatut] = useState(envelope.statut ?? 'Actif');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!libelle.trim()) {
      setError('Libellé du compte requis');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        libelle: libelle.trim(),
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
          <h3>Modifier le compte</h3>
          <p>{envelope.libelle}</p>
        </div>

        <div className="field-row">
          <label>Libellé du compte</label>
          <input className="field-input" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Type</label>
          <select className="field-input" value={type} onChange={(e) => setType(e.target.value as BourseEnvelopeType)}>
            {BOURSE_ENVELOPE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label>Date d’ouverture</label>
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
