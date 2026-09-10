# Audit Mouvement/journal — Assurance-vie/PER, Crypto, Private equity/SCPI

Type: research
Status: resolved

## Question

Les tickets [Création d'Enveloppe sans élément obligatoire](07-creation-enveloppe-sans-premier-element.md) et [Mise à jour d'une Ligne Bourse existante — rôle du Mouvement](09-maj-ligne-bourse.md) sont documentés côté Bourse, mais le périmètre de cet effort a été élargi à tous les Domaines lors du cadrage.

Auditer, pour Assurance-vie/PER, Crypto et Private equity/SCPI : le mécanisme "nouvelle entrée"/"associer un mouvement" existe-t-il sous la même forme que Bourse (fichiers `Edit*Modal.tsx` et `*LigneJournal.tsx` correspondants) ? A-t-il, comme pour Bourse, un effet réel sur la quantité/valeur détenue, ou est-il pareillement déconnecté ? Le résultat doit permettre de graduer le point de fog "Cohérence des formulaires de création/mise à jour d'actif" (carte) en tickets concrets par Domaine si nécessaire.

## Réponse

Les trois domaines partagent le même composant journal `web/src/components/EnveloppeLigneJournal.tsx` (distinct de `BourseLigneJournal.tsx`) : bloc "Nouvelle entrée" (date + valeur) avec un `<details>` optionnel "Associer un mouvement" (`EnveloppeLigneJournal.tsx:130-178`), dont la forme varie par `mouvementKind` : `'montant'` pour AV/PER (versement/rachat), `'quantite_prix'` pour Crypto et PE/SCPI (achat/vente, quantité + prix unitaire).

- **Crypto** — même défaut que Bourse : `server/src/routes/crypto.ts:340-354` insère le mouvement (quantité/prix unitaire) dans `mouvements` sans toucher `line_crypto.quantite` ; la quantité réelle ne change que via le champ direct `quantite` de `EditLigneCryptoModal` (`crypto.ts:296-297`). `advice/rules/cryptoPe.ts` : 0 référence à "mouvement".
- **Private equity/SCPI** — même défaut : `server/src/routes/peScpi.ts:343-347` insère le mouvement sans toucher `line_pe_scpi.nombre_parts` ; le nombre de parts réel ne change que via le champ direct de `EditLigneScpiModal` (`peScpi.ts:286-288`). Aucune règle de conseil n'y fait référence non plus.
- **Assurance-vie/PER — cas différent, pas transférable tel quel** : `server/src/routes/avper.ts:346-352` insère le mouvement (`type`, `montant`) dans `mouvements`, mais **ce mouvement est réellement consommé** par deux règles de conseil actives (`advice/rules/avper.ts:54-56` et `:90-92`) : le seuil des 150 000 € de versements AV (taux réduit/plein après 8 ans) et le suivi du plafond PER annuel, toutes deux agrégeant `SUM(montant) WHERE type='versement'`. Sans ces mouvements de type "versement", ces deux règles cessent de fonctionner. Par ailleurs `EditLigneAvPerModal.tsx` n'a pas de champ "valeur" direct (seulement `nom_support`/`type_support`) — contrairement à Crypto/PE-SCPI, la valeur d'un support AV/PER ne se met à jour que via le journal, il n'y a pas d'équivalent au "fixer la quantité totale" direct.

**Conclusion pour la carte** : la simplification envisagée pour Bourse (ticket [Mise à jour d'une Ligne Bourse existante](09-maj-ligne-bourse.md)) s'applique directement à Crypto et PE/SCPI (même mouvement décoratif). Assurance-vie/PER est le seul domaine où le Mouvement joue un rôle réel — toute décision de simplification du flux "Associer un mouvement" devra explicitement préserver la capture des versements pour ce domaine, ou proposer un mécanisme de remplacement pour ces deux règles fiscales.
