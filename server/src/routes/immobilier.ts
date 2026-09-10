import { Router } from 'express';
import { db } from '../db/client.js';
import { recomputeLineCurrentValue } from '../db/valorisations.js';
import { capitalRestantDu, mensualite as calcMensualite, pretParamsFromColumns, type PretParams } from '../domain/pretImmobilier.js';

export const immobilierRouter = Router();

// LINE_SELECT joins in the latest Valorisation's valorisation_immobilier extension
// (capital restant dû, loyer…) so the dashboard can show current-state fields and
// derived ratios without a separate round-trip (PRD §5.2 amendment).
const LINE_SELECT = `
  SELECT
    l.id, l.entity_id, l.libelle, l.valeur_actuelle, l.date_derniere_valorisation, l.note,
    li.prix_acquisition_total, li.date_acquisition, li.residence_principale, li.regime_location,
    li.capital_emprunte_initial, li.taux_annuel, li.duree_mois, li.date_depart,
    e.libelle AS entity_libelle, e.type AS entity_type,
    vi.capital_restant_du, vi.loyer, vi.charges, vi.taxe_fonciere, vi.assurance, vi.frais_gestion, vi.mensualite
  FROM lines l
  JOIN line_immobilier li ON li.line_id = l.id
  JOIN entities e ON e.id = l.entity_id
  LEFT JOIN valorisations lv
    ON lv.id = (SELECT v.id FROM valorisations v WHERE v.line_id = l.id ORDER BY v.date DESC, v.id DESC LIMIT 1)
  LEFT JOIN valorisation_immobilier vi ON vi.valorisation_id = lv.id
  WHERE l.domaine = 'immobilier'
`;

interface LineRow {
  id: number;
  entity_id: number;
  libelle: string;
  valeur_actuelle: number;
  date_derniere_valorisation: string | null;
  note: string | null;
  prix_acquisition_total: number | null;
  date_acquisition: string | null;
  residence_principale: 0 | 1;
  regime_location: string | null;
  capital_emprunte_initial: number | null;
  taux_annuel: number | null;
  duree_mois: number | null;
  date_depart: string | null;
  entity_libelle: string;
  entity_type: string;
  capital_restant_du: number | null;
  loyer: number | null;
  charges: number | null;
  taxe_fonciere: number | null;
  assurance: number | null;
  frais_gestion: number | null;
  mensualite: number | null;
}

const pretParamsOf = pretParamsFromColumns;

// Dès qu'un Prêt est configuré sur la Ligne, capital restant dû et mensualité sont
// calculés à la volée depuis ses 4 champs — jamais lus depuis ce qui est stocké par
// Valorisation (ticket 10). `atDate` : la date à laquelle évaluer le capital restant
// dû (la Valorisation elle-même pour l'historique, aujourd'hui pour l'état courant).
function withPret<T extends { capital_restant_du: number | null; mensualite: number | null }>(
  row: T,
  pret: PretParams | null,
  atDate: string
): T {
  if (!pret) return row;
  return { ...row, capital_restant_du: capitalRestantDu(pret, atDate), mensualite: calcMensualite(pret) };
}

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) && v !== undefined && v !== null && v !== '' ? n : null;
}

// Derived rendement brut/net + cash-flow (PRD §5.2 amendment, formulas in §7.3 / research
// issue 21). Convention: loyer, charges, assurance, frais_gestion et mensualité sont des
// montants MENSUELS ; taxe_fonciere est un montant ANNUEL (seule charge facturée à l'année
// en France). Non calculé (null) tant que le loyer n'est pas renseigné — la Ligne n'est pas
// considérée louée.
function withDerived(row: LineRow) {
  const { prix_acquisition_total, loyer, charges, taxe_fonciere, assurance, frais_gestion, mensualite } = row;

  if (loyer == null || !prix_acquisition_total) {
    return { ...row, rendement_brut: null, rendement_net: null, cash_flow_mensuel: null, cash_flow_annuel: null };
  }

  const loyerAnnuel = loyer * 12;
  const chargesAnnuelles = (charges ?? 0) * 12 + (taxe_fonciere ?? 0) + (assurance ?? 0) * 12 + (frais_gestion ?? 0) * 12;

  const rendement_brut = (loyerAnnuel / prix_acquisition_total) * 100;
  const rendement_net = ((loyerAnnuel - chargesAnnuelles) / prix_acquisition_total) * 100;
  const cash_flow_mensuel =
    loyer - (charges ?? 0) - (taxe_fonciere ?? 0) / 12 - (assurance ?? 0) - (frais_gestion ?? 0) - (mensualite ?? 0);

  return { ...row, rendement_brut, rendement_net, cash_flow_mensuel, cash_flow_annuel: cash_flow_mensuel * 12 };
}

