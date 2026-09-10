import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { DOMAIN_LABELS, RISQUE_BUCKET_LABELS, RISQUE_CONNAISSANCE_LABELS } from '../types';
import type { ChatMessage, Entity, Finding, OverrideProposal } from '../types';

interface Props {
  entities: Entity[];
  notify: (message: string, warn?: boolean) => void;
}

const DOMAINE_TRANSVERSE_LABEL = 'Transverse';

function domaineLabel(domaine: string): string {
  return DOMAIN_LABELS[domaine] ?? DOMAINE_TRANSVERSE_LABEL;
}

// Écran « Conseils » (ticket 4) : affichage proactif des Findings déterministes (PRD §6 —
// détecté à l'ouverture de l'app / après mise à jour) + chat de conseil hybride consultatif.
// Le chat comme la liste de Findings portent toujours sur le patrimoine total, toutes
// Entités confondues (plus de filtrage par Entité — refonte-saisie-patrimoine, ticket 01).
export function ConseilsScreen({ entities, notify }: Props) {
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; reserves?: string[]; alerte?: number[] }[]>([]);
  const [pendingOverride, setPendingOverride] = useState<OverrideProposal | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.conseils.findings('all').then(({ findings }) => setFindings(findings));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const message = input.trim();
    if (!message || sending) return;
    setInput('');
    setSending(true);
    const history: ChatMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    try {
      const res = await api.conseils.chat(message, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reponse, reserves: res.reserves, alerte: res.alerte_chiffres }]);
      setPendingOverride(res.override_propose);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Erreur : ${(err as Error).message}` }]);
    } finally {
      setSending(false);
    }
  };

  const applyOverride = async () => {
    if (!pendingOverride) return;
    try {
      await api.profil.applyRiskOverride({ bucket: pendingOverride.bucket, connaissance: pendingOverride.connaissance });
      notify(`Profil de risque ajusté : ${RISQUE_BUCKET_LABELS[pendingOverride.bucket]}`);
      setPendingOverride(null);
    } catch (err) {
      notify((err as Error).message, true);
    }
  };

  const anomalies = (findings ?? []).filter((f) => f.type === 'anomalie');
  const contexte = (findings ?? []).filter((f) => f.type === 'contexte');

  return (
    <div className="dash-shell conseils-shell">
      <div className="dash-main">
        <div className="dash-toolbar">
          <h2>Findings détectés</h2>
        </div>

        {findings === null ? (
          <div className="card empty-state">Chargement…</div>
        ) : findings.length === 0 ? (
          <div className="card empty-state">Aucune anomalie ni angle détecté pour ce périmètre.</div>
        ) : (
          <>
            {anomalies.length > 0 && (
              <div className="card finding-group">
                <h3>Anomalies</h3>
                {anomalies.map((f) => (
                  <FindingRow key={f.id} finding={f} entities={entities} />
                ))}
              </div>
            )}
            {contexte.length > 0 && (
              <div className="card finding-group">
                <h3>Contexte</h3>
                {contexte.map((f) => (
                  <FindingRow key={f.id} finding={f} entities={entities} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="dash-main conseils-chat-col">
        <div className="dash-toolbar">
          <h2>Chat de conseil</h2>
        </div>
        <div className="card conseils-chat">
          <div className="conseils-messages" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="muted-hint" style={{ padding: '18px 20px' }}>
                Posez une question sur votre patrimoine, votre fiscalité ou vos arbitrages — le conseil s'appuie sur les
                Findings ci-contre et votre Profil, jamais sur des chiffres recalculés.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`conseils-msg ${m.role}`}>
                <div className="conseils-msg-bubble">{m.content}</div>
                {!!m.reserves?.length && (
                  <div className="conseils-reserves">
                    {m.reserves.map((r, j) => (
                      <div key={j} className="conseils-reserve">
                        ⚠ {r}
                      </div>
                    ))}
                  </div>
                )}
                {!!m.alerte?.length && (
                  <div className="conseils-alerte">
                    Chiffre(s) non retrouvé(s) tel(s) quel(s) dans les données du moteur : {m.alerte.join(', ')} — à
                    vérifier avant toute décision.
                  </div>
                )}
              </div>
            ))}
            {sending && <div className="conseils-msg assistant conseils-typing">…</div>}
          </div>

          {pendingOverride && (
            <div className="conseils-override-card">
              <div>
                Le conseil propose de passer votre profil de risque à{' '}
                <strong>{RISQUE_BUCKET_LABELS[pendingOverride.bucket]}</strong>
                {pendingOverride.connaissance ? (
                  <>
                    {' '}
                    (connaissance : <strong>{RISQUE_CONNAISSANCE_LABELS[pendingOverride.connaissance]}</strong>)
                  </>
                ) : null}
                . {pendingOverride.raison}
              </div>
              <div className="btn-row" style={{ padding: '10px 0 0' }}>
                <button type="button" className="btn primary" onClick={applyOverride}>
                  Appliquer
                </button>
                <button type="button" className="btn ghost" onClick={() => setPendingOverride(null)}>
                  Ignorer
                </button>
              </div>
            </div>
          )}

          <div className="conseils-input-row">
            <input
              className="field-input"
              placeholder="Votre question…"
              value={input}
              disabled={sending}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button type="button" className="btn primary" disabled={sending || !input.trim()} onClick={send}>
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FindingRow({ finding, entities }: { finding: Finding; entities: Entity[] }) {
  const entityLibelle = finding.entity_id != null ? entities.find((e) => e.id === finding.entity_id)?.libelle : null;
  return (
    <div className="finding-row">
      <div className="finding-row-head">
        <span className={`chip finding-domaine`}>{domaineLabel(finding.domaine)}</span>
        {entityLibelle && <span className="chip">{entityLibelle}</span>}
        <span className={`chip finding-confiance ${finding.confiance}`}>
          {finding.confiance === 'fiable' ? 'Fiable' : 'À vérifier'}
        </span>
      </div>
      <div className="finding-titre">{finding.titre}</div>
      <div className="finding-detail muted">{finding.detail}</div>
    </div>
  );
}
