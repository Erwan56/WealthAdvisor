import { useState } from 'react';
import { today } from '../format';
import type { BourseEnvelope } from '../types';

export interface NewBourseLigneData {
  libelle: string;
  isin?: string;
  quantite?: number;
  cout_acquisition_unitaire?: number;
  valeur_initiale: number;
  date: string;
}

interface Props {
  envelope: BourseEnvelope;
  onCancel: () => void;
  onCreate: (data: NewBourseLigneData) => Promise<void>;
}

const ISIN_RE = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;
const COUT_LABEL = (type: BourseEnvelope['type']) => (type === 'CTO' ? 'Prix de revient moyen pondéré' : 'Coût d’acquisition');

export function CreateLigneBourseModal({ envelope, onCancel, onCreate }: Props) {
  const [libelle, setLibelle] = useState('');
  const [isin, setIsin] = useState('');
  const [quantite, setQuantite] = useState('');
  const [coutAcquisition, setCoutAcquisition] = useState('');
  const [valeur, setValeur] = useState('');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!libelle.trim()) {
      setError('Titre requis');
      return;
    }
    if (isin.trim() && !ISIN_RE.test(isin.trim())) {
      setError('ISIN invalide (12 caractères : code pays + identifiant + clé)');
      return;
    }
    if (!quantite) {
      setError('Quantité requise');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        libelle: libelle.trim(),
        isin: isin.trim() || undefined,
        quantite: quantite ? Number(quantite) : undefined,
        cout_acquisition_unitaire: coutAcquisition ? Number(coutAcquisition) : undefined,
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
          <h3>Nouveau titre — {envelope.libelle}</h3>
          <p>Ajoute une Ligne-titre directement dans cette Enveloppe.</p>
        </div>

        <div className="field-row highlight">
          <label>Titre</label>
          <input
            className="field-input"
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            placeholder="ex. LVMH"
          />
        </div>
        <div className="field-row">
          <label>ISIN</label>
          <input
            className="field-input"
            value={isin}
            onChange={(e) => setIsin(e.target.value.toUpperCase())}
            maxLength={12}
            placeholder="ex. FR0000121014"
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
            Ajouter le titre
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
