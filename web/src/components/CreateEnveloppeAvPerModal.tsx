import { useState } from 'react';
import { AV_PER_ENVELOPE_TYPES, type AvPerEnvelopeType, type Entity } from '../types';

export interface NewAvPerEnveloppeData {
  entity_id: number;
  libelle: string;
  type: AvPerEnvelopeType;
  date_ouverture?: string;
  statut?: string;
}

interface Props {
  entities: Entity[];
  onCancel: () => void;
  onCreate: (data: NewAvPerEnveloppeData) => Promise<void>;
}

export function CreateEnveloppeAvPerModal({ entities, onCancel, onCreate }: Props) {
  const [entityId, setEntityId] = useState<number | ''>('');
  const [envLibelle, setEnvLibelle] = useState('');
  const [type, setType] = useState<AvPerEnvelopeType>('assurance_vie');
  const [dateOuverture, setDateOuverture] = useState('');
  const [statut, setStatut] = useState('Actif');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!entityId) {
      setError('Choisissez une Entité');
      return;
    }
    if (!envLibelle.trim()) {
      setError('Libellé du contrat requis');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        entity_id: entityId,
        libelle: envLibelle.trim(),
        type,
        date_ouverture: dateOuverture || undefined,
        statut: statut || undefined,
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
          <h3>Nouveau contrat — Assurance-vie / PER</h3>
          <p>Le contrat, sans premier support — ajoutez-en un ensuite via « + Support ».</p>
        </div>

        <div className="field-row">
          <label>Entité</label>
          <select
            className="field-input"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">— Choisir —</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.libelle}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label>Libellé du contrat</label>
          <input
            className="field-input"
            value={envLibelle}
            onChange={(e) => setEnvLibelle(e.target.value)}
            placeholder="ex. Assurance-vie — Linxea Spirit"
          />
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
            Créer le contrat
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
