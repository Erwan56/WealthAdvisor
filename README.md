# WealthAdvisor

Application web strictement personnelle de gestion de patrimoine. Voir [`PRD.md`](PRD.md) pour la spécification complète.

L'ensemble du modèle de données est en place. Deux tranches verticales sont câblées de bout en bout, servies par une vraie base SQLite via une API Express — rien n'est mocké :
- **Liquidités** (dashboard multi-Entités + historisation des Valorisations) ;
- **Bourse** (PEA/PEA-PME/CTO, titres avec PRU réservé au CTO, Ligne « compte espèces » auto-gérée par Enveloppe).

## Prérequis

- Node.js ≥ 18 (testé avec Node 22)
- npm ≥ 10

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

SQLite en clair, fichier `server/data/wealth-advisor.db` (créé automatiquement au premier démarrage, ignoré par git). Le schéma complet (tous les domaines du PRD §11, y compris ceux pas encore câblés à l'UI) est appliqué de façon idempotente à chaque démarrage depuis `server/src/db/schema.sql` ; l'Entité `Perso` et la ligne `profil` par défaut sont seedées si absentes.

Pour repartir d'une base vierge :

```bash
rm -f server/data/wealth-advisor.db*
```

## Structure du projet

```
server/                  API Express + SQLite (better-sqlite3)
  src/db/schema.sql       schéma relationnel complet (PRD §11)
  src/db/client.ts        connexion SQLite + migration/seed au démarrage
  src/routes/entities.ts  CRUD Entités
  src/routes/liquidites.ts CRUD Lignes de Liquidités + historique de Valorisations
  src/index.ts            entrée Express (API + sert web/dist en prod)

web/                      Interface React (Vite)
  src/App.tsx              écran principal (onglets d'Entité + rail de Domaines)
  src/components/          EntityTabs, DomainRail, {Liquidites,Bourse}Dashboard, journaux de Valorisations, panneaux de création
  src/api.ts               client HTTP vers l'API

scripts/start.mjs          logique du démarrage en un clic (build + serveur + ouverture navigateur)
start.sh                   point d'entrée shell pour scripts/start.mjs
```

## Périmètre de cette passe

Les domaines **Liquidités** et **Bourse** sont câblés à l'UI (dashboard, création d'Enveloppe/Ligne, historique de Valorisations avec correction/suppression, association d'un Mouvement). Pour Bourse : création d'une Enveloppe (PEA/PEA-PME/CTO) avec son premier titre, ajout de titres supplémentaires dans une Enveloppe existante, Ligne « compte espèces » créée et maintenue automatiquement par Enveloppe (non supprimable seule), PRU affiché/saisi uniquement pour les Enveloppes CTO. Les onglets d'Entité et la navigation multi-Entités sont fonctionnels. Les quatre autres domaines (Immobilier, Assurance-vie/PER, Crypto, Private equity/SCPI), le Reporting, le Profil, les Objectifs, le moteur de conseil et le chat sont hors périmètre — leurs tables existent déjà en base mais aucun écran ne les expose encore.

## API (résumé)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/entities` | Liste des Entités |
| POST | `/api/entities` | Créer une Entité (`activite_service` \| `detention_immobiliere`) |
| GET | `/api/liquidites/lines?entity_id=<id>\|all` | Lignes de Liquidités (fusionnées toutes Entités si `all`) |
| POST | `/api/liquidites/lines` | Créer une Ligne (+ première Valorisation) |
| PUT / DELETE | `/api/liquidites/lines/:id` | Modifier / supprimer une Ligne |
| GET | `/api/liquidites/lines/:id/valorisations` | Historique des Valorisations d'une Ligne |
| POST | `/api/liquidites/lines/:id/valorisations` | Ajouter une entrée au journal (+ Mouvement optionnel) |
| PUT / DELETE | `/api/liquidites/valorisations/:id` | Corriger / supprimer une entrée d'historique |
| GET | `/api/bourse/envelopes?entity_id=<id>\|all` | Enveloppes Bourse (avec leurs Lignes imbriquées, fusionnées toutes Entités si `all`) |
| POST | `/api/bourse/envelopes` | Créer une Enveloppe (PEA/PEA-PME/CTO) + son premier titre + sa Ligne « compte espèces » |
| PUT / DELETE | `/api/bourse/envelopes/:id` | Modifier / supprimer une Enveloppe (cascade sur ses Lignes) |
| POST | `/api/bourse/envelopes/:id/lines` | Ajouter un titre à une Enveloppe existante |
| PUT / DELETE | `/api/bourse/lines/:id` | Modifier / supprimer un titre (le compte espèces ne se supprime pas seul) |
| GET | `/api/bourse/lines/:id/valorisations` | Historique des Valorisations d'une Ligne Bourse |
| POST | `/api/bourse/lines/:id/valorisations` | Ajouter une entrée au journal (+ Mouvement optionnel : achat/vente ou versement/retrait) |
| PUT / DELETE | `/api/bourse/valorisations/:id` | Corriger / supprimer une entrée d'historique |
