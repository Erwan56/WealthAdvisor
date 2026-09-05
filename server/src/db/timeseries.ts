import { db } from './client.js';

export interface Point {
  date: string;
  value: number;
}

interface RawValorisation {
  line_id: number;
  date: string;
  valeur: number;
  capital_restant_du: number | null;
}

// Consolidates several Lignes into a single value series: one point per distinct
// date at which ANY of the Lignes was revalued, carrying each Ligne's last known
// value forward in between (a Ligne contributes 0 before its own first
// Valorisation — it didn't exist in the patrimoine yet). This matches PRD §5.3:
// granularity is "one point per real update", never resampled — even for an
// aggregated curve spanning several Lignes with independent update cadences.
export function buildValueSeries(lineIds: number[], opts: { net?: boolean } = {}): Point[] {
  if (lineIds.length === 0) return [];

  const placeholders = lineIds.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT v.line_id, v.date, v.valeur, vi.capital_restant_du
       FROM valorisations v
       LEFT JOIN valorisation_immobilier vi ON vi.valorisation_id = v.id
       WHERE v.line_id IN (${placeholders})
       ORDER BY v.date ASC, v.id ASC`
    )
    .all(...lineIds) as RawValorisation[];

  if (rows.length === 0) return [];

  const byLine = new Map<number, { date: string; value: number }[]>();
  for (const row of rows) {
    const value = opts.net ? row.valeur - (row.capital_restant_du ?? 0) : row.valeur;
    const list = byLine.get(row.line_id) ?? [];
    list.push({ date: row.date, value });
    byLine.set(row.line_id, list);
  }

  const dates = Array.from(new Set(rows.map((r) => r.date))).sort();
  const cursor = new Map<number, number>();
  const last = new Map<number, number>();

  const series: Point[] = [];
  for (const date of dates) {
    let changed = false;
    for (const [lineId, points] of byLine) {
      let idx = cursor.get(lineId) ?? 0;
      while (idx < points.length && points[idx].date === date) {
        last.set(lineId, points[idx].value);
        idx++;
        changed = true;
      }
      cursor.set(lineId, idx);
    }
    if (changed) {
      let total = 0;
      for (const v of last.values()) total += v;
      series.push({ date, value: total });
    }
  }
  return series;
}

export function latestValue(series: Point[]): number {
  return series.length ? series[series.length - 1].value : 0;
}

// Delta between the two most recent consolidated points — the same "since last
// update" semantics already used per-Ligne in the domain journals.
export function latestDelta(series: Point[]): number | null {
  if (series.length < 2) return null;
  return series[series.length - 1].value - series[series.length - 2].value;
}

export type TrendStatus = 'ok' | 'insufficient' | 'flat_or_negative';

export interface TrendEstimate {
  estimatedDate: string | null;
  status: TrendStatus;
}

// Linear trend across the WHOLE available history (first → last point) — per
// ticket 26, deliberately not a "last 2 points" trend: update cadence is
// irregular and sparse, so only the full history smooths out the noise.
export function linearTrendEstimate(series: Point[], target: number): TrendEstimate {
  if (series.length < 2) return { estimatedDate: null, status: 'insufficient' };

  const first = series[0];
  const last = series[series.length - 1];
  const days = (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86_400_000;
  if (days <= 0) return { estimatedDate: null, status: 'insufficient' };

  const ratePerDay = (last.value - first.value) / days;
  if (ratePerDay <= 0) return { estimatedDate: null, status: 'flat_or_negative' };

  if (last.value >= target) return { estimatedDate: last.date, status: 'ok' };

  const daysNeeded = (target - last.value) / ratePerDay;
  const estimated = new Date(last.date).getTime() + daysNeeded * 86_400_000;
  return { estimatedDate: new Date(estimated).toISOString().slice(0, 10), status: 'ok' };
}
