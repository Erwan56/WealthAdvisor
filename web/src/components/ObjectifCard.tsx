import { useState } from 'react';
import { euros, monthYear, pct, today } from '../format';
import { DOMAIN_KEYS, DOMAIN_LABELS, OBJECTIF_TYPE_LABELS } from '../types';
import type { Entity, LienPatrimoineType, Objectif } from '../types';

interface Props {
  objectif: Objectif;
  entities: Entity[];
  onUpdate: (
    id: number,
    data: {
      horizon?: string | null;
      montant_cible?: number | null;
      lien_patrimoine_type?: LienPatrimoineType | null;
      lien_domaines?: string[];
      lien_entite_id?: number;
    }
  ) => Promise<void>;
  onDelete: (objectif: Objectif) => void;
}

function estimationText(o: Objectif): string | null {
  if (o.estimation_status === 'insufficient') return 'Historique insuffisant pour projeter une date.';
  if (o.estimation_status === 'flat_or_negative') return 'Non atteignable au rythme actuel.';
  if (o.estimation_status !== 'ok' || !o.estimation_date) return null;

  const base = `Estimé atteint en ${monthYear(o.estimation_date)}`;
  if (!o.horizon) return `${base}.`;

  const diffDays = (new Date(o.estimation_date).getTime() - new Date(o.horizon).getTime()) / 86_400_000;
  const months = Math.round(Math.abs(diffDays) / 30.44);
  if (months === 0) return `${base}, pile sur ton horizon.`;
  return `${base}, soit ${months} mois ${diffDays <= 0 ? "d'avance" : 'de retard'} sur ton horizon.`;
}

export function ObjectifCard({ objectif: o, entities, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [horizon, setHorizon] = useState(o.horizon ?? '');
  const [montantCible, setMontantCible] = useState(o.montant_cible != null ? String(o.montant_cible) : '');
  const [lienType, setLienType] = useState<LienPatrimoineType | ''>(o.lien_patrimoine_type ?? '');
  const [lienDomaines, setLienDomaines] = useState<string[]>(o.lien_domaines ?? []);
  const [lienEntiteId, setLienEntiteId] = useState<number | ''>(o.lien_entite_id ?? '');
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    setHorizon(o.horizon ?? '');
    setMontantCible(o.montant_cible != null ? String(o.montant_cible) : '');
    setLienType(o.lien_patrimoine_type ?? '');
    setLienDomaines(o.lien_domaines ?? []);
    setLienEntiteId(o.lien_entite_id ?? '');
    setEditing(true);
  };

  const toggleDomaine = (d: string) => {
    setLienDomaines((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  };

  const save = async () => {
    setSaving(true);
    try {
      await onUpdate(o.id, {
        horizon: horizon || null,
        montant_cible: montantCible ? Number(montantCible) : null,
        lien_patrimoine_type: lienType || null,
        lien_domaines: lienType === 'domaines' ? lienDomaines : undefined,
        lien_entite_id: lienType === 'entite' && lienEntiteId ? lienEntiteId : undefined,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const avanceePct = o.avancee_pct ?? 0;
  const estText = estimationText(o);

  return (
    <div className="card objectif-card">
      <div className="objectif-head">
        <div>
          <div className="objectif-type">{OBJECTIF_TYPE_LABELS[o.type]}</div>
          <h3>{o.libelle}</h3>
          {o.horizon && <div className="muted" style={{ fontSize: 12 }}>Horizon : {monthYear(o.horizon)}</div>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" className="btn icon ghost" title="Éditer" onClick={openEdit}>
            ✎
          </button>
          <button type="button" className="btn icon ghost danger" title="Supprimer" onClick={() => onDelete(o)}>
            🗑
          </button>
        </div>
      </div>

      {!editing ? (
        <>
          {!o.lien_patrimoine_type ? (
            <div className="muted-hint">Configurez un lien vers le patrimoine pour suivre l'avancée.</div>
          ) : o.montant_cible == null ? (
            <div className="muted-hint">Patrimoine lié : {euros(o.montant_actuel ?? 0)} — pas de montant cible défini.</div>
          ) : (
            <>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, avanceePct))}%` }} />
              </div>
              <div className="progress-label mono">
                {euros(o.montant_actuel ?? 0)} / {euros(o.montant_cible)} · {pct(avanceePct)}
              </div>
            </>
          )}
          {estText && (
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              {estText}
            </div>
          )}
        </>
      ) : (
        <div className="objectif-edit">
          <div className="field-row">
            <label>Horizon</label>
            <input className="field-input" type="date" min={today()} value={horizon} onChange={(e) => setHorizon(e.target.value)} />
          </div>
          <div className="field-row">
            <label>Montant cible (€)</label>
            <input className="field-input" type="number" value={montantCible} onChange={(e) => setMontantCible(e.target.value)} />
          </div>
          <div className="field-row">
            <label>Lien patrimoine</label>
            <select className="field-input" value={lienType} onChange={(e) => setLienType(e.target.value as LienPatrimoineType)}>
              <option value="">— Aucun —</option>
              <option value="total">Patrimoine total</option>
              <option value="domaines">Domaine(s)</option>
              <option value="entite">Entité</option>
            </select>
          </div>
          {lienType === 'domaines' && (
            <div className="field-row">
              <label>Domaines</label>
              <div className="chip-row">
                {DOMAIN_KEYS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    className={`chip ${lienDomaines.includes(d) ? 'selected' : ''}`}
                    onClick={() => toggleDomaine(d)}
                  >
                    {DOMAIN_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>
          )}
          {lienType === 'entite' && (
            <div className="field-row">
              <label>Entité</label>
              <select className="field-input" value={lienEntiteId} onChange={(e) => setLienEntiteId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">— Choisir —</option>
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.libelle}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="btn-row">
            <button type="button" className="btn primary sm" disabled={saving} onClick={save}>
              Enregistrer
            </button>
            <button type="button" className="btn ghost sm" onClick={() => setEditing(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
