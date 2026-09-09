import { useState } from 'react';
import { PE_SCPI_DISPOSITIFS, type PeScpiDispositif, type PeScpiEnvelope } from '../types';

export interface EditPeScpiEnveloppeData {
  libelle: string;
  type_dispositif: PeScpiDispositif;
  duree_blocage?: number | null;
  date_ouverture?: string | null;
  statut?: string | null;
}

interface Props {
  envelope: PeScpiEnvelope;
  onCancel: () => void;
  onSave: (data: EditPeScpiEnveloppeData) => Promise<void>;
}

export function EditEnveloppePeScpiModal({ envelope, onCancel, onSave }: Props) {
  const [envLibelle, setEnvLibelle] = useState(envelope.libelle);
  const [typeDispositif, setTypeDispositif] = useState<PeScpiDispositif>(envelope.type_dispositif);
  const [dureeBlocage, setDureeBlocage] = useState(envelope.duree_blocage !== null ? String(envelope.duree_blocage) : '');
  const [dateOuverture, setDateOuverture] = useState(envelope.date_ouverture ?? '');
  const [statut, setStatut] = useState(envelope.statut ?? 'Actif');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!envLibelle.trim()) {
      setError('Libellé du fonds requis');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        libelle: envLibelle.trim(),
        type_dispositif: typeDispositif,
        duree_blocage: dureeBlocage ? Number(dureeBlocage) : null,
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
          <h3>Modifier le fonds</h3>
          <p>{envelope.libelle}</p>
        </div>

        <div className="field-row">
          <label>Libellé du fonds</label>
          <input className="field-input" value={envLibelle} onChange={(e) => setEnvLibelle(e.target.value)} placeholder="ex. SCPI Corum Origin" />
        </div>
        <div className="field-row">
          <label>Type de dispositif</label>
          <select className="field-input" value={typeDispositif} onChange={(e) => setTypeDispositif(e.target.value as PeScpiDispositif)}>
            {PE_SCPI_DISPOSITIFS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label>Durée de blocage (années)</label>
          <input className="field-input" type="number" value={dureeBlocage} onChange={(e) => setDureeBlocage(e.target.value)} />
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
