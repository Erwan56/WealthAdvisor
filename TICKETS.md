# TICKETS

Implementation backlog derived from [`PRD.md`](PRD.md). Each ticket is a batch of related work; check off sub-items as they land and update the ticket's status line. This file tracks **build status**, not design decisions — those are already resolved in `.scratch/wealth-advisor/issues/`.

## Done

- [x] Scaffold — monorepo layout, full DB schema (all domains), one-click start script (PRD §10, §11)
- [x] Liquidités vertical slice — dashboard, entity tabs, journal/Valorisation history, CRUD via API (PRD §3.1, §5.1, §5.2)
- [x] Bourse vertical slice — PEA/PEA-PME/CTO Enveloppe, titre Ligne (nom/ISIN, quantité, PRU for CTO only), auto-managed "compte espèces" Ligne per Enveloppe, real CRUD via API (PRD §3.2, §5.1, §5.2)
- [x] Immobilier vertical slice — Ligne (prix d'acquisition total, date, résidence principale, régime location) + `valorisation_immobilier` fields per Valorisation entry; rendement brut/net + cash-flow derived and displayed on the Ligne (PRD §3.3, §5.2 amendment, formulas from issue 21)
- [x] Assurance-vie / PER vertical slice — Enveloppe = contrat (assurance_vie/per), Ligne = support (fonds_euro/uc), real CRUD via API (PRD §3.4)
- [x] Crypto vertical slice — Enveloppe = portefeuille par plateforme (plateforme étrangère, prix d'acquisition cumulé), Ligne = actif (symbole, quantité), real CRUD via API (PRD §3.5)
- [x] Private equity / SCPI vertical slice — Enveloppe = fonds (type dispositif, durée de blocage), Ligne = part souscrite (nombre de parts), real CRUD via API (PRD §3.6)
- [x] Reporting — KPI cards (Patrimoine total/net), donut by domain, domain table (valeur/part/variation/sparkline), per-domain drilldown with individual Ligne/Enveloppe deltas; consolidated + per-Entité views (PRD §5.3, §5.1)
- [x] Profil & Questionnaire de risque — single anchored-navigation form (identité/fiscalité, situation familiale, questionnaire), 4-question scored questionnaire → bucket + connaissance, result card with "Ajuster en chat" placeholder (PRD §5.4, §2.2, ticket 02)
- [x] Objectifs — card grid, 3-step creation assistant, progress bar + estimated-date-reached (linear trend on Valorisation history, ticket 26), quick-edit lien patrimoine (total/domaines/entité), suggested-template cards, calculette FIRE (25× multiplier, gross-vs-net warning) (PRD §5.5, §9, tickets 09/10/12)
- [x] Advice engine (deterministic layer) — fiscal constants module codifying §8 (11 uncertain points resolved with a `fiable`/`a_verifier` confidence flag each), moteur de conseil skeleton, and all 5 domain rule sets (Liquidités A/B/C + réserve de précaution immobilier, Bourse, Immobilier, Assurance-vie/PER, Crypto & PE/SCPI) exposed via `GET /api/conseils` (PRD §6-§7-§8, ticket 3)

---

## Ticket 1 — Domain vertical slices

Status: **Done** — see Done section above for all six domains (Liquidités, Bourse, Immobilier, Assurance-vie/PER, Crypto, Private equity/SCPI).

## Ticket 2 — Cross-cutting screens

Status: **Done** — see Done section above (Reporting, Profil & Questionnaire de risque, Objectifs). The 4-question risk-scoring rubric (point values, bucket thresholds) was designed during implementation — PRD/tickets specified the methodology but not exact numbers.

## Ticket 3 — Advice engine (deterministic layer)

Status: **Done** — see Done section above.

- [x] Fiscal rules/constants module codifying §8 — 11 flagged uncertain points resolved: each adopts a best-available value tagged `a_verifier` (e.g. PS rate PEA/crypto post-LFSS 2026 taken at 18.6%) so the layer never blocks on uncertainty (`server/src/advice/fiscal-constants.ts`). PER-TNS ceiling and AV death allowance are recorded as reference constants but not consumed by any socle rule (see next bullets).
- [x] Moteur de conseil skeleton (deterministic-only, no LLM yet) + Liquidités rules A/B/C + réserve de précaution immobilier (§6, §7.1) — `server/src/advice/engine.ts`, `rules/liquidites.ts`
- [x] Règles Bourse — concentration >25%, cash dormant in Enveloppe, PEA vs CTO fiscal angle (§7.2) — `rules/bourse.ts`
- [x] Règles Immobilier — rentabilité anormale, prêt bientôt soldé, seuil IFI (§7.3) — `rules/immobilier.ts`
- [x] Règles Assurance-vie / PER — cap 8 ans, seuil 150k€, plafond PER (§7.4) — `rules/avper.ts`
- [x] Règles Crypto & PE/SCPI — exposition par profil de risque, exposition PE/SCPI plate, échéance de blocage (§7.5) — `rules/cryptoPe.ts`

Exposed via `GET /api/conseils?entity_id=<id>|all`, recomputed from current state on every call (no persistence, no background job — PRD §6). Each Finding carries its own `chiffres` (numeric guardrail: the future LLM layer only restates these, never recomputes) and a `confiance` flag. No UI surface yet — proactive display and the LLM narration layer are Ticket 4.

## Ticket 4 — LLM integration

Status: **Not started** — do this after at least one rule set from Ticket 3 exists to give the LLM something to narrate.

- [ ] Claude Code CLI subprocess wiring (print/non-interactive mode, no separate Anthropic API key) (§10)
- [ ] Structured output format from the CLI + backend parsing/validation
- [ ] Numeric guardrail: LLM only restates figures it received from the deterministic layer, never recomputes (§6)
- [ ] Risk-profile bucket override mechanism via chat under this CLI mode — flagged non-trivial, needs its own design pass (§6, §12.1)
- [ ] Confidence-indicator plumbing for the "à vérifier" fiscal points (§6, §8)

---

**Explicitly not tickets** (PRD §13 non-goals, §14 Fog): bank aggregation, multi-user, regulated advice, kids' accounts, real-time valuation feeds, annual fiscal-parameter maintenance, periodic reminders. Backlog notes only, not scoped work.
