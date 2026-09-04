# Choix de la stack technique

Type: grilling
Status: resolved
Blocked by: 04
Claimed-by: session_01QHgdqVt4UM28nW12uKohYu

## Question

Quelle stack technique retenir pour implémenter la spec issue des tickets précédents : langage, framework backend/frontend, base de données locale (ex. SQLite), intégration à l'API Claude/LLM, packaging et exécution en local (usage strictement personnel, pas d'hébergement cloud) ?

La décision se prend une fois les besoins fonctionnels et architecturaux (modèle de données, moteur de conseil hybride) figés, pour que le choix de stack serve ces besoins plutôt que l'inverse.

## Answer

**Accès & exécution** : application web locale, servie sur `localhost` uniquement — pas d'accès réseau/LAN, pas d'application desktop empaquetée (Electron/Tauri). Choix le plus simple à construire et à faire tourner, cohérent avec "formulaires + chat" comme UI web naturelle ; n'exclut pas de basculer vers un accès LAN plus tard sans réécriture majeure.

**Base de données locale** : SQLite, en clair (pas de chiffrement au repos type SQLCipher). Le modèle est relationnel par nature (Enveloppe → Ligne → Mouvements/Valorisations datées) et les vues de reporting demandent des agrégations temporelles que SQL exprime naturellement. Le chiffrement est jugé disproportionné pour un usage strictement personnel sur une machine déjà protégée par login OS, sans synchronisation cloud — à revisiter si ce contexte change (machine partagée, sauvegarde cloud du fichier).

**Langage & frameworks** : TypeScript full-stack — backend Node (Express/Fastify) + frontend React (Vite). Un seul langage partagé entre backend, frontend et scripts ; le SDK Anthropic TypeScript est de première classe ; bonnes bibliothèques SQLite en TS (`better-sqlite3`) ; React convient mieux qu'un rendu serveur pour une interface chat réactive.

**Intégration API Claude** : ~~SDK Anthropic TypeScript, appels directs à l'API Messages~~ — **abandonné** (voir amendement ci-dessous).

**Packaging & lancement** : script un clic (ex. fichier `.command`/raccourci) qui démarre le serveur local et ouvre le navigateur automatiquement — pas de commande manuelle à retaper à chaque usage, pas de service permanent au démarrage de la machine.

Décidé par grilling avec l'utilisateur.

## Amendement — intégration Claude via l'abonnement local (pas d'API facturée séparément)

L'utilisateur dispose déjà d'un abonnement Claude et ne veut pas payer une seconde fois via une clé API Anthropic facturée au token. **Intégration retenue : sous-processus CLI Claude Code**, invoqué par le backend en mode non-interactif (print mode) pour chaque demande de conseil, authentifié via la session/abonnement déjà actif sur la machine — pas de clé API séparée, pas de facturation par token.

Conséquence à vérifier à l'implémentation : la seule action d'écriture depuis le chat (override du bucket de Profil de risque, cf. [Conception du moteur de conseil hybride](04-moteur-conseil-hybride.md)) devra être adaptée à ce mode d'invocation plutôt qu'au tool-use structuré de l'API Messages classique — mécanisme exact (format de sortie structuré du CLI, parsing du backend) non détaillé à ce stade, à affiner en implémentation.

Décidé par grilling avec l'utilisateur.
