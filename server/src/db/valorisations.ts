import { db } from './client.js';

// Recomputes a Ligne's cached `valeur_actuelle` / `date_derniere_valorisation`
// from its Valorisation history. Shared across domains: the Valorisation
// journal semantics (§3.7) are identical regardless of domaine.
export function recomputeLineCurrentValue(lineId: number): void {
  const latest = db
    .prepare('SELECT date, valeur FROM valorisations WHERE line_id = ? ORDER BY date DESC, id DESC LIMIT 1')
    .get(lineId) as { date: string; valeur: number } | undefined;

  if (latest) {
    db.prepare('UPDATE lines SET valeur_actuelle = ?, date_derniere_valorisation = ? WHERE id = ?').run(
      latest.valeur,
      latest.date,
      lineId
    );
  } else {
    db.prepare('UPDATE lines SET valeur_actuelle = 0, date_derniere_valorisation = NULL WHERE id = ?').run(lineId);
  }
}
