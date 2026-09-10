import { useState } from 'react';
import { today } from '../format';
import type { Entity } from '../types';

export interface NewCryptoEnveloppeData {
  entity_id: number;
  libelle: string;
  plateforme_etrangere?: boolean;
  prix_acquisition_cumule?: number;
  date_ouverture?: string;
  statut?: string;
  line: { libelle: string; symbole: string; quantite: number; valeur_initiale: number; date: string };
}

interface Props {
  entities: Entity[];
  onCancel: () => void;
  onCreate: (data: NewCryptoEnveloppeData) => Promise<void>;
}

export function CreateEnveloppeCryptoModal({ entities, onCancel, onCreate }: Props) {
  const [entityId, setEntityId] = useState<number | ''>('');
  const [envLibelle, setEnvLibelle] = useState('');
  const [plateformeEtrangere, setPlateformeEtrangere] = useState(false);
  const [prixAcquisitionCumule, setPrixAcquisitionCumule] = useState('');
  const [dateOuverture, setDateOuverture] = useState('');
  const [statut, setStatut] = useState('Actif');
  const [symbole, setSymbole] = useState('');
  const [quantite, setQuantite] = useState('');
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
      setError('Libellé du portefeuille requis');
      return;
    }
    if (!symbole.trim()) {
      setError('Symbole du premier actif requis');
      return;
    }
    if (!quantite) {
      setError('Quantité du premier actif requise');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        entity_id: entityId,
        libelle: envLibelle.trim(),
        plateforme_etrangere: plateformeEtrangere,
        prix_acquisition_cumule: prixAcquisitionCumule ? Number(prixAcquisitionCumule) : undefined,
        date_ouverture: dateOuverture || undefined,
        statut: statut || undefined,
        line: {
          libelle: symbole.trim(),
          symbole: symbole.trim(),
          quantite: Number(quantite),
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
          <h3>Nouveau portefeuille — Crypto</h3>
          <p>Un portefeuille par plateforme, avec son premier actif.</p>
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

        <div className="field-row highlight">
          <label>Premier actif — Symbole</label>
          <input className="field-input" value={symbole} onChange={(e) => setSymbole(e.target.value)} placeholder="ex. BTC, ETH…" />
        </div>
        <div className="field-row">
          <label>Quantité</label>
          <input className="field-input" type="number" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
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
            Créer le portefeuille
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
