// Résolution de cours boursiers par ISIN pour le refresh manuel du dashboard Bourse.
// Source retenue (valorisation-bourse-temps-reel, ticket 05) : endpoints non officiels
// de Yahoo Finance (résolution ISIN -> ticker, puis cours), avec Frankfurter (BCE) pour
// la conversion de devise. Voir .scratch/valorisation-bourse-temps-reel/assets/05-recherche-source-cours.md
// pour le détail des tests en direct qui ont mené à ce choix, et les alternatives écartées.

const YAHOO_UA = 'Mozilla/5.0';
const FETCH_TIMEOUT_MS = 8000;

export type CoursEchecRaison = 'isin_non_trouve' | 'devise_non_convertible' | 'source_indisponible';

export class CoursExterneError extends Error {
  constructor(public reason: CoursEchecRaison) {
    super(reason);
  }
}

interface YahooSearchResponse {
  quotes?: { symbol?: string }[];
}

interface YahooChartResponse {
  chart?: {
    result?: { meta?: { regularMarketPrice?: number; currency?: string } }[];
  };
}

interface FrankfurterResponse {
  rates?: Record<string, number>;
}

async function fetchJson<T>(url: string, reasonOnFailure: CoursEchecRaison): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { 'User-Agent': YAHOO_UA }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch {
    throw new CoursExterneError('source_indisponible');
  }
  if (!res.ok) throw new CoursExterneError(reasonOnFailure);
  try {
    return (await res.json()) as T;
  } catch {
    throw new CoursExterneError(reasonOnFailure);
  }
}

// ISIN -> ticker Yahoo (ex. FR0000121014 -> MC.PA), premier résultat de la recherche
// (cf. ticket 05 : testé en direct, résout correctement les ISIN Euronext/US courants).
async function resolveTicker(isin: string): Promise<string> {
  const data = await fetchJson<YahooSearchResponse>(
    `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(isin)}`,
    'isin_non_trouve'
  );
  const symbol = data.quotes?.[0]?.symbol;
  if (!symbol) throw new CoursExterneError('isin_non_trouve');
  return symbol;
}

async function fetchQuote(symbol: string): Promise<{ prix: number; devise: string }> {
  const data = await fetchJson<YahooChartResponse>(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
    'isin_non_trouve'
  );
  const meta = data.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== 'number' || !meta.currency) {
    throw new CoursExterneError('isin_non_trouve');
  }
  return { prix: meta.regularMarketPrice, devise: meta.currency };
}

async function fetchFxRateToEur(devise: string): Promise<number> {
  const data = await fetchJson<FrankfurterResponse>(
    `https://api.frankfurter.app/latest?from=${encodeURIComponent(devise)}&to=EUR`,
    'devise_non_convertible'
  );
  const rate = data.rates?.EUR;
  if (typeof rate !== 'number') throw new CoursExterneError('devise_non_convertible');
  return rate;
}

export interface CoursResult {
  coursEur: number;
}

// Récupère le cours d'un ISIN et le convertit en EUR si besoin. `fxCache` est partagé
// entre les Lignes d'un même refresh pour dédupliquer les appels Frankfurter par devise
// (ticket 06 : "récupéré une fois par devise distincte présente dans le lot").
export async function resolveCoursEur(isin: string, fxCache: Map<string, Promise<number>>): Promise<CoursResult> {
  const symbol = await resolveTicker(isin);
  const { prix, devise } = await fetchQuote(symbol);
  if (devise === 'EUR') return { coursEur: prix };

  let ratePromise = fxCache.get(devise);
  if (!ratePromise) {
    ratePromise = fetchFxRateToEur(devise);
    fxCache.set(devise, ratePromise);
  }
  const rate = await ratePromise;
  return { coursEur: prix * rate };
}
