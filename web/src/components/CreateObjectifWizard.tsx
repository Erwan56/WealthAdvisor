import { useEffect, useState } from 'react';
import { api } from '../api';
import { euros, today } from '../format';
import { FIRE_MULTIPLIER, OBJECTIF_TYPE_LABELS } from '../types';
import type { ObjectifType } from '../types';

interface Props {
  onCancel: () => void;
  onCreate: (data: { type: ObjectifType; libelle: string; horizon?: string; montant_cible?: number }) => Promise<void>;
}

const DEFAULT_LIBELLE: Record<ObjectifType, string> = {
  retraite: 'Retraite',
  achat_immobilier: 'Achat immobilier',
  transmission: 'Transmission',
  securite_urgence: "Fonds d'urgence",
  independance_financiere: 'Indépendance financière',
  projet_libre: '',
};

type FireMethod = 'swr' | 'niveau_vie';

// Mini-assistant en 3 étapes (type → libellé/horizon → montant cible), ticket 09.
export function CreateObjectifWizard({ onCancel, onCreate }: Props) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ObjectifType | null>(null);
  const [libelle, setLibelle] = useState('');
  const [horizon, setHorizon] = useState('');
  const [useFire, setUseFire] = useState(false);
  const [fireMethod, setFireMethod] = useState<FireMethod>('swr');
  const [depensesAnnuelles, setDepensesAnnuelles] = useState('');
  const [depensesMensuelles, setDepensesMensuelles] = useState('');
  const [montantCible, setMontantCible] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (type === 'independance_financiere') {
      setUseFire(true);
      api.profil.get().then((p) => {
        if (p.depenses_mensuelles_courantes) setDepensesMensuelles(String(p.depenses_mensuelles_courantes));
      });
    }
  }, [type]);

  const selectType = (t: ObjectifType) => {
    setType(t);
    setLibelle(DEFAULT_LIBELLE[t]);
  };

  const fireResult =
    fireMethod === 'swr'
      ? Number(depensesAnnuelles) * FIRE_MULTIPLIER
      : Number(depensesMensuelles) * 12 * FIRE_MULTIPLIER;

  const finalMontant = useFire ? (Number.isFinite(fireResult) && fireResult > 0 ? fireResult : undefined) : montantCible ? Number(montantCible) : undefined;

  const submit = async () => {
    if (!type || !libelle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate({ type, libelle: libelle.trim(), horizon: horizon || undefined, montant_cible: finalMontant });
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
          <h3>Nouvel Objectif</h3>
          <p>Étape {step} / 3</p>
        </div>

        {step === 1 && (
          <div style={{ padding: '16px 22px' }}>
            <div className="type-choice">
              {(Object.keys(OBJECTIF_TYPE_LABELS) as ObjectifType[]).map((t) => (
                <label key={t} className={`type-option ${type === t ? 'selected' : ''}`}>
                  <input type="radio" name="obj-type" checked={type === t} onChange={() => selectType(t)} />
                  <div className="to-name">{OBJECTIF_TYPE_LABELS[t]}</div>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="field-row">
              <label>Libellé</label>
              <input className="field-input" value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="ex. Indépendance financière" />
            </div>
            <div className="field-row">
              <label>Horizon</label>
              <input className="field-input" type="date" min={today()} value={horizon} onChange={(e) => setHorizon(e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ padding: '4px 0' }}>
            {type === 'independance_financiere' && (
              <div className="field-row">
                <label>Calculette FIRE</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={useFire} onChange={(e) => setUseFire(e.target.checked)} />
                  Utiliser la calculette
                </label>
              </div>
            )}

            {useFire ? (
              <div style={{ margin: '0 22px 12px', border: '1.5px dashed var(--accent)', borderRadius: 10, padding: '14px 16px', background: 'color-mix(in srgb, var(--accent) 6%, var(--surface))' }}>
                <div className="type-choice" style={{ marginBottom: 10 }}>
                  <label className={`type-option ${fireMethod === 'swr' ? 'selected' : ''}`}>
                    <input type="radio" checked={fireMethod === 'swr'} onChange={() => setFireMethod('swr')} />
                    <div>
                      <div className="to-name">Règle de retrait (SWR)</div>
                      <div className="to-desc">Dépenses annuelles visées à la retraite</div>
                    </div>
                  </label>
                  <label className={`type-option ${fireMethod === 'niveau_vie' ? 'selected' : ''}`}>
                    <input type="radio" checked={fireMethod === 'niveau_vie'} onChange={() => setFireMethod('niveau_vie')} />
                    <div>
                      <div className="to-name">Niveau de vie actuel</div>
                      <div className="to-desc">Dépenses mensuelles actuelles × 12</div>
                    </div>
                  </label>
                </div>
                {fireMethod === 'swr' ? (
                  <div className="field-row">
                    <label>Dépenses annuelles visées (€)</label>
                    <input className="field-input" type="number" value={depensesAnnuelles} onChange={(e) => setDepensesAnnuelles(e.target.value)} />
                  </div>
                ) : (
                  <div className="field-row">
                    <label>Dépenses mensuelles actuelles (€)</label>
                    <input className="field-input" type="number" value={depensesMensuelles} onChange={(e) => setDepensesMensuelles(e.target.value)} />
                  </div>
                )}
                <div style={{ padding: '0 22px 4px', fontSize: 13.5 }}>
                  Multiplicateur fixe <strong className="mono">{FIRE_MULTIPLIER}×</strong> (règle des 4 %) — capital cible :{' '}
                  <strong className="mono">{finalMontant ? euros(finalMontant) : '—'}</strong>
                </div>
                <div style={{ padding: '0 22px', fontSize: 11.5, color: 'var(--muted)', fontStyle: 'italic' }}>
                  Objectif brut — ne tient pas compte de la fiscalité au retrait.
                </div>
              </div>
            ) : (
              <div className="field-row">
                <label>Montant cible (€)</label>
                <input
                  className="field-input"
                  type="number"
                  placeholder="laissez vide si difficile à chiffrer"
                  value={montantCible}
                  onChange={(e) => setMontantCible(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error-banner" style={{ margin: '0 22px 12px' }}>
            {error}
          </div>
        )}

        <div className="btn-row">
          {step > 1 && (
            <button type="button" className="btn ghost" onClick={() => setStep(step - 1)}>
              Précédent
            </button>
          )}
          {step < 3 ? (
            <button type="button" className="btn primary" disabled={step === 1 && !type} onClick={() => setStep(step + 1)}>
              Suivant
            </button>
          ) : (
            <button type="button" className="btn primary" disabled={saving} onClick={submit}>
              Créer l'Objectif
            </button>
          )}
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
