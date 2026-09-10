import { useState } from 'react';
import { today } from '../format';
import type { Entity } from '../types';

export interface NewImmobilierLigneData {
  entity_id: number;
  libelle: string;
  prix_acquisition_total?: number;
  date_acquisition?: string;
  residence_principale?: boolean;
  regime_location?: string;
  valeur_initiale: number;
  date: string;
  capital_restant_du?: number;
  loyer?: number;
  charges?: number;
  taxe_fonciere?: number;
  assurance?: number;
  frais_gestion?: number;
  mensualite?: number;
}

interface Props {
  entities: Entity[];
  onCancel: () => void;
  onCreate: (data: NewImmobilierLigneData) => Promise<void>;
}

export function CreateLigneImmobilierModal({ entities, onCancel, onCreate }: Props) {
  const [entityId, setEntityId] = useState<number | ''>('');
  const [libelle, setLibelle] = useState('');
  const [prixAcquisition, setPrixAcquisition] = useState('');
  const [dateAcquisition, setDateAcquisition] = useState('');
  const [residencePrincipale, setResidencePrincipale] = useState(false);
  const [regimeLocation, setRegimeLocation] = useState('');
  const [valeur, setValeur] = useState('');
  const [date, setDate] = useState(today());
  const [capitalRestantDu, setCapitalRestantDu] = useState('');
  const [loyer, setLoyer] = useState('');
  const [charges, setCharges] = useState('');
  const [taxeFonciere, setTaxeFonciere] = useState('');
  const [assurance, setAssurance] = useState('');
  const [fraisGestion, setFraisGestion] = useState('');
  const [mensualite, setMensualite] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!entityId) {
      setError('Choisissez une Entité');
      return;
    }
    if (!libelle.trim()) {
      setError('Libellé requis');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        entity_id: entityId,
        libelle: libelle.trim(),
        prix_acquisition_total: prixAcquisition ? Number(prixAcquisition) : undefined,
        date_acquisition: dateAcquisition || undefined,
        residence_principale: residencePrincipale,
        regime_location: residencePrincipale ? undefined : regimeLocation || undefined,
        valeur_initiale: valeur ? Number(valeur) : 0,
        date,
        capital_restant_du: capitalRestantDu ? Number(capitalRestantDu) : undefined,
        loyer: loyer ? Number(loyer) : undefined,
        charges: charges ? Number(charges) : undefined,
        taxe_fonciere: taxeFonciere ? Number(taxeFonciere) : undefined,
        assurance: assurance ? Number(assurance) : undefined,
        frais_gestion: fraisGestion ? Number(fraisGestion) : undefined,
        mensualite: mensualite ? Number(mensualite) : undefined,
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
          <h3>Nouveau bien — Immobilier</h3>
          <p>Une Ligne autonome, sans Enveloppe.</p>
        </div>

        {(
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
          <label>Libellé</label>
          <input className="field-input" value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="ex. Appartement — Lyon 7e" />
        </div>
        <div className="field-row">
          <label>Prix d'acquisition total</label>
          <input className="field-input" type="number" value={prixAcquisition} onChange={(e) => setPrixAcquisition(e.target.value)} placeholder="frais de notaire et travaux inclus" />
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

        <div className="field-row highlight">
          <label>Date de la valorisation</label>
          <input className="field-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Valeur estimée</label>
          <input className="field-input" type="number" value={valeur} onChange={(e) => setValeur(e.target.value)} />
        </div>

        <details className="disclosure">
          <summary>Paramètres locatifs courants (prêt, loyer…)</summary>
          <div className="disclosure-body">
            <div className="field-row">
              <label>Capital restant dû</label>
              <input className="field-input" type="number" value={capitalRestantDu} onChange={(e) => setCapitalRestantDu(e.target.value)} />
            </div>
            <div className="field-row">
              <label>Mensualité de prêt</label>
              <input className="field-input" type="number" value={mensualite} onChange={(e) => setMensualite(e.target.value)} />
            </div>
            <div className="field-row">
              <label>Loyer mensuel</label>
              <input className="field-input" type="number" value={loyer} onChange={(e) => setLoyer(e.target.value)} />
            </div>
            <div className="field-row">
              <label>Charges mensuelles</label>
              <input className="field-input" type="number" value={charges} onChange={(e) => setCharges(e.target.value)} />
            </div>
            <div className="field-row">
              <label>Taxe foncière annuelle</label>
              <input className="field-input" type="number" value={taxeFonciere} onChange={(e) => setTaxeFonciere(e.target.value)} />
            </div>
            <div className="field-row">
              <label>Assurance mensuelle</label>
              <input className="field-input" type="number" value={assurance} onChange={(e) => setAssurance(e.target.value)} />
            </div>
            <div className="field-row">
              <label>Frais de gestion mensuels</label>
              <input className="field-input" type="number" value={fraisGestion} onChange={(e) => setFraisGestion(e.target.value)} />
            </div>
          </div>
        </details>

        {error && <div className="error-banner" style={{ margin: '0 22px 12px' }}>{error}</div>}

        <div className="btn-row">
          <button type="button" className="btn primary" disabled={saving} onClick={submit}>
            Créer la Ligne
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
