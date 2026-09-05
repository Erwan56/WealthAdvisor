import { useState } from 'react';
import { today } from '../format';
import { AV_PER_SUPPORT_TYPES, type AvPerEnvelope, type AvPerSupportType } from '../types';

export interface NewAvPerLigneData {
  libelle: string;
  nom_support?: string;
  type_support?: AvPerSupportType;
  valeur_initiale: number;
  date: string;
}

interface Props {
  envelope: AvPerEnvelope;
  onCancel: () => void;
  onCreate: (data: NewAvPerLigneData) => Promise<void>;
}

export function CreateLigneAvPerModal({ envelope, onCancel, onCreate }: Props) {
  const [nomSupport, setNomSupport] = useState('');
  const [typeSupport, setTypeSupport] = useState<AvPerSupportType>('fonds_euro');
  const [valeur, setValeur] = useState('');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!nomSupport.trim()) {
      setError('Nom du support requis');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        libelle: nomSupport.trim(),
        nom_support: nomSupport.trim(),
        type_support: typeSupport,
        valeur_initiale: valeur ? Number(valeur) : 0,
        date,
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
          <h3>Nouveau support — {envelope.libelle}</h3>
          <p>Ajoute une Ligne-support directement dans ce contrat.</p>
        </div>

        <div className="field-row highlight">
          <label>Nom</label>
          <input
            className="field-input"
            value={nomSupport}
            onChange={(e) => setNomSupport(e.target.value)}
            placeholder="ex. Fonds euro, MSCI World UC…"
          />
        </div>
        <div className="field-row">
          <label>Type de support</label>
          <select className="field-input" value={typeSupport} onChange={(e) => setTypeSupport(e.target.value as AvPerSupportType)}>
            {AV_PER_SUPPORT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'fonds_euro' ? 'Fonds euro' : 'Unité de compte'}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row highlight">
          <label>Date de la valorisation</label>
          <input className="field-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Valeur actuelle</label>
          <input className="field-input" type="number" value={valeur} onChange={(e) => setValeur(e.target.value)} />
        </div>

        {error && <div className="error-banner" style={{ margin: '0 22px 12px' }}>{error}</div>}

        <div className="btn-row">
          <button type="button" className="btn primary" disabled={saving} onClick={submit}>
            Ajouter le support
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
