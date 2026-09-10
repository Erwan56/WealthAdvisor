# Modèle Entité — attribut par Ligne vs conteneur hiérarchique

Type: grilling
Status: resolved
Claimed-by: session_01PWX6UxecxKh82ZdKTMGDmL

## Question

Aujourd'hui une Entité (perso/SARL/SCI) est un conteneur hiérarchique : chaque Domaine/Enveloppe/Ligne appartient explicitement à une Entité, et la navigation (`EntityTabs.tsx`) affiche un onglet par Entité + un onglet "Toutes les Entités" qui n'est qu'une vue agrégée sans possibilité d'ajouter une Ligne — confirmé dans `LiquiditesDashboard.tsx:74-79` (et le même schéma dans les autres Dashboards par Domaine) : sur "Toutes les Entités" le bouton "+ Ajouter" est remplacé par le texte "Choisissez une Entité pour ajouter un compte".

L'utilisateur propose une alternative : un simple attribut "Entité" porté par chaque Ligne, plus proche d'un tag libre que d'un conteneur hiérarchique.

Trancher :
- Garde-t-on le conteneur hiérarchique actuel — et si oui, comment résout-on l'irritant de "Toutes les Entités" qui bloque aujourd'hui l'ajout d'une Ligne (ex. un sélecteur d'Entité dans le modal de création, atteignable même depuis "Toutes les Entités") ?
- Ou bascule-t-on vers l'attribut Entité par Ligne — et si oui, quel impact sur la navigation par onglets (disparaît-elle ? devient-elle un filtre ?), sur le niveau auquel on choisit l'Entité à la création, et sur les règles de conseil aujourd'hui typées par type d'Entité (ex. trésorerie professionnelle dormante réservée aux Entités `activité de service`, cf. `../../wealth-advisor/CONTEXT.md`) ?

## Réponse

Conteneur hiérarchique gardé — mais résolution différente du sélecteur-dans-la-modale envisagé au cadrage. Faits vérifiés en code : `entity_id` vit sur `envelopes` et `lines` (pas de table `domaines`), `NOT NULL` sur les deux, et le serveur garde toujours une Ligne synchronisée avec l'`entity_id` de son Enveloppe (jamais transmis indépendamment par le client) ; pour Liquidités/Immobilier (pas d'Enveloppe), l'Entité est déjà prise directement depuis la requête de création de la Ligne.

Décisions :
1. **Onglets par Entité supprimés** des Dashboards par Domaine (`EntityTabs.tsx` disparaît de ce contexte) — remplacés par la seule vue agrégée "Toutes les Entités" déjà existante (colonne Entité par ligne), sans filtre dédié (3 Entités réelles aujourd'hui ; ne pas anticiper un filtre pour un besoin non exprimé).
2. **Entité choisie explicitement à la création**, jamais déduite d'une sélection de navigation : au niveau de l'Enveloppe pour Bourse/Assurance-vie-PER/Crypto/PE-SCPI (la Ligne hérite ensuite de l'Entité de son Enveloppe, comme aujourd'hui), au niveau de la Ligne pour Liquidités/Immobilier. Ça élimine l'irritant par construction : il n'existe plus de contexte "Entité courante" sur lequel bloquer une création.
3. **Gestion des Entités déplacée** de la barre d'onglets vers le futur écran de "Configuration globale", partagé avec la gestion des Banques (voir [Banques — liste prédéfinie et écran de configuration globale](05-banques-configuration.md)) — ça tranche au passage une partie de ce ticket (l'écran aura au moins deux sections dès le départ). Gestion complétée par rapport à l'existant : ajout du champ `charges_fixes_professionnelles` manquant au formulaire de création (déjà supporté serveur/DB, absent du formulaire), et ajout d'une édition (aujourd'hui seuls create/delete existent, aucune route PUT/PATCH).
4. **Conséquence sur un autre ticket** : [Filtrage Domaine × type d'Entité](02-filtrage-domaine-entite.md) partait de la notion d'"Entité courante" sélectionnée, qui n'existe plus sur les Dashboards — sa question est réécrite en conséquence (voir ce ticket).

Non affecté : le glossaire `CONTEXT.md` (Entité reste conteneur, un niveau au-dessus de Domaine) — mis à jour pour refléter la disparition des onglets et le nouveau point d'entrée Configuration.
