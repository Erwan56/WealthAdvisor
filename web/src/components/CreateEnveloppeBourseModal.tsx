import { useState } from 'react';
import { BOURSE_ENVELOPE_TYPES, type BourseEnvelopeType, type Entity } from '../types';

export interface NewEnveloppeData {
  entity_id: number;
  libelle: string;
  type: BourseEnvelopeType;
  date_ouverture?: string;
  statut?: string;
}

interface Props {
  entities: Entity[];
  onCancel: () => void;
  onCreate: (data: NewEnveloppeData) => Promise<void>;
}

export function CreateEnveloppeBourseModal({ entities, onCancel, onCreate }: Props) {
  const [entityId, setEntityId] = useState<number | ''>('');
  const [envLibelle, setEnvLibelle] = useState('');
  const [type, setType] = useState<BourseEnvelopeType>('PEA');
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
      setError('Libellé du compte requis');
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
          <h3>Nouveau compte — Bourse</h3>
          <p>PEA, PEA-PME ou CTO. Un compte espèces est créé automatiquement ; ajoutez ensuite un titre via « + Titre ».</p>
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
          <label>Libellé du compte</label>
          <input
            className="field-input"
            value={envLibelle}
            onChange={(e) => setEnvLibelle(e.target.value)}
            placeholder="ex. PEA — Boursorama"
          />
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
            Créer le compte
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
