import { Router } from 'express';
import { db } from '../db/client.js';
import { DOMAINES, lineIdsForDomain } from '../db/scope.js';
import { buildValueSeries, latestDelta, latestValue } from '../db/timeseries.js';

export const reportingRouter = Router();

interface Indicateur {
  label: string;
  value: string;
}

function entityFilterClause(entityId: number | 'all', column = 'l.entity_id'): { clause: string; params: unknown[] } {
  return entityId === 'all' ? { clause: '', params: [] } : { clause: ` AND ${column} = ?`, params: [entityId] };
}

// One qualitative "indicateur clé" per domaine (PRD §5.3) — cheap, derivable
// today from data already captured; not a Ticket-3 advice rule.
function indicateurCle(domaine: string, entityId: number | 'all'): Indicateur | null {
  const ent = entityFilterClause(entityId);

  if (domaine === 'liquidites') {
    const rows = db
      .prepare(
        `SELECT l.valeur_actuelle, ll.taux
         FROM lines l JOIN line_liquidites ll ON ll.line_id = l.id
         WHERE l.domaine = 'liquidites' AND ll.taux IS NOT NULL${ent.clause}`
      )
      .all(...ent.params) as { valeur_actuelle: number; taux: number }[];
    const weight = rows.reduce((s, r) => s + r.valeur_actuelle, 0);
    if (weight <= 0) return null;
    const avg = rows.reduce((s, r) => s + r.valeur_actuelle * r.taux, 0) / weight;
    return { label: 'Taux moyen pondéré', value: `${avg.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %` };
  }

  if (domaine === 'bourse') {
    const rows = db
      .prepare(
        `SELECT l.valeur_actuelle, lb.quantite, lb.cout_acquisition_unitaire
         FROM lines l JOIN line_bourse lb ON lb.line_id = l.id
         WHERE l.domaine = 'bourse' AND lb.quantite IS NOT NULL AND lb.cout_acquisition_unitaire IS NOT NULL${ent.clause}`
      )
      .all(...ent.params) as { valeur_actuelle: number; quantite: number; cout_acquisition_unitaire: number }[];
    if (rows.length === 0) return null;
    const pv = rows.reduce((s, r) => s + (r.valeur_actuelle - r.quantite * r.cout_acquisition_unitaire), 0);
    return { label: 'Plus-value latente (titres)', value: `${pv >= 0 ? '+' : ''}${Math.round(pv).toLocaleString('fr-FR')} €` };
  }

  if (domaine === 'immobilier') {
    const rows = db
      .prepare(
        `SELECT l.valeur_actuelle, li.prix_acquisition_total, vi.loyer, vi.charges, vi.taxe_fonciere, vi.assurance, vi.frais_gestion
         FROM lines l
         JOIN line_immobilier li ON li.line_id = l.id
         LEFT JOIN valorisations lv ON lv.id = (SELECT v.id FROM valorisations v WHERE v.line_id = l.id ORDER BY v.date DESC, v.id DESC LIMIT 1)
         LEFT JOIN valorisation_immobilier vi ON vi.valorisation_id = lv.id
         WHERE l.domaine = 'immobilier'${ent.clause}`
      )
      .all(...ent.params) as {
      valeur_actuelle: number;
      prix_acquisition_total: number | null;
      loyer: number | null;
      charges: number | null;
      taxe_fonciere: number | null;
      assurance: number | null;
      frais_gestion: number | null;
    }[];
    let weight = 0;
    let weighted = 0;
    for (const r of rows) {
      if (r.loyer == null || !r.prix_acquisition_total) continue;
      const loyerAnnuel = r.loyer * 12;
      const chargesAnnuelles =
        (r.charges ?? 0) * 12 + (r.taxe_fonciere ?? 0) + (r.assurance ?? 0) * 12 + (r.frais_gestion ?? 0) * 12;
      const rendementNet = ((loyerAnnuel - chargesAnnuelles) / r.prix_acquisition_total) * 100;
      weight += r.valeur_actuelle;
      weighted += rendementNet * r.valeur_actuelle;
    }
    if (weight <= 0) return null;
    return { label: 'Rendement net moyen pondéré', value: `${(weighted / weight).toFixed(1)} %` };
  }

  if (domaine === 'av_per') {
    const envEnt = entityFilterClause(entityId, 'env.entity_id');
    const rows = db
      .prepare(
        `SELECT env.date_ouverture
         FROM envelopes env JOIN envelope_av_per eap ON eap.envelope_id = env.id
         WHERE env.domaine = 'av_per' AND env.date_ouverture IS NOT NULL${envEnt.clause}`
      )
      .all(...envEnt.params) as { date_ouverture: string }[];
    if (rows.length === 0) return null;
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 8);
    const over8 = rows.filter((r) => new Date(r.date_ouverture).getTime() <= cutoff.getTime()).length;
    return { label: 'Contrats > 8 ans', value: `${over8} / ${rows.length}` };
  }

  if (domaine === 'crypto') {
    const lineEnt = entityFilterClause(entityId, 'l.entity_id');
    const rows = db
      .prepare(
        `SELECT l.valeur_actuelle, ec.plateforme_etrangere
         FROM lines l
         JOIN envelopes env ON env.id = l.envelope_id
         JOIN envelope_crypto ec ON ec.envelope_id = env.id
         WHERE l.domaine = 'crypto'${lineEnt.clause}`
      )
      .all(...lineEnt.params) as { valeur_actuelle: number; plateforme_etrangere: 0 | 1 }[];
    const total = rows.reduce((s, r) => s + r.valeur_actuelle, 0);
    if (total <= 0) return null;
    const etranger = rows.filter((r) => r.plateforme_etrangere).reduce((s, r) => s + r.valeur_actuelle, 0);
    return { label: 'Part sur plateforme étrangère', value: `${((etranger / total) * 100).toFixed(0)} %` };
  }

  if (domaine === 'pe_scpi') {
    const envEnt = entityFilterClause(entityId, 'env.entity_id');
    const rows = db
      .prepare(
        `SELECT env.date_ouverture, epc.duree_blocage
         FROM envelopes env JOIN envelope_pe_scpi epc ON epc.envelope_id = env.id
         WHERE env.domaine = 'pe_scpi' AND env.date_ouverture IS NOT NULL AND epc.duree_blocage IS NOT NULL${envEnt.clause}`
      )
      .all(...envEnt.params) as { date_ouverture: string; duree_blocage: number }[];
    if (rows.length === 0) return null;
    const now = Date.now();
    const remainders = rows.map((r) => {
      const echeance = new Date(r.date_ouverture);
      echeance.setFullYear(echeance.getFullYear() + Math.floor(r.duree_blocage));
      echeance.setMonth(echeance.getMonth() + Math.round((r.duree_blocage % 1) * 12));
      return Math.max(0, (echeance.getTime() - now) / (365.25 * 86_400_000));
    });
    const avg = remainders.reduce((s, v) => s + v, 0) / remainders.length;
    return { label: 'Blocage restant (moy.)', value: `${avg.toFixed(1)} an${avg >= 2 ? 's' : ''}` };
  }

  return null;
}

