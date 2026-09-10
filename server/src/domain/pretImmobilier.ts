// Prêt immobilier (refonte-saisie-patrimoine, ticket 10) — amortissement classique
// français à mensualités constantes. Capital restant dû et mensualité se calculent à
// la volée depuis les 4 champs du Prêt (jamais stockés) : capital emprunté initial,
// taux annuel, durée, date de départ.

export interface PretParams {
  capitalEmprunteInitial: number;
  tauxAnnuel: number;
  dureeMois: number;
  dateDepart: string;
}

export function pretConfigure(params: Partial<PretParams>): params is PretParams {
  return (
    params.capitalEmprunteInitial != null &&
    params.tauxAnnuel != null &&
    params.dureeMois != null &&
    !!params.dateDepart
  );
}

export interface PretColumns {
  capital_emprunte_initial: number | null;
  taux_annuel: number | null;
  duree_mois: number | null;
  date_depart: string | null;
}

// Lit les 4 colonnes `line_immobilier` telles que retournées par une requête SQL et
// renvoie `null` si le Prêt n'est pas configuré — factorise la même lecture entre les
// routes (server/src/routes/immobilier.ts) et les règles de conseil
// (server/src/advice/rules/immobilier.ts).
export function pretParamsFromColumns(row: PretColumns): PretParams | null {
  const params = {
    capitalEmprunteInitial: row.capital_emprunte_initial ?? undefined,
    tauxAnnuel: row.taux_annuel ?? undefined,
    dureeMois: row.duree_mois ?? undefined,
    dateDepart: row.date_depart ?? undefined,
  };
  return pretConfigure(params) ? params : null;
}

// Mensualité constante — capital * i / (1 - (1+i)^-n), i = taux mensuel. Cas taux nul :
// simple division linéaire (limite mathématique de la formule quand i → 0).
export function mensualite({ capitalEmprunteInitial, tauxAnnuel, dureeMois }: PretParams): number {
  if (dureeMois <= 0) return 0;
  const i = tauxAnnuel / 100 / 12;
  if (i === 0) return capitalEmprunteInitial / dureeMois;
  return (capitalEmprunteInitial * i) / (1 - Math.pow(1 + i, -dureeMois));
}

// Nombre de mois calendaires pleins écoulés entre `dateDepart` et `atDate`, borné à
// [0, dureeMois] — avant le départ le prêt n'a pas commencé (capital intact), après le
// terme il est soldé.
function moisEcoules(dateDepart: string, atDate: string, dureeMois: number): number {
  const start = new Date(dateDepart);
  const at = new Date(atDate);
  let months = (at.getFullYear() - start.getFullYear()) * 12 + (at.getMonth() - start.getMonth());
  if (at.getDate() < start.getDate()) months -= 1;
  return Math.min(Math.max(months, 0), dureeMois);
}

// Capital restant dû à `atDate` — CRD(m) = capital * ((1+i)^n - (1+i)^m) / ((1+i)^n - 1).
export function capitalRestantDu(params: PretParams, atDate: string): number {
  const { capitalEmprunteInitial, tauxAnnuel, dureeMois, dateDepart } = params;
  const m = moisEcoules(dateDepart, atDate, dureeMois);
  if (m >= dureeMois) return 0;
  if (m <= 0) return capitalEmprunteInitial;

  const i = tauxAnnuel / 100 / 12;
  if (i === 0) return capitalEmprunteInitial * ((dureeMois - m) / dureeMois);

  const facteurN = Math.pow(1 + i, dureeMois);
  const facteurM = Math.pow(1 + i, m);
  return capitalEmprunteInitial * ((facteurN - facteurM) / (facteurN - 1));
}

// Date de fin de prêt exacte — remplace, pour une Ligne avec Prêt configuré,
// l'estimation par tendance linéaire (estimateLoanPayoffDate, seul recours pour une
// Ligne sans Prêt).
export function dateFinPret({ dateDepart, dureeMois }: PretParams): Date {
  const d = new Date(dateDepart);
  d.setMonth(d.getMonth() + dureeMois);
  return d;
}