// GET /api/immobilier/lines?entity_id=<id>|all
immobilierRouter.get('/lines', (req, res) => {
  const entityId = req.query.entity_id as string | undefined;

  const rows =
    !entityId || entityId === 'all'
      ? (db.prepare(`${LINE_SELECT} ORDER BY l.libelle ASC`).all() as LineRow[])
      : (db.prepare(`${LINE_SELECT} AND l.entity_id = ? ORDER BY l.libelle ASC`).all(Number(entityId)) as LineRow[]);

  const today = new Date().toISOString().slice(0, 10);
  res.json(rows.map((row) => withDerived(withPret(row, pretParamsOf(row), today))));
});

// POST /api/immobilier/lines
immobilierRouter.post('/lines', (req, res) => {
  const {
    entity_id,
    libelle,
    prix_acquisition_total,
    date_acquisition,
    residence_principale,
    regime_location,
    capital_emprunte_initial,
    taux_annuel,
    duree_mois,
    date_depart,
    valeur_initiale,
    date,
    capital_restant_du,
    loyer,
    charges,
    taxe_fonciere,
    assurance,
    frais_gestion,
    mensualite,
  } = req.body ?? {};

  if (!entity_id || !libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'entity_id et libelle requis' });
  }

  const entity = db.prepare('SELECT id FROM entities WHERE id = ?').get(entity_id);
  if (!entity) {
    return res.status(404).json({ error: 'Entité introuvable' });
  }

  const valeur = typeof valeur_initiale === 'number' ? valeur_initiale : Number(valeur_initiale) || 0;
  const valDate = date || new Date().toISOString().slice(0, 10);

  const result = db.transaction(() => {
    const lineInfo = db
      .prepare(
        `INSERT INTO lines (entity_id, domaine, libelle, valeur_actuelle, date_derniere_valorisation, note)
         VALUES (?, 'immobilier', ?, ?, ?, NULL)`
      )
      .run(entity_id, libelle, valeur, valDate);
    const lineId = lineInfo.lastInsertRowid as number;

    db.prepare(
      `INSERT INTO line_immobilier
         (line_id, prix_acquisition_total, date_acquisition, residence_principale, regime_location,
          capital_emprunte_initial, taux_annuel, duree_mois, date_depart)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      lineId,
      toNumberOrNull(prix_acquisition_total),
      date_acquisition ?? null,
      residence_principale ? 1 : 0,
      regime_location ?? null,
      toNumberOrNull(capital_emprunte_initial),
      toNumberOrNull(taux_annuel),
      toNumberOrNull(duree_mois),
      date_depart ?? null
    );

    const valInfo = db
      .prepare('INSERT INTO valorisations (line_id, date, valeur) VALUES (?, ?, ?)')
      .run(lineId, valDate, valeur);
    db.prepare(
      `INSERT INTO valorisation_immobilier (valorisation_id, capital_restant_du, loyer, charges, taxe_fonciere, assurance, frais_gestion, mensualite)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      valInfo.lastInsertRowid,
      toNumberOrNull(capital_restant_du),
      toNumberOrNull(loyer),
      toNumberOrNull(charges),
      toNumberOrNull(taxe_fonciere),
      toNumberOrNull(assurance),
      toNumberOrNull(frais_gestion),
      toNumberOrNull(mensualite)
    );

    return lineId;
  })();

  const created = db.prepare(`${LINE_SELECT} AND l.id = ?`).get(result) as LineRow;
  const today = new Date().toISOString().slice(0, 10);
  res.status(201).json(withDerived(withPret(created, pretParamsOf(created), today)));
});

