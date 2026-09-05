import { useState } from 'react';
import { today } from '../format';
import { AV_PER_ENVELOPE_TYPES, AV_PER_SUPPORT_TYPES, type AvPerEnvelopeType, type AvPerSupportType, type Entity } from '../types';

export interface NewAvPerEnveloppeData {
  entity_id: number;
  libelle: string;
  type: AvPerEnvelopeType;
  date_ouverture?: string;
  statut?: string;
  line: { libelle: string; nom_support?: string; type_support?: AvPerSupportType; valeur_initiale: number; date: string };
}

interface Props {
  entities: Entity[];
  defaultEntityId: number | 'all';
  onCancel: () => void;
  onCreate: (data: NewAvPerEnveloppeData) => Promise<void>;
}

export function CreateEnveloppeAvPerModal({ entities, defaultEntityId, onCancel, onCreate }: Props) {
  const [entityId, setEntityId] = useState<number | ''>(defaultEntityId === 'all' ? '' : defaultEntityId);
  const [envLibelle, setEnvLibelle] = useState('');
  const [type, setType] = useState<AvPerEnvelopeType>('assurance_vie');
  const [dateOuverture, setDateOuverture] = useState('');
  const [statut, setStatut] = useState('Actif');
  const [nomSupport, setNomSupport] = useState('');
  const [typeSupport, setTypeSupport] = useState<AvPerSupportType>('fonds_euro');
  const [valeur, setValeur] = useState('');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!entityId) {
      setError('Choisissez une Entité');
      return;
    }
    if (!envLibelle.trim()) {
      setError('Libellé du contrat requis');
      return;
    }
    if (!nomSupport.trim()) {
      setError('Nom du premier support requis');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        entity_id: entityId,
        libelle: envLibelle.trim(),
        type,
        date_ouverture: dateOuverture || undefined,
        statut: statut || undefined,
        line: {
          libelle: nomSupport.trim(),
          nom_support: nomSupport.trim(),
          type_support: typeSupport,
          valeur_initiale: valeur ? Number(valeur) : 0,
          date,
        },
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
          <h3>Nouveau contrat — Assurance-vie / PER</h3>
          <p>Le contrat (Enveloppe), avec son premier support.</p>
        </div>

        {entities.length > 1 && (
          <div className="field-row">
            <label>Entité</label>
            <select
              className="field-input"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">— Choisir —</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.libelle}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field-row">
          <label>Libellé du contrat</label>
          <input
            className="field-input"
            value={envLibelle}
            onChange={(e) => setEnvLibelle(e.target.value)}
            placeholder="ex. Assurance-vie — Linxea Spirit"
          />
        </div>
        <div className="field-row">
          <label>Type</label>
          <select className="field-input" value={type} onChange={(e) => setType(e.target.value as AvPerEnvelopeType)}>
            {AV_PER_ENVELOPE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'assurance_vie' ? 'Assurance-vie' : 'PER'}
              </option>
            ))}
          </select>
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

        <div className="field-row highlight">
          <label>Premier support — Nom</label>
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
            Créer le contrat
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
