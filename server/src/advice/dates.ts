// Petits utilitaires de dates partagés par les règles à échéance en deux temps
// (alerte N mois avant, puis note ponctuelle au franchissement) — cap des 8 ans AV,
// échéance de blocage PE/SCPI, prêt immobilier bientôt soldé.

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function yearsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (365.25 * 86_400_000);
}

export type DeadlineStatus = 'imminent' | 'franchi';

// null si l'échéance n'est ni imminente (fenêtre d'alerte) ni tout juste franchie (fenêtre
// de grâce, pour une note ponctuelle sans rester affichée indéfiniment sur un vieux contrat).
export function deadlineStatus(
  target: Date,
  alertMonthsBefore: number,
  graceMonthsAfter = 1,
  now: Date = new Date()
): DeadlineStatus | null {
  const alertStart = addMonths(target, -alertMonthsBefore);
  const graceEnd = addMonths(target, graceMonthsAfter);
  if (now >= alertStart && now <= target) return 'imminent';
  if (now > target && now <= graceEnd) return 'franchi';
  return null;
}