// PUT /api/immobilier/lines/:id
immobilierRouter.put('/lines/:id', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'immobilier'").get(lineId);
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  const {
    libelle,
    note,
    prix_acquisition_total,
    date_acquisition,
    residence_principale,
    regime_location,
    capital_emprunte_initial,
    taux_annuel,
    duree_mois,
    date_depart,
  } = req.body ?? {};

  db.transaction(() => {
    if (libelle !== undefined) {
      db.prepare('UPDATE lines SET libelle = ? WHERE id = ?').run(libelle, lineId);
    }
    if (note !== undefined) {
      db.prepare('UPDATE lines SET note = ? WHERE id = ?').run(note, lineId);
    }
    if (prix_acquisition_total !== undefined) {
      db.prepare('UPDATE line_immobilier SET prix_acquisition_total = ? WHERE line_id = ?').run(
        toNumberOrNull(prix_acquisition_total),
        lineId
      );
    }
    if (date_acquisition !== undefined) {
      db.prepare('UPDATE line_immobilier SET date_acquisition = ? WHERE line_id = ?').run(date_acquisition, lineId);
    }
    if (residence_principale !== undefined) {
      db.prepare('UPDATE line_immobilier SET residence_principale = ? WHERE line_id = ?').run(
        residence_principale ? 1 : 0,
        lineId
      );
    }
    if (regime_location !== undefined) {
      db.prepare('UPDATE line_immobilier SET regime_location = ? WHERE line_id = ?').run(regime_location, lineId);
    }
    if (capital_emprunte_initial !== undefined) {
      db.prepare('UPDATE line_immobilier SET capital_emprunte_initial = ? WHERE line_id = ?').run(
        toNumberOrNull(capital_emprunte_initial),
        lineId
      );
    }
    if (taux_annuel !== undefined) {
      db.prepare('UPDATE line_immobilier SET taux_annuel = ? WHERE line_id = ?').run(toNumberOrNull(taux_annuel), lineId);
    }
    if (duree_mois !== undefined) {
      db.prepare('UPDATE line_immobilier SET duree_mois = ? WHERE line_id = ?').run(toNumberOrNull(duree_mois), lineId);
    }
    if (date_depart !== undefined) {
      db.prepare('UPDATE line_immobilier SET date_depart = ? WHERE line_id = ?').run(date_depart || null, lineId);
    }
  })();

  const updated = db.prepare(`${LINE_SELECT} AND l.id = ?`).get(lineId) as LineRow;
  const today = new Date().toISOString().slice(0, 10);
  res.json(withDerived(withPret(updated, pretParamsOf(updated), today)));
});

// DELETE /api/immobilier/lines/:id
immobilierRouter.delete('/lines/:id', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'immobilier'").get(lineId);
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  db.transaction(() => {
    const valIds = (db.prepare('SELECT id FROM valorisations WHERE line_id = ?').all(lineId) as { id: number }[]).map(
      (r) => r.id
    );
    for (const valId of valIds) {
      db.prepare('DELETE FROM valorisation_immobilier WHERE valorisation_id = ?').run(valId);
    }
    db.prepare('DELETE FROM mouvements WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM valorisations WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM line_immobilier WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM lines WHERE id = ?').run(lineId);
  })();

  res.status(204).end();
});

// GET /api/immobilier/lines/:id/valorisations
immobilierRouter.get('/lines/:id/valorisations', (req, res) => {
  const lineId = Number(req.params.id);
  const rows = db
    .prepare(
      `SELECT v.id, v.date, v.valeur,
        vi.capital_restant_du, vi.loyer, vi.charges, vi.taxe_fonciere, vi.assurance, vi.frais_gestion, vi.mensualite
       FROM valorisations v
       LEFT JOIN valorisation_immobilier vi ON vi.valorisation_id = v.id
       WHERE v.line_id = ?
       ORDER BY v.date ASC, v.id ASC`
    )
    .all(lineId) as { id: number; date: string; valeur: number; capital_restant_du: number | null; mensualite: number | null }[];

  const line = db
    .prepare(
      'SELECT capital_emprunte_initial, taux_annuel, duree_mois, date_depart FROM line_immobilier WHERE line_id = ?'
    )
    .get(lineId) as
    | { capital_emprunte_initial: number | null; taux_annuel: number | null; duree_mois: number | null; date_depart: string | null }
    | undefined;
  const pret = line ? pretParamsOf(line) : null;

  res.json(rows.map((row) => withPret(row, pret, row.date)));
});