// GET /api/reporting/summary?entity_id=<id>|all
reportingRouter.get('/summary', (req, res) => {
  const entityIdRaw = req.query.entity_id as string | undefined;
  const entityId: number | 'all' = !entityIdRaw || entityIdRaw === 'all' ? 'all' : Number(entityIdRaw);

  const allLineIds = lineIdsForDomain(entityId);
  const totalSeries = buildValueSeries(allLineIds, { net: false });
  const netSeries = buildValueSeries(allLineIds, { net: true });
  const patrimoineTotal = latestValue(totalSeries);
  const patrimoineNet = latestValue(netSeries);
  const nombreEntites = (db.prepare('SELECT COUNT(*) AS c FROM entities').get() as { c: number }).c;

  const domains = DOMAINES.map((domaine) => {
    const lineIds = lineIdsForDomain(entityId, domaine);
    const series = buildValueSeries(lineIds, { net: false });
    const valeur = latestValue(series);
    return {
      domaine,
      valeur,
      part: patrimoineTotal > 0 ? (valeur / patrimoineTotal) * 100 : 0,
      variation: latestDelta(series),
      sparkline: series,
      indicateur_cle: indicateurCle(domaine, entityId),
    };
  });

  res.json({
    patrimoine_total: patrimoineTotal,
    patrimoine_net: patrimoineNet,
    nombre_entites: nombreEntites,
    domains,
  });
});

interface EnvelopeItemRow {
  id: number;
  libelle: string;
  entity_libelle: string;
}

// GET /api/reporting/domain/:domaine?entity_id=<id>|all
reportingRouter.get('/domain/:domaine', (req, res) => {
  const { domaine } = req.params;
  if (!DOMAINES.includes(domaine as (typeof DOMAINES)[number])) {
    return res.status(404).json({ error: 'Domaine inconnu' });
  }
  const entityIdRaw = req.query.entity_id as string | undefined;
  const entityId: number | 'all' = !entityIdRaw || entityIdRaw === 'all' ? 'all' : Number(entityIdRaw);

  const lineIds = lineIdsForDomain(entityId, domaine);
  const curve = buildValueSeries(lineIds, { net: false });

  const hasEnvelope = domaine !== 'liquidites' && domaine !== 'immobilier';
  let items: { id: number; libelle: string; entity_libelle: string; valeur: number; delta: number | null }[];

  if (hasEnvelope) {
    const envEnt = entityFilterClause(entityId, 'env.entity_id');
    const envelopes = db
      .prepare(
        `SELECT env.id, env.libelle, e.libelle AS entity_libelle
         FROM envelopes env JOIN entities e ON e.id = env.entity_id
         WHERE env.domaine = ?${envEnt.clause}
         ORDER BY env.libelle ASC`
      )
      .all(domaine, ...envEnt.params) as EnvelopeItemRow[];

    items = envelopes.map((env) => {
      const envLineIds = (
        db.prepare('SELECT id, valeur_actuelle FROM lines WHERE envelope_id = ?').all(env.id) as {
          id: number;
          valeur_actuelle: number;
        }[]
      );
      const valeur = envLineIds.reduce((s, l) => s + l.valeur_actuelle, 0);
      const series = buildValueSeries(
        envLineIds.map((l) => l.id),
        { net: false }
      );
      return { id: env.id, libelle: env.libelle, entity_libelle: env.entity_libelle, valeur, delta: latestDelta(series) };
    });
  } else {
    const ent = entityFilterClause(entityId);
    const lines = db
      .prepare(
        `SELECT l.id, l.libelle, l.valeur_actuelle, e.libelle AS entity_libelle
         FROM lines l JOIN entities e ON e.id = l.entity_id
         WHERE l.domaine = ?${ent.clause}
         ORDER BY l.libelle ASC`
      )
      .all(domaine, ...ent.params) as { id: number; libelle: string; valeur_actuelle: number; entity_libelle: string }[];

    items = lines.map((line) => ({
      id: line.id,
      libelle: line.libelle,
      entity_libelle: line.entity_libelle,
      valeur: line.valeur_actuelle,
      delta: latestDelta(buildValueSeries([line.id], { net: false })),
    }));
  }

  res.json({ domaine, curve, indicateur_cle: indicateurCle(domaine, entityId), items });
});
