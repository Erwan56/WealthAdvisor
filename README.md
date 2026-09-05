# WealthAdvisor

Application web strictement personnelle de gestion de patrimoine. Voir [`PRD.md`](PRD.md) pour la spécification complète.

L'ensemble des tickets du backlog ([`TICKETS.md`](TICKETS.md)) sont livrés : les six domaines patrimoniaux, le Reporting, le Profil & Questionnaire de risque, les Objectifs, et le moteur de conseil hybride (règles déterministes + chat LLM) — tout est câblé de bout en bout sur une vraie base SQLite via une API Express, rien n'est mocké.

## Prérequis

- Node.js ≥ 18 (testé avec Node 22)
- npm ≥ 10
- Le [CLI Claude Code](https://claude.com/claude-code) installé et authentifié (`claude` dans le `PATH`), pour le chat de conseil (écran **Conseils**) — voir [Intégration LLM](#intégration-llm) ci-dessous. Le reste de l'application fonctionne sans lui.

## Installation

```bash
npm install
```

Installe les dépendances des trois workspaces (`server/`, `web/`, racine) en une seule commande.

## Démarrage en un clic

```bash
./start.sh
```

(ou `npm start`, équivalent). Ce script :

1. installe les dépendances si `node_modules/` n'existe pas encore ;
2. build l'interface web (`web/dist`) ;
3. démarre le serveur Express sur `http://localhost:4000` (API **et** fichiers statiques du build web sur le même port) ;
4. ouvre automatiquement le navigateur une fois le serveur prêt.

À l'arrêt (`Ctrl+C`), le serveur est arrêté proprement.

## Démarrage en développement (hot reload)

Deux process en parallèle, dans deux terminaux :

```bash
npm run dev:server   # API Express (tsx watch) sur http://localhost:4000
npm run dev:web      # Vite dev server sur http://localhost:5173 (proxy /api -> :4000)
```

Ouvrir `http://localhost:5173` pendant le développement — les changements dans `web/src` et `server/src` sont pris en compte à chaud.

## Base de données

SQLite en clair, fichier `server/data/wealth-advisor.db` (créé automatiquement au premier démarrage, ignoré par git). Le schéma complet (tous les domaines du PRD §11) est appliqué de façon idempotente à chaque démarrage depuis `server/src/db/schema.sql` ; l'Entité `Perso` et la ligne `profil` par défaut sont seedées si absentes.

Pour repartir d'une base vierge :

```bash
rm -f server/data/wealth-advisor.db*
```

## Intégration LLM

Le chat de conseil (écran **Conseils**) invoque le CLI Claude Code en sous-processus, en mode print/non-interactif (`claude -p ... --output-format json`), authentifié via l'abonnement Claude déjà actif de l'utilisateur — **pas** de clé API Anthropic séparée à configurer. Chaque appel est isolé et sans état (aucun outil, aucun serveur MCP, aucune configuration projet chargée, aucune permission accordée) : le sous-processus ne peut que produire du texte structuré, jamais agir sur le système.

Si le CLI `claude` n'est pas installé ou pas authentifié, tout le reste de l'application (dashboards, reporting, profil, objectifs, et même la liste des Findings déterministes sur l'écran Conseils) continue de fonctionner normalement ; seul l'envoi d'un message dans le chat renverra une erreur explicite.

Variables d'environnement optionnelles :

| Variable | Effet |
|---|---|
| `WEALTHADVISOR_CLAUDE_BIN` | Chemin/nom du binaire CLI à invoquer (défaut : `claude`) |
| `WEALTHADVISOR_CLAUDE_MODEL` | Alias ou nom de modèle passé à `--model` (défaut : `sonnet`) |

## Structure du projet

```
server/                          API Express + SQLite (better-sqlite3)
  src/db/schema.sql               schéma relationnel complet (PRD §11)
  src/db/client.ts                connexion SQLite + migration/seed au démarrage
  src/db/scope.ts, timeseries.ts  helpers partagés (Lignes par Entité/Domaine, séries de valeur consolidées)
  src/routes/entities.ts          CRUD Entités
  src/routes/liquidites.ts        CRUD Lignes de Liquidités + historique de Valorisations
  src/routes/bourse.ts            CRUD Enveloppes/Lignes Bourse (PEA/PEA-PME/CTO) + compte espèces
  src/routes/immobilier.ts        CRUD Lignes Immobilier + Valorisations enrichies (rendement/cash-flow)
  src/routes/avper.ts             CRUD Enveloppes/Lignes Assurance-vie/PER
  src/routes/crypto.ts            CRUD Enveloppes/Lignes Crypto
  src/routes/peScpi.ts            CRUD Enveloppes/Lignes Private equity/SCPI
  src/routes/reporting.ts         synthèse chiffrée (KPI, donut, tableau, drilldown par Domaine)
  src/routes/profil.ts            Profil, Questionnaire de risque, override manuel du bucket
  src/routes/objectifs.ts         CRUD Objectifs + calcul d'avancée/date estimée
  src/routes/conseils.ts          Findings déterministes + chat de conseil hybride
  src/advice/                     moteur de conseil hybride (ticket 3 déterministe + ticket 4 LLM)
    fiscal-constants.ts            référentiel fiscal/légal français (PRD §8), chaque valeur taguée fiable/à vérifier
    rule-constants.ts              seuils du socle de règles par domaine (PRD §7)
    engine.ts                      recalcule tous les Findings depuis l'état courant (pas de persistance)
    rules/                         un fichier de règles par domaine
    context.ts                     assemble patrimoine + profil + Findings pour le LLM
    claude-cli.ts                  sous-processus CLI Claude Code (print mode, JSON structuré)
    guardrail.ts                   garde-fou numérique (le LLM ne peut citer que des chiffres reçus)
    prompt.ts                      prompt système + schéma JSON de sortie du chat
  src/index.ts                     entrée Express (API + sert web/dist en prod)

web/                              Interface React (Vite)
  src/App.tsx                      écran principal (onglets d'Entité + rail de Domaines + navigation)
  src/api.ts                       client HTTP vers l'API
  src/components/                  un Dashboard par domaine, Reporting, Profil, Objectifs, Conseils, panneaux de création

scripts/start.mjs                 logique du démarrage en un clic (build + serveur + ouverture navigateur)
start.sh                          point d'entrée shell pour scripts/start.mjs
```

## API (résumé)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/entities` | Liste des Entités |
| POST | `/api/entities` | Créer une Entité (`activite_service` \| `detention_immobiliere`) |
| GET | `/api/liquidites/lines?entity_id=<id>\|all` | Lignes de Liquidités (fusionnées toutes Entités si `all`) |
| POST / PUT / DELETE | `/api/liquidites/lines[/:id]` | Créer / modifier / supprimer une Ligne (+ première Valorisation à la création) |
| GET / POST | `/api/liquidites/lines/:id/valorisations` | Historique de Valorisations / ajouter une entrée (+ Mouvement optionnel) |
| PUT / DELETE | `/api/liquidites/valorisations/:id` | Corriger / supprimer une entrée d'historique |
| GET | `/api/bourse/envelopes?entity_id=<id>\|all` | Enveloppes Bourse (PEA/PEA-PME/CTO) avec Lignes imbriquées |
| POST / PUT / DELETE | `/api/bourse/envelopes[/:id]` | Créer (+ premier titre + compte espèces auto) / modifier / supprimer une Enveloppe |
| POST / PUT / DELETE | `/api/bourse/lines[/:id]` | Ajouter un titre à une Enveloppe / modifier / supprimer |
| GET / POST | `/api/bourse/lines/:id/valorisations` | Historique / ajouter une entrée (+ Mouvement achat/vente ou versement/retrait) |
| PUT / DELETE | `/api/bourse/valorisations/:id` | Corriger / supprimer une entrée d'historique |
| GET / POST / PUT / DELETE | `/api/immobilier/lines[/:id]` | CRUD Lignes Immobilier |
| GET / POST | `/api/immobilier/lines/:id/valorisations` | Historique (capital restant dû, loyer, charges…) / ajouter une entrée |
| PUT / DELETE | `/api/immobilier/valorisations/:id` | Corriger / supprimer une entrée d'historique |
| GET / POST / PUT / DELETE | `/api/av-per/envelopes[/:id]` | CRUD Enveloppes Assurance-vie/PER (+ premier support à la création) |
| POST / PUT / DELETE | `/api/av-per/lines[/:id]` | Ajouter / modifier / supprimer un support |
| GET / POST | `/api/av-per/lines/:id/valorisations` | Historique / ajouter une entrée |
| PUT / DELETE | `/api/av-per/valorisations/:id` | Corriger / supprimer une entrée d'historique |
| GET / POST / PUT / DELETE | `/api/crypto/envelopes[/:id]` | CRUD portefeuilles Crypto (+ premier actif à la création) |
| POST / PUT / DELETE | `/api/crypto/lines[/:id]` | Ajouter / modifier / supprimer un actif |
| GET / POST | `/api/crypto/lines/:id/valorisations` | Historique / ajouter une entrée |
| PUT / DELETE | `/api/crypto/valorisations/:id` | Corriger / supprimer une entrée d'historique |
| GET / POST / PUT / DELETE | `/api/pe-scpi/envelopes[/:id]` | CRUD fonds Private equity/SCPI (+ première part souscrite à la création) |
| POST / PUT / DELETE | `/api/pe-scpi/lines[/:id]` | Ajouter / modifier / supprimer une part souscrite |
| GET / POST | `/api/pe-scpi/lines/:id/valorisations` | Historique / ajouter une entrée |
| PUT / DELETE | `/api/pe-scpi/valorisations/:id` | Corriger / supprimer une entrée d'historique |
| GET | `/api/reporting/summary?entity_id=<id>\|all` | KPI (Patrimoine total/net), répartition par Domaine, sparklines |
| GET | `/api/reporting/domain/:domaine?entity_id=<id>\|all` | Détail d'un Domaine : courbe, indicateur clé, Enveloppes/Lignes avec delta |
| GET / PUT | `/api/profil` | Lire / mettre à jour le Profil (hors bucket de risque) |
| POST | `/api/profil/risque-override` | Appliquer un changement de bucket de risque (confirmation d'une proposition du chat) |
| GET | `/api/profil/questionnaire/questions` | Les 4 questions du Questionnaire de risque |
| GET | `/api/profil/questionnaire/reponses` | Dernières réponses enregistrées |
| POST | `/api/profil/questionnaire` | Soumettre les réponses → recalcule bucket + connaissance |
| GET / POST / PUT / DELETE | `/api/objectifs[/:id]` | CRUD Objectifs (avancée et date estimée calculées à la lecture) |
| POST | `/api/objectifs/bulk` | Créer plusieurs Objectifs depuis les modèles suggérés |
| GET | `/api/conseils?entity_id=<id>\|all` | Findings déterministes courants (anomalies + contexte, recalculés à chaque appel) |
| POST | `/api/conseils/chat` | Chat de conseil hybride — `{ message, history }` → réponse LLM + réserves de confiance + proposition d'override + alerte du garde-fou numérique |