// POST /api/immobilier/lines/:id/valorisations
immobilierRouter.post('/lines/:id/valorisations', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'immobilier'").get(lineId);
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  const { date, valeur, capital_restant_du, loyer, charges, taxe_fonciere, assurance, frais_gestion, mensualite } =
    req.body ?? {};
  if (!date || typeof valeur !== 'number') {
    return res.status(400).json({ error: 'date et valeur (number) requis' });
  }

  const result = db.transaction(() => {
    const info = db
      .prepare('INSERT INTO valorisations (line_id, date, valeur) VALUES (?, ?, ?)')
      .run(lineId, date, valeur);
    db.prepare(
      `INSERT INTO valorisation_immobilier (valorisation_id, capital_restant_du, loyer, charges, taxe_fonciere, assurance, frais_gestion, mensualite)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      info.lastInsertRowid,
      toNumberOrNull(capital_restant_du),
      toNumberOrNull(loyer),
      toNumberOrNull(charges),
      toNumberOrNull(taxe_fonciere),
      toNumberOrNull(assurance),
      toNumberOrNull(frais_gestion),
      toNumberOrNull(mensualite)
    );

    recomputeLineCurrentValue(lineId);
    return info.lastInsertRowid;
  })();

  const created = db
    .prepare(
      `SELECT v.id, v.date, v.valeur,
        vi.capital_restant_du, vi.loyer, vi.charges, vi.taxe_fonciere, vi.assurance, vi.frais_gestion, vi.mensualite
       FROM valorisations v
       LEFT JOIN valorisation_immobilier vi ON vi.valorisation_id = v.id
       WHERE v.id = ?`
    )
    .get(result);
  res.status(201).json(created);
});

// PUT /api/immobilier/valorisations/:id
immobilierRouter.put('/valorisations/:id', (req, res) => {
  const valId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM valorisations WHERE id = ?').get(valId) as
    | { id: number; line_id: number; date: string; valeur: number }
    | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'Valorisation introuvable' });
  }

  const { date, valeur, capital_restant_du, loyer, charges, taxe_fonciere, assurance, frais_gestion, mensualite } =
    req.body ?? {};

  db.transaction(() => {
    db.prepare('UPDATE valorisations SET date = COALESCE(?, date), valeur = COALESCE(?, valeur) WHERE id = ?').run(
      date ?? null,
      typeof valeur === 'number' ? valeur : null,
      valId
    );

    const hasExtension = db
      .prepare('SELECT 1 FROM valorisation_immobilier WHERE valorisation_id = ?')
      .get(valId);
    const fields = { capital_restant_du, loyer, charges, taxe_fonciere, assurance, frais_gestion, mensualite };
    if (!hasExtension) {
      db.prepare(
        `INSERT INTO valorisation_immobilier (valorisation_id, capital_restant_du, loyer, charges, taxe_fonciere, assurance, frais_gestion, mensualite)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        valId,
        toNumberOrNull(fields.capital_restant_du),
        toNumberOrNull(fields.loyer),
        toNumberOrNull(fields.charges),
        toNumberOrNull(fields.taxe_fonciere),
        toNumberOrNull(fields.assurance),
        toNumberOrNull(fields.frais_gestion),
        toNumberOrNull(fields.mensualite)
      );
    } else {
      db.prepare(
        `UPDATE valorisation_immobilier SET
          capital_restant_du = COALESCE(?, capital_restant_du),
          loyer = COALESCE(?, loyer),
          charges = COALESCE(?, charges),
          taxe_fonciere = COALESCE(?, taxe_fonciere),
          assurance = COALESCE(?, assurance),
          frais_gestion = COALESCE(?, frais_gestion),
          mensualite = COALESCE(?, mensualite)
         WHERE valorisation_id = ?`
      ).run(
        toNumberOrNull(fields.capital_restant_du),
        toNumberOrNull(fields.loyer),
        toNumberOrNull(fields.charges),
        toNumberOrNull(fields.taxe_fonciere),
        toNumberOrNull(fields.assurance),
        toNumberOrNull(fields.frais_gestion),
        toNumberOrNull(fields.mensualite),
        valId
      );
    }

    recomputeLineCurrentValue(existing.line_id);
  })();

  const updated = db
    .prepare(
      `SELECT v.id, v.date, v.valeur,
        vi.capital_restant_du, vi.loyer, vi.charges, vi.taxe_fonciere, vi.assurance, vi.frais_gestion, vi.mensualite
       FROM valorisations v
       LEFT JOIN valorisation_immobilier vi ON vi.valorisation_id = v.id
       WHERE v.id = ?`
    )
    .get(valId);
  res.json(updated);
});

// DELETE /api/immobilier/valorisations/:id
immobilierRouter.delete('/valorisations/:id', (req, res) => {
  const valId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM valorisations WHERE id = ?').get(valId) as
    | { id: number; line_id: number }
    | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'Valorisation introuvable' });
  }

  db.transaction(() => {
    db.prepare('DELETE FROM valorisation_immobilier WHERE valorisation_id = ?').run(valId);
    db.prepare('DELETE FROM valorisations WHERE id = ?').run(valId);
    recomputeLineCurrentValue(existing.line_id);
  })();

  res.status(204).end();
});
