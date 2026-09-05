import { Router } from 'express';
import { db } from '../db/client.js';
import { DOMAINES, lineIdsForLien } from '../db/scope.js';
import { buildValueSeries, latestValue, linearTrendEstimate } from '../db/timeseries.js';

export const objectifsRouter = Router();

export const OBJECTIF_TYPES = [
  'retraite',
  'achat_immobilier',
  'transmission',
  'securite_urgence',
  'independance_financiere',
  'projet_libre',
] as const;
type ObjectifType = (typeof OBJECTIF_TYPES)[number];

const TEMPLATES: Record<string, { type: ObjectifType; libelle: string }> = {
  fonds_urgence: { type: 'securite_urgence', libelle: "Fonds d'urgence" },
  retraite: { type: 'retraite', libelle: 'Retraite' },
  achat_immobilier: { type: 'achat_immobilier', libelle: 'Achat immobilier' },
  transmission: { type: 'transmission', libelle: 'Transmission' },
  independance_financiere: { type: 'independance_financiere', libelle: 'Indépendance financière' },
};

interface ObjectifRow {
  id: number;
  type: string;
  libelle: string;
  horizon: string | null;
  montant_cible: number | null;
  lien_patrimoine_type: 'total' | 'domaines' | 'entite' | null;
  lien_domaines: string | null;
  lien_entite_id: number | null;
}

function withProgress(row: ObjectifRow) {
  const lienDomaines = row.lien_domaines ? (JSON.parse(row.lien_domaines) as string[]) : null;

  if (!row.lien_patrimoine_type) {
    return {
      ...row,
      lien_domaines: lienDomaines,
      montant_actuel: null,
      avancee_pct: null,
      estimation_date: null,
      estimation_status: 'no_lien' as const,
    };
  }

  const lineIds = lineIdsForLien({ type: row.lien_patrimoine_type, domaines: lienDomaines, entity_id: row.lien_entite_id });
  const series = buildValueSeries(lineIds, { net: true });
  const montantActuel = latestValue(series);
  const avancee = row.montant_cible ? (montantActuel / row.montant_cible) * 100 : null;

  if (!row.montant_cible) {
    return {
      ...row,
      lien_domaines: lienDomaines,
      montant_actuel: montantActuel,
      avancee_pct: avancee,
      estimation_date: null,
      estimation_status: 'no_target' as const,
    };
  }

  const trend = linearTrendEstimate(series, row.montant_cible);
  return {
    ...row,
    lien_domaines: lienDomaines,
    montant_actuel: montantActuel,
    avancee_pct: avancee,
    estimation_date: trend.estimatedDate,
    estimation_status: trend.status,
  };
}

objectifsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM objectifs ORDER BY id ASC').all() as ObjectifRow[];
  res.json(rows.map(withProgress));
});

function validateLien(body: Record<string, unknown>): { error?: string } {
  if (body.lien_patrimoine_type === undefined || body.lien_patrimoine_type === null) return {};
  if (!['total', 'domaines', 'entite'].includes(body.lien_patrimoine_type as string)) {
    return { error: "lien_patrimoine_type doit être 'total', 'domaines' ou 'entite'" };
  }
  if (body.lien_patrimoine_type === 'domaines') {
    const domaines = body.lien_domaines;
    if (!Array.isArray(domaines) || domaines.length === 0 || !domaines.every((d) => DOMAINES.includes(d))) {
      return { error: 'lien_domaines doit être un tableau non vide de domaines valides' };
    }
  }
  if (body.lien_patrimoine_type === 'entite' && !body.lien_entite_id) {
    return { error: 'lien_entite_id requis pour un lien de type entite' };
  }
  return {};
}

objectifsRouter.post('/', (req, res) => {
  const body = req.body ?? {};
  const { type, libelle, horizon, montant_cible, lien_patrimoine_type, lien_domaines, lien_entite_id } = body;

  if (!OBJECTIF_TYPES.includes(type)) {
    return res.status(400).json({ error: `type doit être l'un de ${OBJECTIF_TYPES.join(', ')}` });
  }
  if (!libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'libelle requis' });
  }
  const lienCheck = validateLien(body);
  if (lienCheck.error) return res.status(400).json({ error: lienCheck.error });

  const info = db
    .prepare(
      `INSERT INTO objectifs (type, libelle, horizon, montant_cible, lien_patrimoine_type, lien_domaines, lien_entite_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      type,
      libelle,
      horizon ?? null,
      typeof montant_cible === 'number' ? montant_cible : null,
      lien_patrimoine_type ?? null,
      lien_patrimoine_type === 'domaines' ? JSON.stringify(lien_domaines) : null,
      lien_patrimoine_type === 'entite' ? lien_entite_id : null
    );

  const created = db.prepare('SELECT * FROM objectifs WHERE id = ?').get(info.lastInsertRowid) as ObjectifRow;
  res.status(201).json(withProgress(created));
});

// POST /api/objectifs/bulk — create-in-batch from suggested gabarits (ticket 09).
objectifsRouter.post('/bulk', (req, res) => {
  const { templates } = req.body ?? {};
  if (!Array.isArray(templates) || templates.length === 0) {
    return res.status(400).json({ error: 'templates doit être un tableau non vide' });
  }
  const unknown = templates.filter((t) => !TEMPLATES[t]);
  if (unknown.length > 0) {
    return res.status(400).json({ error: `Gabarit(s) inconnu(s) : ${unknown.join(', ')}` });
  }

  const created = db.transaction(() =>
    templates.map((key: string) => {
      const tpl = TEMPLATES[key];
      const info = db
        .prepare('INSERT INTO objectifs (type, libelle) VALUES (?, ?)')
        .run(tpl.type, tpl.libelle);
      return db.prepare('SELECT * FROM objectifs WHERE id = ?').get(info.lastInsertRowid) as ObjectifRow;
    })
  )();

  res.status(201).json(created.map(withProgress));
});

// PUT /api/objectifs/:id — édition rapide (horizon, montant cible, lien) uniquement ;
// type et libellé ne sont pas modifiables depuis cette voie (ticket 09).
objectifsRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM objectifs WHERE id = ?').get(id) as ObjectifRow | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'Objectif introuvable' });
  }

  const body = req.body ?? {};
  const lienCheck = validateLien(body);
  if (lienCheck.error) return res.status(400).json({ error: lienCheck.error });

  const sets: string[] = [];
  const params: unknown[] = [];
  if (body.horizon !== undefined) {
    sets.push('horizon = ?');
    params.push(body.horizon || null);
  }
  if (body.montant_cible !== undefined) {
    sets.push('montant_cible = ?');
    params.push(typeof body.montant_cible === 'number' ? body.montant_cible : null);
  }
  if (body.lien_patrimoine_type !== undefined) {
    sets.push('lien_patrimoine_type = ?', 'lien_domaines = ?', 'lien_entite_id = ?');
    params.push(
      body.lien_patrimoine_type || null,
      body.lien_patrimoine_type === 'domaines' ? JSON.stringify(body.lien_domaines) : null,
      body.lien_patrimoine_type === 'entite' ? body.lien_entite_id : null
    );
  }

  if (sets.length > 0) {
    db.prepare(`UPDATE objectifs SET ${sets.join(', ')} WHERE id = ?`).run(...params, id);
  }

  const updated = db.prepare('SELECT * FROM objectifs WHERE id = ?').get(id) as ObjectifRow;
  res.json(withProgress(updated));
});

objectifsRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM objectifs WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Objectif introuvable' });
  }
  db.prepare('DELETE FROM objectifs WHERE id = ?').run(id);
  res.status(204).end();
});
