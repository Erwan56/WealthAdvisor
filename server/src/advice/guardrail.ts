// Garde-fou numérique (PRD §6, ticket 4) : le LLM ne doit énoncer que des chiffres qu'il a
// reçus de la couche déterministe, jamais en recalculer ou en inventer.
//
// Vérification a posteriori plutôt qu'une contrainte de génération : on extrait tous les
// nombres du contexte transmis au LLM (JSON complet — Findings, Profil, patrimoine) comme
// ensemble "autorisé", puis tous les nombres de sa réponse en langage naturel, et on signale
// (sans bloquer — un faux positif de formatage ne doit pas priver l'utilisateur d'une réponse)
// tout nombre de la réponse qui n'a pas de correspondance tolérante dans le contexte.

// Les nombres français dans le texte s'écrivent avec espace insécable comme séparateur de
// milliers et virgule comme séparateur décimal (ex. "150 000,42 €", "18,6 %").
const NUMBER_TOKEN_RE = /-?\d{1,3}(?:[\s ]\d{3})+(?:[.,]\d+)?|-?\d+(?:[.,]\d+)?/g;

function parseFrenchNumber(token: string): number {
  const normalized = token.replace(/[\s ]/g, '').replace(',', '.');
  return Number.parseFloat(normalized);
}

export function extractNumbers(text: string): number[] {
  const matches = text.match(NUMBER_TOKEN_RE) ?? [];
  return matches.map(parseFrenchNumber).filter((n) => Number.isFinite(n));
}

// Une année calendaire isolée (ex. "en 2026", "depuis le 01/01/2025") n'est pas un chiffre
// déterministe à vérifier — exclue pour éviter des faux positifs sur une simple référence
// temporelle que le LLM peut légitimement mentionner sans l'avoir reçue du contexte.
function isLikelyCalendarYear(n: number): boolean {
  return Number.isInteger(n) && n >= 1900 && n <= 2100;
}

function toleranceFor(n: number): number {
  return Math.max(0.5, Math.abs(n) * 0.005);
}

export function buildAllowedNumbers(contextText: string): number[] {
  return extractNumbers(contextText);
}

export interface GuardrailResult {
  alerte: boolean;
  chiffresSuspects: number[];
}

export function checkNumericGuardrail(responseText: string, allowed: number[]): GuardrailResult {
  const suspects: number[] = [];
  for (const n of extractNumbers(responseText)) {
    if (isLikelyCalendarYear(n)) continue;
    const tol = toleranceFor(n);
    const found = allowed.some((a) => Math.abs(a - n) <= tol);
    if (!found) suspects.push(n);
  }
  return { alerte: suspects.length > 0, chiffresSuspects: suspects };
}
