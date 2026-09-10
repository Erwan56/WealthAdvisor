# Rôle du Mouvement "versement" — Assurance-vie/PER

Type: grilling
Status: resolved

## Question

Contrairement à Bourse/Crypto/PE-SCPI/Liquidités, l'audit [Audit Mouvement/journal — Assurance-vie/PER, Crypto, Private equity/SCPI](11-audit-mouvement-autres-domaines.md) montre que le Mouvement de type "versement" saisi dans "Associer un mouvement" pour une Ligne Assurance-vie/PER (`EnveloppeLigneJournal.tsx`, `server/src/routes/avper.ts:346-352`) est réellement consommé par deux règles de conseil actives : le seuil des 150 000 € de versements AV et le suivi du plafond PER annuel (`server/src/advice/rules/avper.ts:54-56`, `:90-92`, agrégation `SUM(montant) WHERE type='versement'`). Par ailleurs `EditLigneAvPerModal.tsx` n'a pas de champ "valeur" direct — la valeur d'un support AV/PER ne se met à jour que via le journal, il n'y a pas d'équivalent au "fixer la quantité totale" envisagé pour Bourse/Crypto/PE-SCPI (ticket 09/12).

Trancher : la simplification du "Mouvement" décidée pour les autres Domaines (suppression, ou clarification de son utilité) ne peut pas s'appliquer telle quelle ici sans casser ces deux règles fiscales. Faut-il garder un mécanisme de saisie de versement obligatoire/mieux mis en avant (pas juste un `<details>` optionnel et discret) pour Assurance-vie/PER spécifiquement, quitte à diverger de l'UX simplifiée des autres Domaines ? Ou existe-t-il un autre moyen de dériver le cumul des versements (ex. delta de valeur entre deux entrées de journal, moins fiable si des rachats/plus-values se mélangent) ?

## Réponse

Fait vérifié en code avant tranchage : `rachat` et `arbitrage` (les deux autres types proposés dans `mouvementOptions` du journal AV/PER, `AvPerDashboard.tsx:18-22`) ne sont lus par aucune règle de conseil ni aucune route (`server/src/advice/rules/avper.ts`, `server/src/routes/avper.ts`) — même défaut décoratif que les Mouvements déjà supprimés ailleurs dans cette refonte. Seul `versement` est réellement consommé (`SUM(m.montant) WHERE type='versement'`).

Confirmé par l'utilisateur : dans l'usage réel, un versement déclenche systématiquement une nouvelle entrée de journal (date+valeur) au moment où il est fait — la dérivation par delta de valeur (écartée d'emblée pour raisons techniques : impossible de séparer contribution et plus-value/rachat, et le plafond PER a besoin d'une granularité annuelle que des snapshots de valeur n'apportent pas de façon fiable) n'était de toute façon pas nécessaire : le mécanisme actuel de Mouvement associé à l'entrée de valorisation correspond déjà au geste réel de l'utilisateur, il n'a besoin que d'être rendu visible et non-esquivable.

Décisions :

1. **AV/PER reste le seul Domaine à garder un mécanisme de Mouvement en saisie** — Bourse/Crypto/PE-SCPI/Liquidités l'ont purement supprimé (tickets [Formulaire Liquidités](04-formulaire-liquidites.md), [Mise à jour d'une Ligne Bourse existante](09-maj-ligne-bourse.md), [Mise à jour d'une Ligne Crypto/PE-SCPI](12-maj-ligne-crypto-pescpi.md)) ; ici les deux règles de conseil actives (seuil 150k€ AV, plafond PER annuel) l'en empêchent. Identique entre Assurance-vie et PER, aucune divergence entre les deux sous-types.
2. **`rachat` et `arbitrage` retirés** de `mouvementOptions` — seul `versement` subsiste, donc le sélecteur de "type" lui-même disparaît (il ne reste qu'une seule valeur possible).
3. **Le bloc versement sort du `<details>` replié** : toujours visible sur le formulaire "Nouvelle entrée" du journal AV/PER (`EnveloppeLigneJournal.tsx`), plus de disclosure optionnelle à dérouler.
4. **Choix explicite requis** : "Versement associé à cette entrée ?" (Oui/Non), **pré-sélectionné sur Oui** (cohérent avec l'usage réel confirmé : la majorité des entrées correspondent à un versement). Sur Non, aucun montant n'est demandé. Sur Oui (défaut), le champ montant devient **obligatoire et doit être > 0** — impossible de laisser passer un versement silencieusement vide comme aujourd'hui.
5. **`EditLigneAvPerModal.tsx` n'est pas concerné** — il n'a jamais eu de champ "valeur" direct et le reste hors de cette décision ; la valeur continue de ne se mettre à jour que via le journal.

Conséquence sur le glossaire `../../wealth-advisor/CONTEXT.md` : préciser qu'Assurance-vie/PER est le seul Domaine où le Mouvement de saisie subsiste (sous la forme Oui/Non + montant décrite ci-dessus), et que `rachat`/`arbitrage` n'existent plus comme types de Mouvement saisissables.
