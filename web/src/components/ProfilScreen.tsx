import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Profil } from '../types';
import { QuestionnaireRisque } from './QuestionnaireRisque';

interface Props {
  notify: (message: string, warn?: boolean) => void;
}

const SECTIONS = [
  { id: 'identite-fiscalite', label: 'Identité & fiscalité' },
  { id: 'situation-familiale', label: 'Situation familiale' },
  { id: 'questionnaire-risque', label: 'Questionnaire de risque' },
];

const STATUT_MARITAL_OPTIONS = [
  { value: '', label: '—' },
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'pacse', label: 'Pacsé(e)' },
  { value: 'marie', label: 'Marié(e)' },
  { value: 'divorce', label: 'Divorcé(e)' },
  { value: 'veuf', label: 'Veuf/veuve' },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Écran Profil = formulaire unique avec navigation ancrée (ticket 08) — pas
// d'onboarding obligatoire, aucune référence aux Objectifs (écran indépendant).
export function ProfilScreen({ notify }: Props) {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.profil.get().then(setProfil);
  };

  useEffect(load, []);

  if (!profil) {
    return (
      <div className="dash-main">
        <div className="card empty-state">Chargement…</div>
      </div>
    );
  }

  const set = <K extends keyof Profil>(key: K, value: Profil[K]) => setProfil({ ...profil, [key]: value });

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.profil.update({
        date_naissance: profil.date_naissance,
        horizon_global: profil.horizon_global,
        tmi: profil.tmi,
        plafond_per_annuel: profil.plafond_per_annuel,
        depenses_mensuelles_courantes: profil.depenses_mensuelles_courantes,
        mois_reserve_visees: profil.mois_reserve_visees,
        statut_marital: profil.statut_marital,
        personnes_a_charge: profil.personnes_a_charge,
      });
      setProfil(updated);
      notify('Profil enregistré');
    } catch (err) {
      notify((err as Error).message, true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dash-main">
      <div className="dash-toolbar">
        <h2>Profil</h2>
      </div>

      <nav className="anchor-nav">
        {SECTIONS.map((s) => (
          <button type="button" key={s.id} onClick={() => scrollTo(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>

      <section id="identite-fiscalite" className="card profil-section">
        <h3>Identité &amp; fiscalité</h3>
        <div className="field-row">
          <label>Date de naissance</label>
          <input
            className="field-input"
            type="date"
            value={profil.date_naissance ?? ''}
            onChange={(e) => set('date_naissance', e.target.value || null)}
          />
        </div>
        <div className="field-row">
          <label>Horizon global</label>
          <input
            className="field-input"
            type="text"
            placeholder="ex. Long terme (&gt; 10 ans)"
            value={profil.horizon_global ?? ''}
            onChange={(e) => set('horizon_global', e.target.value || null)}
          />
        </div>
        <div className="field-row">
          <label>TMI (%)</label>
          <input
            className="field-input"
            type="number"
            value={profil.tmi ?? ''}
            onChange={(e) => set('tmi', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="field-row">
          <label>Plafond PER annuel (€)</label>
          <input
            className="field-input"
            type="number"
            placeholder="depuis votre avis d'imposition"
            value={profil.plafond_per_annuel ?? ''}
            onChange={(e) => set('plafond_per_annuel', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="field-row">
          <label>Dépenses mensuelles courantes (€)</label>
          <input
            className="field-input"
            type="number"
            value={profil.depenses_mensuelles_courantes ?? ''}
            onChange={(e) => set('depenses_mensuelles_courantes', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="field-row">
          <label>Mois de réserve visés</label>
          <input
            className="field-input"
            type="number"
            value={profil.mois_reserve_visees}
            onChange={(e) => set('mois_reserve_visees', Number(e.target.value) || 0)}
          />
        </div>
      </section>

      <section id="situation-familiale" className="card profil-section">
        <h3>Situation familiale</h3>
        <div className="field-row">
          <label>Statut marital</label>
          <select
            className="field-input"
            value={profil.statut_marital ?? ''}
            onChange={(e) => set('statut_marital', e.target.value || null)}
          >
            {STATUT_MARITAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label>Personnes à charge</label>
          <input
            className="field-input"
            type="number"
            min={0}
            value={profil.personnes_a_charge ?? ''}
            onChange={(e) => set('personnes_a_charge', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="btn-row">
          <button type="button" className="btn primary" disabled={saving} onClick={save}>
            Enregistrer
          </button>
        </div>
      </section>

      <QuestionnaireRisque profil={profil} notify={notify} onUpdated={setProfil} />
    </div>
  );
}
