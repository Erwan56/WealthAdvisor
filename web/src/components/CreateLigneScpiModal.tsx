import { useState } from 'react';
import { today } from '../format';
import type { PeScpiEnvelope } from '../types';

export interface NewPeScpiLigneData {
  libelle: string;
  nombre_parts: number;
  valeur_initiale: number;
  date: string;
}

interface Props {
  envelope: PeScpiEnvelope;
  onCancel: () => void;
  onCreate: (data: NewPeScpiLigneData) => Promise<void>;
}

export function CreateLigneScpiModal({ envelope, onCancel, onCreate }: Props) {
  const [libelle, setLibelle] = useState('');
  const [nombreParts, setNombreParts] = useState('');
  const [valeur, setValeur] = useState('');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!libelle.trim()) {
      setError('Libellé requis');
      return;
    }
    if (!nombreParts) {
      setError('Nombre de parts requis');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        libelle: libelle.trim(),
        nombre_parts: Number(nombreParts),
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
          <h3>Nouvelle part souscrite — {envelope.libelle}</h3>
          <p>Ajoute une Ligne-part directement dans ce fonds.</p>
        </div>

        <div className="field-row highlight">
          <label>Libellé</label>
          <input className="field-input" value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="ex. Souscription 2024" />
        </div>
        <div className="field-row">
          <label>Nombre de parts</label>
          <input className="field-input" type="number" value={nombreParts} onChange={(e) => setNombreParts(e.target.value)} />
        </div>
        <div className="field-row highlight">
          <label>Date de la valorisation</label>
          <input className="field-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Valeur actuelle estimée</label>
          <input className="field-input" type="number" value={valeur} onChange={(e) => setValeur(e.target.value)} />
        </div>

        {error && <div className="error-banner" style={{ margin: '0 22px 12px' }}>{error}</div>}

        <div className="btn-row">
          <button type="button" className="btn primary" disabled={saving} onClick={submit}>
            Ajouter la part
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
