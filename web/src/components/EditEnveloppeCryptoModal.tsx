import { useState } from 'react';
import type { CryptoEnvelope } from '../types';

export interface EditEnveloppeData {
  libelle: string;
  plateforme_etrangere: boolean;
  prix_acquisition_cumule?: number | null;
  date_ouverture?: string | null;
  statut?: string | null;
}

interface Props {
  envelope: CryptoEnvelope;
  onCancel: () => void;
  onSave: (data: EditEnveloppeData) => Promise<void>;
}

export function EditEnveloppeCryptoModal({ envelope, onCancel, onSave }: Props) {
  const [envLibelle, setEnvLibelle] = useState(envelope.libelle);
  const [plateformeEtrangere, setPlateformeEtrangere] = useState(!!envelope.plateforme_etrangere);
  const [prixAcquisitionCumule, setPrixAcquisitionCumule] = useState(
    envelope.prix_acquisition_cumule !== null ? String(envelope.prix_acquisition_cumule) : ''
  );
  const [dateOuverture, setDateOuverture] = useState(envelope.date_ouverture ?? '');
  const [statut, setStatut] = useState(envelope.statut ?? 'Actif');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!envLibelle.trim()) {
      setError('Libellé du portefeuille requis');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        libelle: envLibelle.trim(),
        plateforme_etrangere: plateformeEtrangere,
        prix_acquisition_cumule: prixAcquisitionCumule ? Number(prixAcquisitionCumule) : null,
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
          <h3>Modifier le portefeuille</h3>
          <p>{envelope.libelle}</p>
        </div>

        <div className="field-row">
          <label>Libellé du portefeuille</label>
          <input
            className="field-input"
            value={envLibelle}
            onChange={(e) => setEnvLibelle(e.target.value)}
            placeholder="ex. Binance, Ledger…"
          />
        </div>
        <div className="field-row">
          <label>Plateforme étrangère</label>
          <select
            className="field-input"
            value={plateformeEtrangere ? '1' : '0'}
            onChange={(e) => setPlateformeEtrangere(e.target.value === '1')}
          >
            <option value="0">Non</option>
            <option value="1">Oui</option>
          </select>
        </div>
        <div className="field-row">
          <label>Prix d'acquisition cumulé</label>
          <input
            className="field-input"
            type="number"
            value={prixAcquisitionCumule}
            onChange={(e) => setPrixAcquisitionCumule(e.target.value)}
          />
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
