// Estimation d'intérêts simples au prorata du nombre de jours écoulés depuis
// la dernière Valorisation — une approximation volontairement simple (pas les
// quinzaines réglementaires du Livret A/LDDS, pas les versements/retraits
// intermédiaires), affichée comme telle dans l'UI plutôt que comme une valeur
// officielle.
export function estimateAccruedValue(valeur: number, sinceIso: string, tauxPct: number, asOfIso?: string): number {
  const since = new Date(sinceIso);
  const asOf = asOfIso ? new Date(asOfIso) : new Date();
  const days = Math.max(0, (asOf.getTime() - since.getTime()) / 86_400_000);
  return valeur * (1 + (tauxPct / 100) * (days / 365));
}
