// Sous-processus CLI Claude Code — intégration LLM (PRD §10, ticket 4).
//
// Authentification via l'abonnement Claude déjà actif dans l'environnement (pas de clé API
// Anthropic facturée séparément) : on invoque le binaire `claude` tel qu'il est configuré pour
// l'utilisateur du système, en mode print/non-interactif. Chaque appel est un process isolé et
// sans état (--no-session-persistence) — cohérent avec le conseil éphémère du PRD §6, aucune
// conversation n'est reprise d'un appel à l'autre côté CLI ; l'historique est renvoyé en clair
// dans le prompt à chaque requête (voir prompt.ts).
//
// Verrouillage volontaire de la session lancée :
// - --tools "" / --strict-mcp-config / --setting-sources "" : aucun outil, aucun MCP, aucune
//   config projet (CLAUDE.md, hooks...) chargée — le CLI ne fait que du texte, jamais d'action.
// - --permission-prompts none : tout ce qui demanderait une permission est refusé silencieusement
//   plutôt que de bloquer un process sans TTY.
// - --json-schema : validation de la forme de sortie côté CLI, en plus de la validation
//   applicative faite ici (parseChatResponse).

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const CLAUDE_BIN = process.env.WEALTHADVISOR_CLAUDE_BIN || 'claude';
const CLAUDE_MODEL = process.env.WEALTHADVISOR_CLAUDE_MODEL || 'sonnet';
const TIMEOUT_MS = 60_000;

interface ClaudeCliJsonResult {
  type: string;
  subtype: string;
  is_error: boolean;
  result?: string;
  structured_output?: unknown;
}

export class ClaudeCliError extends Error {}

export interface ClaudeCliCallOptions {
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: object;
}

export interface ClaudeCliCallResult {
  text: string;
  structured: unknown;
}

export async function callClaudeCli({ systemPrompt, userPrompt, jsonSchema }: ClaudeCliCallOptions): Promise<ClaudeCliCallResult> {
  const args = [
    '-p',
    userPrompt,
    '--output-format',
    'json',
    '--system-prompt',
    systemPrompt,
    '--tools',
    '',
    '--no-session-persistence',
    '--setting-sources',
    '',
    '--strict-mcp-config',
    '--permission-prompts',
    'none',
    '--model',
    CLAUDE_MODEL,
    '--json-schema',
    JSON.stringify(jsonSchema),
  ];

  let stdout: string;
  try {
    ({ stdout } = await execFileAsync(CLAUDE_BIN, args, { timeout: TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 }));
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException & { killed?: boolean; signal?: string };
    if (nodeErr.code === 'ENOENT') {
      throw new ClaudeCliError(
        `CLI Claude Code introuvable (commande « ${CLAUDE_BIN} »). Installez/authentifiez le CLI (voir PRD §10) ou définissez WEALTHADVISOR_CLAUDE_BIN.`
      );
    }
    if (nodeErr.killed || nodeErr.signal) {
      throw new ClaudeCliError('Le CLI Claude Code n’a pas répondu à temps.');
    }
    throw new ClaudeCliError(`Échec du CLI Claude Code : ${nodeErr.message}`);
  }

  let parsed: ClaudeCliJsonResult;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new ClaudeCliError('Réponse illisible du CLI Claude Code (JSON invalide).');
  }

  if (parsed.is_error || parsed.subtype !== 'success') {
    throw new ClaudeCliError(`Le CLI Claude Code a échoué (${parsed.subtype}) : ${parsed.result ?? 'raison inconnue'}`);
  }

  if (parsed.structured_output !== undefined) {
    return { text: parsed.result ?? '', structured: parsed.structured_output };
  }

  // Filet de sécurité si --json-schema n'a pas produit structured_output (ne devrait pas
  // arriver en usage normal) : on tente de parser `result` tel quel.
  try {
    return { text: parsed.result ?? '', structured: JSON.parse(parsed.result ?? '') };
  } catch {
    throw new ClaudeCliError('Le CLI Claude Code n’a pas produit de sortie structurée exploitable.');
  }
}
