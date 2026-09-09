import { useState } from 'react';
import type { ImmobilierLine } from '../types';

export interface EditImmobilierLigneData {
  libelle: string;
  prix_acquisition_total?: number | null;
  date_acquisition?: string | null;
  residence_principale: boolean;
  regime_location?: string | null;
}

interface Props {
  line: ImmobilierLine;
  onCancel: () => void;
  onSave: (data: EditImmobilierLigneData) => Promise<void>;
}

export function EditLigneImmobilierModal({ line, onCancel, onSave }: Props) {
  const [libelle, setLibelle] = useState(line.libelle);
  const [prixAcquisition, setPrixAcquisition] = useState(
    line.prix_acquisition_total !== null ? String(line.prix_acquisition_total) : ''
  );
  const [dateAcquisition, setDateAcquisition] = useState(line.date_acquisition ?? '');
  const [residencePrincipale, setResidencePrincipale] = useState(!!line.residence_principale);
  const [regimeLocation, setRegimeLocation] = useState(line.regime_location ?? '');
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
        prix_acquisition_total: prixAcquisition ? Number(prixAcquisition) : null,
        date_acquisition: dateAcquisition || null,
        residence_principale: residencePrincipale,
        regime_location: residencePrincipale ? null : regimeLocation || null,
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
          <h3>Modifier le bien</h3>
          <p>{line.libelle}</p>
        </div>

        <div className="field-row">
          <label>Libellé</label>
          <input className="field-input" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Prix d'acquisition total</label>
          <input
            className="field-input"
            type="number"
            value={prixAcquisition}
            onChange={(e) => setPrixAcquisition(e.target.value)}
            placeholder="frais de notaire et travaux inclus"
          />
        </div>
        <div className="field-row">
          <label>Date d'acquisition</label>
          <input className="field-input" type="date" value={dateAcquisition} onChange={(e) => setDateAcquisition(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Résidence principale</label>
          <select
            className="field-input"
            value={residencePrincipale ? '1' : '0'}
            onChange={(e) => setResidencePrincipale(e.target.value === '1')}
          >
            <option value="0">Non</option>
            <option value="1">Oui</option>
          </select>
        </div>
        {!residencePrincipale && (
          <div className="field-row">
            <label>Régime de location</label>
            <select className="field-input" value={regimeLocation} onChange={(e) => setRegimeLocation(e.target.value)}>
              <option value="">Non loué</option>
              <option value="nue">Location nue</option>
              <option value="meublee">Location meublée</option>
              <option value="saisonniere">Location saisonnière</option>
            </select>
          </div>
        )}

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
