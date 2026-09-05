import { Router } from 'express';
import { buildAdviceContext } from '../advice/context.js';
import { callClaudeCli, ClaudeCliError } from '../advice/claude-cli.js';
import { runAdviceEngine } from '../advice/engine.js';
import { buildAllowedNumbers, checkNumericGuardrail } from '../advice/guardrail.js';
import { buildChatPrompt, CHAT_RESPONSE_SCHEMA } from '../advice/prompt.js';
import type { ChatMessage, ChatResponse } from '../advice/types.js';

export const conseilsRouter = Router();

// GET /api/conseils?entity_id=<id>|all — Findings déterministes courants (PRD §6-§7, ticket 3).
// Les Findings transverses (entity_id: null — IFI, seuil AV 150k, plafond PER, expositions
// crypto/PE calculées sur le Patrimoine net total) sont toujours inclus : ils ne sont pas
// rattachables à une seule Entité par construction.
conseilsRouter.get('/', (req, res) => {
  const entityIdRaw = req.query.entity_id as string | undefined;
  const findings = runAdviceEngine();

  if (!entityIdRaw || entityIdRaw === 'all') {
    return res.json({ findings });
  }

  const entityId = Number(entityIdRaw);
  res.json({ findings: findings.filter((f) => f.entity_id === null || f.entity_id === entityId) });
});

interface StructuredChatOutput {
  reponse: string;
  reserves: string[];
  override_bucket: 'prudent' | 'equilibre' | 'dynamique' | null;
  override_connaissance: 'novice' | 'initie' | 'expert' | null;
  override_raison: string | null;
}

function isStructuredChatOutput(value: unknown): value is StructuredChatOutput {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.reponse === 'string' && Array.isArray(v.reserves);
}

// POST /api/conseils/chat — chat de conseil hybride (PRD §6, §12.1, ticket 4). Contexte
// transversal (patrimoine total, pas de scoping par Entité — décidé en grilling, issue 04) ;
// stateless côté serveur (--no-session-persistence sur le CLI) : le client renvoie l'historique
// à chaque appel, cohérent avec le conseil éphémère du PRD §6 (rien n'est persisté ici).
conseilsRouter.post('/chat', async (req, res) => {
  const { message, history } = (req.body ?? {}) as { message?: unknown; history?: unknown };
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message requis' });
  }
  const cleanHistory: ChatMessage[] = Array.isArray(history)
    ? history.filter(
        (m): m is ChatMessage =>
          !!m && typeof m === 'object' && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
      )
    : [];

  const context = buildAdviceContext();
  const { systemPrompt, userPrompt } = buildChatPrompt(context, cleanHistory, message);

  let structured: unknown;
  try {
    ({ structured } = await callClaudeCli({ systemPrompt, userPrompt, jsonSchema: CHAT_RESPONSE_SCHEMA }));
  } catch (err) {
    const messageErr = err instanceof ClaudeCliError ? err.message : 'Échec du conseil (erreur interne).';
    return res.status(502).json({ error: messageErr });
  }

  if (!isStructuredChatOutput(structured)) {
    return res.status(502).json({ error: 'Réponse du conseil illisible (format inattendu).' });
  }

  // Le CLI produit parfois une sortie structurée sur-échappée (« \\n » littéral au lieu d'un
  // vrai saut de ligne) dans le champ texte — correction purement cosmétique, sans incidence
  // sur le contenu ni sur le garde-fou numérique.
  const unescapeNewlines = (s: string) => s.replace(/\\n/g, '\n');
  const reponse = unescapeNewlines(structured.reponse);
  const reserves = structured.reserves.map(unescapeNewlines);

  const allowed = buildAllowedNumbers(JSON.stringify(context));
  const { alerte, chiffresSuspects } = checkNumericGuardrail(reponse, allowed);

  const response: ChatResponse = {
    reponse,
    reserves,
    override_propose: structured.override_bucket
      ? { bucket: structured.override_bucket, connaissance: structured.override_connaissance, raison: structured.override_raison ?? '' }
      : null,
    alerte_chiffres: alerte ? chiffresSuspects : [],
  };
  res.json(response);
});
