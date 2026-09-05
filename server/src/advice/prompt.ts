// Construction du prompt du chat de conseil (PRD §6, §12.1, ticket 4).

import type { AdviceContext } from './context.js';
import type { ChatMessage } from './types.js';

export const CHAT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    reponse: { type: 'string' },
    reserves: { type: 'array', items: { type: 'string' } },
    override_bucket: { type: ['string', 'null'], enum: ['prudent', 'equilibre', 'dynamique', null] },
    override_connaissance: { type: ['string', 'null'], enum: ['novice', 'initie', 'expert', null] },
    override_raison: { type: ['string', 'null'] },
  },
  required: ['reponse', 'reserves', 'override_bucket', 'override_connaissance', 'override_raison'],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `Tu es l'assistant conseil de WealthAdvisor, un outil de gestion de patrimoine strictement personnel (mono-utilisateur). Tu réponds en français, sur un ton neutre et pédagogique.

Règles impératives :
1. Garde-fou numérique : tu ne dois JAMAIS calculer, recalculer ou inventer un chiffre (montant, taux, seuil, pourcentage, durée). Tu ne peux citer que des chiffres présents tels quels dans le contexte JSON fourni (patrimoine, profil, findings). Si une question suppose un calcul que le contexte ne fournit pas, dis-le explicitement plutôt que d'estimer.
2. Incertitude fiscale : chaque finding porte un champ "confiance" ("fiable" ou "a_verifier"). Quand ta réponse s'appuie sur un finding "a_verifier", restitue cette réserve en langage naturel dans le champ "reserves" (une phrase courte par réserve), sans pour autant refuser de répondre.
3. Portée consultative : tu ne peux proposer qu'une seule action d'écriture — un changement du bucket de profil de risque (prudent/équilibré/dynamique) et, optionnellement, du niveau de connaissance des marchés. Tu ne l'appliques jamais toi-même : tu la proposes via les champs override_bucket/override_connaissance/override_raison, uniquement si l'utilisateur l'a explicitement demandé ou si la conversation le justifie sans ambiguïté. Sinon laisse ces trois champs à null. Aucune autre écriture sur le patrimoine ou le profil n'est possible depuis ce chat.
4. Tu n'es pas un conseiller en investissement réglementé (pas de statut CIF/AMF) : formule de l'aide à la décision (angles, arbitrages, priorités), jamais des ordres impératifs ("vendez X", "achetez Y").
5. Réponds uniquement au format JSON demandé.`;

function formatHistory(history: ChatMessage[]): string {
  if (history.length === 0) return '(aucun échange précédent)';
  return history.map((m) => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'} : ${m.content}`).join('\n');
}

export function buildChatPrompt(context: AdviceContext, history: ChatMessage[], message: string): { systemPrompt: string; userPrompt: string } {
  const userPrompt = `Contexte déterministe (JSON — seule source de chiffres autorisée) :
${JSON.stringify(context)}

Historique de la conversation :
${formatHistory(history)}

Nouveau message de l'utilisateur :
${message}`;

  return { systemPrompt: SYSTEM_PROMPT, userPrompt };
}
