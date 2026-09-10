# Formulaire Liquidités — type de compte et suppression du mouvement

Type: grilling
Status: resolved
Claimed-by: session_01PWX6UxecxKh82ZdKTMGDmL

## Question

`CreateLigneModal.tsx:26,29,94-100` : "Type de compte" et "Banque" sont aujourd'hui de simples champs texte libre (seul un champ `taux` numérique existe à côté). L'utilisateur veut une liste prédéfinie de types de compte usuels distinguant au minimum compte courant (non rémunéré) et épargne, pour pouvoir cibler "ce qui dort" en reporting/conseil.

Sous-question ouverte : la règle de conseil "Mois de réserve visés" (`../../wealth-advisor/CONTEXT.md`) parle déjà de "livrets personnels" agrégés — vérifier si cette notion est aujourd'hui inférée du texte libre du champ ou pas implémentée du tout, et comment le nouveau champ structuré "type de compte" doit s'y brancher.

Par ailleurs `LigneJournal.tsx:112-132` propose un "Associer un mouvement" optionnel à la saisie d'une nouvelle Valorisation Liquidités — confirmé sans aucun effet aujourd'hui : `server/src/routes/liquidites.ts:172-176` l'insère en base sans lecture ailleurs, `server/src/advice/rules/liquidites.ts` ne le référence jamais (0 résultat en recherche). L'utilisateur penche pour sa suppression pure ("il peut être déduit").

Trancher : la liste exacte des types de compte à proposer (avec la distinction rémunéré/non-rémunéré), le branchement de cette liste sur les règles de conseil existantes, et la suppression (ou non) du mouvement dans ce flux.

Voir aussi [Banques — liste prédéfinie et écran de configuration globale](05-banques-configuration.md) (même défaut texte-libre, ticket séparé car il introduit un nouvel écran).

## Réponse

Faits vérifiés en code avant tranchage : `type_compte` et `banque` sont bien deux simples `string` optionnels côté client (`CreateLigneModal.tsx:5-14`), sans aucun enum. La règle "Mois de réserve visés" (`server/src/advice/rules/liquidites.ts:59-82`) infère déjà aujourd'hui les "livrets personnels" — mais de façon fragile : `isCompteCourant` (`liquidites.ts:21-23`) fait un test regex `/courant/i` sur le texte libre, et tout ce qui ne matche pas est traité comme un livret.

Décisions :

1. **`type_compte` devient un champ structuré** (liste prédéfinie), remplaçant l'input texte libre actuel. Liste par défaut : Compte courant, Livret A, LDDS, LEP, Compte à terme, Autre. Liste éditable (ajout de valeurs) par l'utilisateur depuis le futur écran de Configuration globale — voir [Banques — liste prédéfinie et écran de configuration globale](05-banques-configuration.md), qui héberge désormais une troisième section pour cette liste, aux côtés d'Entités et Banques.
2. **Rémunéré/non-rémunéré n'est pas une propriété portée par la liste elle-même** : dérivé directement du champ `taux` déjà existant sur la Ligne (`taux > 0` ⇒ rémunéré, `taux` nul/zéro ⇒ non rémunéré) — pas de flag dédié par type de compte. Ce critère remplace l'inférence fragile par regex (`isCompteCourant`) dans la règle "Mois de réserve visés" : "livret personnel" devient toute Ligne Liquidités d'une Entité `personnelle` avec `taux > 0`, complètement découplé du libellé du type de compte choisi.
3. **Suppression pure de "Associer un mouvement"** dans le flux Liquidités (`LigneJournal.tsx:112-132`) : la nouvelle entrée de journal ne garde que date + valeur totale. Confirmé sans effet fonctionnel avant suppression : le mouvement inséré aujourd'hui (`server/src/routes/liquidites.ts:172-177`) n'est lu nulle part, aucune règle de conseil Liquidités ne le référence (recherche à 0 résultat).

Conséquence sur un autre ticket : [Banques — liste prédéfinie et écran de configuration globale](05-banques-configuration.md) voit son périmètre élargi une deuxième fois — l'écran de Configuration héberge désormais trois sections dès la première version (Entités, Banques, Types de compte Liquidités).

Glossaire `../../wealth-advisor/CONTEXT.md` mis à jour : nouvelle entrée "Type de compte" (Liquidités), précision sur "Mois de réserve visés" (le critère "livret personnel" repose sur `taux > 0`, pas sur le libellé du type de compte), et note sur "Mouvement" (n'existe plus pour le Domaine Liquidités).
