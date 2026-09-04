import { useState } from 'react';
import type { EntityType } from '../types';

interface Props {
  onCancel: () => void;
  onCreate: (data: { libelle: string; type: EntityType }) => Promise<void>;
}

export function CreateEntityPanel({ onCancel, onCreate }: Props) {
  const [libelle, setLibelle] = useState('');
  const [type, setType] = useState<EntityType | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!type) return;
    setSaving(true);
    try {
      await onCreate({ libelle: libelle.trim() || 'Nouvelle Entité', type });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="create-panel">
        <div className="create-panel-head">
          <h3>Nouvelle Entité</h3>
          <p>Un conteneur pour un patrimoine détenu à part — société, SCI...</p>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Libellé
            </label>
            <input
              className="field-input"
              type="text"
              placeholder="ex. SCI Les Tilleuls"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Type
            </label>
            <div className="type-choice">
              <label className={`type-option ${type === 'activite_service' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="ent-type"
                  checked={type === 'activite_service'}
                  onChange={() => setType('activite_service')}
                />
                <div>
                  <div className="to-name">Activité de service</div>
                  <div className="to-desc">Société d'exercice indépendant, conseil, prestations...</div>
                </div>
              </label>
              <label className={`type-option ${type === 'detention_immobiliere' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="ent-type"
                  checked={type === 'detention_immobiliere'}
                  onChange={() => setType('detention_immobiliere')}
                />
                <div>
                  <div className="to-name">Détention immobilière</div>
                  <div className="to-desc">SCI ou structure dédiée à porter des biens.</div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div className="btn-row" style={{ borderTop: '1px solid var(--line)' }}>
          <button type="button" className="btn primary" disabled={!type || saving} onClick={submit}>
            Créer l'Entité
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
