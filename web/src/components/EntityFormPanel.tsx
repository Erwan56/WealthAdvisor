import { useState } from 'react';
import type { Entity, EntityType } from '../types';

interface Props {
  entity?: Entity;
  onCancel: () => void;
  onSubmit: (data: { libelle: string; type: EntityType; charges_fixes_professionnelles?: number }) => Promise<void>;
}

// Sert à la fois la création et l'édition (ticket 01 — la gestion des Entités
// migre de EntityTabs vers l'écran de Configuration globale). `personnelle`
// n'est ni créable ni ré-assignable ici : l'Entité 'perso' est seedée une
// fois pour toutes au démarrage et garde son type fixe.
export function EntityFormPanel({ entity, onCancel, onSubmit }: Props) {
  const isEdit = !!entity;
  const [libelle, setLibelle] = useState(entity?.libelle ?? '');
  const [type, setType] = useState<EntityType | null>(entity?.type ?? null);
  const [chargesFixes, setChargesFixes] = useState<string>(
    entity?.charges_fixes_professionnelles != null ? String(entity.charges_fixes_professionnelles) : ''
  );
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!type) return;
    setSaving(true);
    try {
      await onSubmit({
        libelle: libelle.trim() || 'Nouvelle Entité',
        type,
        charges_fixes_professionnelles: chargesFixes ? Number(chargesFixes) : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="create-panel">
        <div className="create-panel-head">
          <h3>{isEdit ? "Modifier l'Entité" : 'Nouvelle Entité'}</h3>
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
          {entity?.type === 'personnelle' ? (
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Type
              </label>
              <div className="muted-hint">Personnelle (fixe)</div>
            </div>
          ) : (
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
          )}
          {type === 'activite_service' && (
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Charges fixes professionnelles (€/mois)
              </label>
              <input
                className="field-input"
                type="number"
                value={chargesFixes}
                onChange={(e) => setChargesFixes(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="btn-row" style={{ borderTop: '1px solid var(--line)' }}>
          <button type="button" className="btn primary" disabled={!type || saving} onClick={submit}>
            {isEdit ? 'Enregistrer' : "Créer l'Entité"}
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
