import { useEffect, useState } from 'react';
import { api } from '../api';
import { today } from '../format';
import type { Entity, ReferenceListItem } from '../types';

export interface NewLigneData {
  entity_id: number;
  libelle: string;
  type_compte?: string;
  plafond?: number;
  taux?: number;
  banque?: string;
  valeur_initiale: number;
  date: string;
}

interface Props {
  entities: Entity[];
  onCancel: () => void;
  onCreate: (data: NewLigneData) => Promise<void>;
}

export function CreateLigneModal({ entities, onCancel, onCreate }: Props) {
  const [entityId, setEntityId] = useState<number | ''>('');
  const [libelle, setLibelle] = useState('');
  const [typesCompte, setTypesCompte] = useState<ReferenceListItem[]>([]);
  const [banques, setBanques] = useState<ReferenceListItem[]>([]);
  const [typeCompte, setTypeCompte] = useState('');
  const [plafond, setPlafond] = useState('');
  const [taux, setTaux] = useState('');
  const [banque, setBanque] = useState('');
  const [valeur, setValeur] = useState('');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.typesCompte.list().then(setTypesCompte);
    api.banques.list().then(setBanques);
  }, []);

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
        type_compte: typeCompte || undefined,
        plafond: plafond ? Number(plafond) : undefined,
        taux: taux ? Number(taux) : undefined,
        banque: banque || undefined,
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
          <h3>Nouveau compte — Liquidités</h3>
          <p>Compte courant, livret… une Ligne autonome, sans Enveloppe.</p>
        </div>

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
        <div className="field-row">
          <label>Libellé</label>
          <input className="field-input" value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="ex. Livret A — Boursorama" />
        </div>
        <div className="field-row">
          <label>Type de compte</label>
          <select className="field-input" value={typeCompte} onChange={(e) => setTypeCompte(e.target.value)}>
            <option value="">— Choisir —</option>
            {typesCompte.map((t) => (
              <option key={t.id} value={t.libelle}>
                {t.libelle}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label>Banque</label>
          <select className="field-input" value={banque} onChange={(e) => setBanque(e.target.value)}>
            <option value="">— Choisir —</option>
            {banques.map((b) => (
              <option key={b.id} value={b.libelle}>
                {b.libelle}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label>Plafond du livret</label>
          <input className="field-input" type="number" value={plafond} onChange={(e) => setPlafond(e.target.value)} />
        </div>
        <div className="field-row">
          <label>Taux de rémunération actuel (%)</label>
          <input className="field-input" type="number" step="0.01" value={taux} onChange={(e) => setTaux(e.target.value)} />
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
