import { useState } from 'react';
import { today } from '../format';
import { BOURSE_ENVELOPE_TYPES, type BourseEnvelopeType, type Entity } from '../types';

export interface NewEnveloppeData {
  entity_id: number;
  libelle: string;
  type: BourseEnvelopeType;
  date_ouverture?: string;
  statut?: string;
  line: {
    libelle: string;
    isin?: string;
    quantite?: number;
    cout_acquisition_unitaire?: number;
    valeur_initiale: number;
    date: string;
  };
}

interface Props {
  entities: Entity[];
  defaultEntityId: number | 'all';
  onCancel: () => void;
  onCreate: (data: NewEnveloppeData) => Promise<void>;
}

const ISIN_RE = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;
const COUT_LABEL = (type: BourseEnvelopeType) => (type === 'CTO' ? 'Prix de revient moyen pondéré' : 'Coût d’acquisition');

export function CreateEnveloppeBourseModal({ entities, defaultEntityId, onCancel, onCreate }: Props) {
  const [entityId, setEntityId] = useState<number | ''>(defaultEntityId === 'all' ? '' : defaultEntityId);
  const [envLibelle, setEnvLibelle] = useState('');
  const [type, setType] = useState<BourseEnvelopeType>('PEA');
  const [dateOuverture, setDateOuverture] = useState('');
  const [statut, setStatut] = useState('Actif');
  const [ligneTitre, setLigneTitre] = useState('');
  const [isin, setIsin] = useState('');
  const [quantite, setQuantite] = useState('');
  const [coutAcquisition, setCoutAcquisition] = useState('');
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
      setError('Libellé de l’Enveloppe requis');
      return;
    }
    if (!ligneTitre.trim()) {
      setError('Titre du premier titre requis');
      return;
    }
    if (isin.trim() && !ISIN_RE.test(isin.trim())) {
      setError('ISIN invalide (12 caractères : code pays + identifiant + clé)');
      return;
    }
    if (!quantite) {
      setError('Quantité du premier titre requise');
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
          libelle: ligneTitre.trim(),
          isin: isin.trim() || undefined,
          quantite: quantite ? Number(quantite) : undefined,
          cout_acquisition_unitaire: coutAcquisition ? Number(coutAcquisition) : undefined,
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
          <h3>Nouvelle Enveloppe — Bourse</h3>
          <p>PEA, PEA-PME ou CTO, avec son premier titre. Un compte espèces est créé automatiquement.</p>
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
          <label>Libellé de l’Enveloppe</label>
          <input
            className="field-input"
            value={envLibelle}
            onChange={(e) => setEnvLibelle(e.target.value)}
            placeholder="ex. PEA — Boursorama"
          />
        </div>
        <div className="field-row">
          <label>Type</label>
          <select className="field-input" value={type} onChange={(e) => setType(e.target.value as BourseEnvelopeType)}>
            {BOURSE_ENVELOPE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label>Date d’ouverture</label>
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
          <label>Premier titre</label>
          <input
            className="field-input"
            value={ligneTitre}
            onChange={(e) => setLigneTitre(e.target.value)}
            placeholder="ex. MSCI World"
          />
        </div>
        <div className="field-row">
          <label>ISIN</label>
          <input
            className="field-input"
            value={isin}
            onChange={(e) => setIsin(e.target.value.toUpperCase())}
            maxLength={12}
            placeholder="ex. IE00B4X9L533"
          />
        </div>
        <div className="field-row">
          <label>Quantité</label>
          <input className="field-input" type="number" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
        </div>
        <div className="field-row">
          <label>{COUT_LABEL(type)}</label>
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
            Créer l’Enveloppe
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
