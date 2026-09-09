import { useState } from 'react';
import type { BourseEnvelope, BourseLine } from '../types';

export interface EditLigneData {
  libelle: string;
  isin?: string | null;
  quantite?: number | null;
  cout_acquisition_unitaire?: number | null;
}

interface Props {
  envelope: BourseEnvelope;
  line: BourseLine;
  onCancel: () => void;
  onSave: (data: EditLigneData) => Promise<void>;
}

const ISIN_RE = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;
const COUT_LABEL = (type: BourseEnvelope['type']) => (type === 'CTO' ? 'Prix de revient moyen pondéré' : 'Coût d’acquisition');

export function EditLigneBourseModal({ envelope, line, onCancel, onSave }: Props) {
  const [libelle, setLibelle] = useState(line.libelle);
  const [isin, setIsin] = useState(line.isin ?? '');
  const [quantite, setQuantite] = useState(line.quantite !== null ? String(line.quantite) : '');
  const [coutAcquisition, setCoutAcquisition] = useState(
    line.cout_acquisition_unitaire !== null ? String(line.cout_acquisition_unitaire) : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!libelle.trim()) {
      setError('Libellé requis');
      return;
    }
    if (isin.trim() && !ISIN_RE.test(isin.trim())) {
      setError('ISIN invalide (12 caractères : code pays + identifiant + clé)');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (line.est_compte_especes) {
        await onSave({ libelle: libelle.trim() });
      } else {
        await onSave({
          libelle: libelle.trim(),
          isin: isin.trim() || null,
          quantite: quantite ? Number(quantite) : null,
          cout_acquisition_unitaire: coutAcquisition ? Number(coutAcquisition) : null,
        });
      }
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
          <h3>Modifier le titre</h3>
          <p>{line.libelle}</p>
        </div>

        <div className="field-row">
          <label>Libellé</label>
          <input className="field-input" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
        </div>
        {!line.est_compte_especes && (
          <>
            <div className="field-row">
              <label>ISIN</label>
              <input
                className="field-input"
                value={isin}
                onChange={(e) => setIsin(e.target.value.toUpperCase())}
                maxLength={12}
              />
            </div>
            <div className="field-row">
              <label>Quantité</label>
              <input className="field-input" type="number" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
            </div>
            <div className="field-row">
              <label>{COUT_LABEL(envelope.type)}</label>
              <input
                className="field-input"
                type="number"
                value={coutAcquisition}
                onChange={(e) => setCoutAcquisition(e.target.value)}
              />
            </div>
          </>
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
