# TICKETS

Implementation backlog derived from [`PRD.md`](PRD.md). Each ticket is a batch of related work; check off sub-items as they land and update the ticket's status line. This file tracks **build status**, not design decisions — those are already resolved in `.scratch/wealth-advisor/issues/`.

## Done

- [x] Scaffold — monorepo layout, full DB schema (all domains), one-click start script (PRD §10, §11)
- [x] Liquidités vertical slice — dashboard, entity tabs, journal/Valorisation history, CRUD via API (PRD §3.1, §5.1, §5.2)
- [x] Bourse vertical slice — PEA/PEA-PME/CTO Enveloppe, titre Ligne (nom/ISIN, quantité, PRU for CTO only), auto-managed "compte espèces" Ligne per Enveloppe, real CRUD via API (PRD §3.2, §5.1, §5.2)

---

## Ticket 1 — Domain vertical slices

Status: **In progress** (Bourse done — see Done section above)

Repeat the Liquidités pattern (dashboard rail entry, ledger, journal, create panel, real CRUD via API) for the remaining four domains. Schema for all of them already exists (§11); this is API + UI only. Liquidités and Immobilier have no Enveloppe — the other three do, so those slices additionally need Enveloppe create/list handling.

- [ ] Immobilier — Ligne (prix d'acquisition total, date, résidence principale, régime location) + `valorisation_immobilier` fields (capital restant dû, loyer, charges…); derived rendement brut/net + cash-flow displayed on the Ligne (§3.3, §5.2 amendment, formulas in §7.3)
- [ ] Assurance-vie / PER — Enveloppe = contrat (AV/PER type), Ligne = support (fonds euro/UC) (§3.4)
- [ ] Crypto — Enveloppe = portefeuille par plateforme (plateforme étrangère, prix d'acquisition cumulé), Ligne = actif (symbole, quantité) (§3.5)
- [ ] Private equity / SCPI — Enveloppe = fonds (type dispositif, durée de blocage), Ligne = part souscrite (§3.6)

## Ticket 2 — Cross-cutting screens

Status: **Not started**

- [ ] Reporting — KPI cards (Patrimoine total/net), donut by domain, domain table (valeur/part/variation/sparkline), per-domain drilldown with individual Ligne deltas; consolidated + per-Entité views (§5.3, §5.1)
- [ ] Profil & Questionnaire de risque — single anchored-navigation form (identité/fiscalité, situation familiale, questionnaire), risk bucket result card (§5.4, §2.2)
- [ ] Objectifs — card grid, 3-step creation assistant, progress bar + estimated-date-reached (linear trend on Valorisation history), suggested-template cards, calculette FIRE (25× multiplier, gross-vs-net warning) (§5.5, §9)

## Ticket 3 — Advice engine (deterministic layer)

Status: **Not started**

- [ ] Fiscal rules/constants module codifying §8 — **must resolve the 11 flagged uncertain points first** (e.g. exact PS rate PEA/crypto post-LFSS 2026, PER-TNS ceiling, AV death allowance beyond the abattement)
- [ ] Moteur de conseil skeleton (deterministic-only, no LLM yet) + Liquidités rules A/B/C + réserve de précaution immobilier (§6, §7.1)
- [ ] Règles Bourse — concentration >25%, cash dormant in Enveloppe, PEA vs CTO fiscal angle (§7.2)
- [ ] Règles Immobilier — rentabilité anormale, prêt bientôt soldé, seuil IFI (§7.3)
- [ ] Règles Assurance-vie / PER — cap 8 ans, seuil 150k€, plafond PER (§7.4)
- [ ] Règles Crypto & PE/SCPI — exposition par profil de risque, exposition PE/SCPI plate, échéance de blocage (§7.5)

## Ticket 4 — LLM integration

Status: **Not started** — do this after at least one rule set from Ticket 3 exists to give the LLM something to narrate.

- [ ] Claude Code CLI subprocess wiring (print/non-interactive mode, no separate Anthropic API key) (§10)
- [ ] Structured output format from the CLI + backend parsing/validation
- [ ] Numeric guardrail: LLM only restates figures it received from the deterministic layer, never recomputes (§6)
- [ ] Risk-profile bucket override mechanism via chat under this CLI mode — flagged non-trivial, needs its own design pass (§6, §12.1)
- [ ] Confidence-indicator plumbing for the "à vérifier" fiscal points (§6, §8)

---

**Explicitly not tickets** (PRD §13 non-goals, §14 Fog): bank aggregation, multi-user, regulated advice, kids' accounts, real-time valuation feeds, annual fiscal-parameter maintenance, periodic reminders. Backlog notes only, not scoped work.
