import { Router } from 'express';
import { db } from '../db/client.js';

export const profilRouter = Router();

const EDITABLE_FIELDS = [
  'date_naissance',
  'horizon_global',
  'tmi',
  'plafond_per_annuel',
  'depenses_mensuelles_courantes',
  'mois_reserve_visees',
  'statut_marital',
  'personnes_a_charge',
] as const;

// 4-question scored Questionnaire de risque (PRD §2.2, ticket 02): 3 factual
// questions (perte simulée / horizon / priorité sécurité-performance) score
// 1-3 points each towards the risque_bucket ; the connaissance-des-marchés
// question also scores but additionally sets risque_connaissance directly.
interface QuestionOption {
  value: string;
  label: string;
  points: number;
  connaissance?: 'novice' | 'initie' | 'expert';
}
interface Question {
  index: number;
  title: string;
  options: QuestionOption[];
}

const QUESTIONS: Question[] = [
  {
    index: 0,
    title: 'Si votre portefeuille perdait 20 % de sa valeur en quelques mois, vous…',
    options: [
      { value: 'a', label: 'Vendez pour limiter la perte', points: 1 },
      { value: 'b', label: 'Ne changez rien, vous attendez', points: 2 },
      { value: 'c', label: 'Investissez davantage pendant que les prix sont bas', points: 3 },
    ],
  },
  {
    index: 1,
    title: 'Sur quel horizon comptez-vous laisser cet argent investi ?',
    options: [
      { value: 'a', label: 'Moins de 3 ans', points: 1 },
      { value: 'b', label: 'Entre 3 et 8 ans', points: 2 },
      { value: 'c', label: 'Plus de 8 ans', points: 3 },
    ],
  },
  {
    index: 2,
    title: 'Comment évaluez-vous votre connaissance des marchés financiers ?',
    options: [
      { value: 'a', label: 'Novice — je débute', points: 1, connaissance: 'novice' },
      { value: 'b', label: 'Initié — je comprends les grandes lignes', points: 2, connaissance: 'initie' },
      { value: 'c', label: 'Expert — je suis à l’aise avec les produits complexes', points: 3, connaissance: 'expert' },
    ],
  },
  {
    index: 3,
    title: 'Entre sécurité du capital et performance, votre priorité est…',
    options: [
      { value: 'a', label: 'La sécurité, quitte à avoir peu de rendement', points: 1 },
      { value: 'b', label: 'Un équilibre entre les deux', points: 2 },
      { value: 'c', label: 'La performance, quitte à accepter des pertes temporaires', points: 3 },
    ],
  },
];

function bucketFromScore(score: number): 'prudent' | 'equilibre' | 'dynamique' {
  if (score <= 6) return 'prudent';
  if (score <= 9) return 'equilibre';
  return 'dynamique';
}

profilRouter.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM profil WHERE id = 1').get());
});

profilRouter.put('/', (req, res) => {
  const body = req.body ?? {};
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) {
      sets.push(`${field} = ?`);
      params.push(body[field]);
    }
  }
  if (sets.length > 0) {
    db.prepare(`UPDATE profil SET ${sets.join(', ')} WHERE id = 1`).run(...params);
  }
  res.json(db.prepare('SELECT * FROM profil WHERE id = 1').get());
});

profilRouter.get('/questionnaire/questions', (_req, res) => {
  res.json(QUESTIONS.map((q) => ({ index: q.index, title: q.title, options: q.options.map(({ value, label }) => ({ value, label })) })));
});

// Latest recorded answer per question (to prefill a retake) — most recent
// passage only, previous passages aren't surfaced (état courant, non historisé).
profilRouter.get('/questionnaire/reponses', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT question_index, reponse, date FROM questionnaire_risque_reponses r1
       WHERE id = (SELECT id FROM questionnaire_risque_reponses r2 WHERE r2.question_index = r1.question_index ORDER BY date DESC, id DESC LIMIT 1)
       ORDER BY question_index ASC`
    )
    .all();
  res.json(rows);
});

profilRouter.post('/questionnaire', (req, res) => {
  const { reponses } = req.body ?? {};
  if (!Array.isArray(reponses) || reponses.length !== QUESTIONS.length) {
    return res.status(400).json({ error: `reponses doit contenir ${QUESTIONS.length} réponses` });
  }

  let score = 0;
  let connaissance: 'novice' | 'initie' | 'expert' | null = null;
  for (const q of QUESTIONS) {
    const answer = reponses[q.index];
    const option = q.options.find((o) => o.value === answer);
    if (!option) {
      return res.status(400).json({ error: `Réponse invalide pour la question ${q.index + 1}` });
    }
    score += option.points;
    if (option.connaissance) connaissance = option.connaissance;
  }

  const bucket = bucketFromScore(score);
  const date = new Date().toISOString().slice(0, 10);

  db.transaction(() => {
    for (const q of QUESTIONS) {
      db.prepare('INSERT INTO questionnaire_risque_reponses (question_index, reponse, date) VALUES (?, ?, ?)').run(
        q.index,
        reponses[q.index],
        date
      );
    }
    db.prepare(
      'UPDATE profil SET risque_bucket = ?, risque_connaissance = ?, risque_override_manuel = 0 WHERE id = 1'
    ).run(bucket, connaissance);
  })();

  res.json(db.prepare('SELECT * FROM profil WHERE id = 1').get());
});
