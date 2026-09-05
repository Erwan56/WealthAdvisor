import { useEffect, useState } from 'react';
import { api } from '../api';
import { RISQUE_BUCKET_LABELS, RISQUE_CONNAISSANCE_LABELS } from '../types';
import type { Profil, QuestionnaireQuestion } from '../types';

interface Props {
  profil: Profil;
  notify: (message: string, warn?: boolean) => void;
  onUpdated: (profil: Profil) => void;
}

// Carte Questionnaire de risque : résultat courant + "Ajuster en chat" (bouton
// découvrable, l'override réel se fait dans l'assistant conversationnel — hors
// périmètre tant que le Ticket 4 LLM n'existe pas) + reprise du questionnaire
// (4 questions scorées → bucket, écrase l'éventuel override précédent).
export function QuestionnaireRisque({ profil, notify, onUpdated }: Props) {
  const [questions, setQuestions] = useState<QuestionnaireQuestion[] | null>(null);
  const [retaking, setRetaking] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (retaking && questions === null) {
      api.profil.questions().then(setQuestions);
    }
  }, [retaking, questions]);

  const startRetake = () => {
    setAnswers({});
    setRetaking(true);
  };

  const submit = async () => {
    if (!questions || questions.some((q) => !answers[q.index])) {
      notify('Répondez aux 4 questions', true);
      return;
    }
    setSaving(true);
    try {
      const updated = await api.profil.submitQuestionnaire(questions.map((q) => answers[q.index]));
      onUpdated(updated);
      notify('Profil de risque mis à jour');
      setRetaking(false);
    } catch (err) {
      notify((err as Error).message, true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="questionnaire-risque" className="card profil-section">
      <h3>Questionnaire de risque</h3>

      {!retaking ? (
        <>
          {profil.risque_bucket ? (
            <div className="risque-result">
              <div className="risque-bucket-badge">{RISQUE_BUCKET_LABELS[profil.risque_bucket]}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>
                Connaissance des marchés :{' '}
                <strong>{profil.risque_connaissance ? RISQUE_CONNAISSANCE_LABELS[profil.risque_connaissance] : '—'}</strong>
                {profil.risque_override_manuel ? ' · ajusté manuellement en chat' : ''}
              </div>
            </div>
          ) : (
            <div className="muted-hint">Questionnaire pas encore complété.</div>
          )}
          <div className="btn-row" style={{ padding: '14px 0 0' }}>
            <button type="button" className="btn primary" onClick={startRetake}>
              {profil.risque_bucket ? 'Refaire le questionnaire' : 'Faire le questionnaire'}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => notify('Disponible avec l’assistant conversationnel (à venir)', true)}
            >
              Ajuster en chat
            </button>
          </div>
        </>
      ) : questions === null ? (
        <div className="empty-state">Chargement…</div>
      ) : (
        <>
          {questions.map((q) => (
            <div className="field-row" key={q.index}>
              <label>{q.title}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {q.options.map((o) => (
                  <label key={o.value} className={`type-option ${answers[q.index] === o.value ? 'selected' : ''}`} style={{ padding: '8px 10px' }}>
                    <input
                      type="radio"
                      name={`q-${q.index}`}
                      checked={answers[q.index] === o.value}
                      onChange={() => setAnswers((a) => ({ ...a, [q.index]: o.value }))}
                    />
                    <div className="to-name" style={{ fontWeight: 500 }}>
                      {o.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="btn-row">
            <button type="button" className="btn primary" disabled={saving} onClick={submit}>
              Valider mes réponses
            </button>
            <button type="button" className="btn ghost" onClick={() => setRetaking(false)}>
              Annuler
            </button>
          </div>
        </>
      )}
    </section>
  );
}
