import { useState } from 'react';
import { today } from '../format';
import { PE_SCPI_DISPOSITIFS, type Entity, type PeScpiDispositif } from '../types';

export interface NewPeScpiEnveloppeData {
  entity_id: number;
  libelle: string;
  type_dispositif: PeScpiDispositif;
  duree_blocage?: number;
  date_ouverture?: string;
  statut?: string;
  line: { libelle: string; nombre_parts: number; valeur_initiale: number; date: string };
}

interface Props {
  entities: Entity[];
  defaultEntityId: number | 'all';
  onCancel: () => void;
  onCreate: (data: NewPeScpiEnveloppeData) => Promise<void>;
}

export function CreateEnveloppePeScpiModal({ entities, defaultEntityId, onCancel, onCreate }: Props) {
  const [entityId, setEntityId] = useState<number | ''>(defaultEntityId === 'all' ? '' : defaultEntityId);
  const [envLibelle, setEnvLibelle] = useState('');
  const [typeDispositif, setTypeDispositif] = useState<PeScpiDispositif>('SCPI');
  const [dureeBlocage, setDureeBlocage] = useState('');
  const [dateOuverture, setDateOuverture] = useState('');
  const [statut, setStatut] = useState('Actif');
  const [nombreParts, setNombreParts] = useState('');
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
      setError('Libellé du fonds requis');
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
        entity_id: entityId,
        libelle: envLibelle.trim(),
        type_dispositif: typeDispositif,
        duree_blocage: dureeBlocage ? Number(dureeBlocage) : undefined,
        date_ouverture: dateOuverture || undefined,
        statut: statut || undefined,
        line: {
          libelle: envLibelle.trim(),
          nombre_parts: Number(nombreParts),
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
          <h3>Nouveau fonds — Private equity / SCPI</h3>
          <p>Le fonds (Enveloppe), avec sa première part souscrite.</p>
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

        <div className="field-row highlight">
          <label>Nombre de parts souscrites</label>
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
            Créer le fonds
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
