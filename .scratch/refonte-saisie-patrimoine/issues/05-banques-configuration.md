# Banques — liste prédéfinie et écran de configuration globale

Type: grilling
Status: resolved
Claimed-by: session_01PWX6UxecxKh82ZdKTMGDmL

## Question

Même constat que le Type de compte (voir [Formulaire Liquidités](04-formulaire-liquidites.md)) : "Banque" est un champ texte libre (`CreateLigneModal.tsx:26,29`). L'utilisateur veut une liste prédéfinie des banques françaises usuelles, plus un écran de "configuration globale" permettant d'en ajouter si besoin.

Trancher : la liste par défaut de banques françaises à embarquer, la modélisation (nouvelle table `banques` gérée par l'utilisateur vs simple liste statique versionnée dans le code), l'emplacement de cet écran de configuration dans la navigation (nouvel écran top-level ? sous Profil ?).

Périmètre déjà élargi par [Modèle Entité — attribut par Ligne vs conteneur hiérarchique](01-modele-entite.md) : cet écran de Configuration globale n'est plus scopé aux seules Banques dès le départ — il héberge aussi la gestion des Entités (libellé, type, Charges fixes professionnelles ; création et édition, aujourd'hui dans `EntityTabs.tsx`/`CreateEntityPanel.tsx` sans édition possible). À trancher ici : la structure commune de l'écran (une section par liste gérée ? un seul écran avec sous-navigation ?) qui accueillera ces deux sections dès la première version. L'extension au-delà (courtiers Bourse, plateformes Crypto...) reste en fog, non anticipée.

Périmètre élargi une deuxième fois par [Formulaire Liquidités — type de compte et suppression du mouvement](04-formulaire-liquidites.md) : la liste des Types de compte Liquidités (Compte courant, Livret A, LDDS, LEP, Compte à terme, Autre) devient elle aussi structurée et éditable par l'utilisateur — troisième section de l'écran dès la première version, aux côtés d'Entités et Banques. Les trois sections partagent le même besoin CRUD basique (au minimum ajouter une valeur ; édition/suppression à trancher ici comme pour les deux autres).

## Résolution

- **Liste de banques de départ** : BNP Paribas, Crédit Agricole, Société Générale, LCL, Banque Postale, Caisse d'Épargne, Crédit Mutuel, CIC, Banque Populaire, HSBC Continental Europe, BoursoBank, Fortuneo, Hello bank!, Monabanq, Revolut, N26. Pas de valeur "Autre" : une banque absente s'ajoute directement à la liste depuis la Configuration globale plutôt que de passer par un fourre-tout.
- **Modélisation** : table `banques` persistée et gérée par l'utilisateur, pas une liste statique versionnée dans le code — cohérent avec l'éditabilité demandée (ajouter une banque sans redéploiement) et avec le traitement déjà acté pour Type de compte.
- **Navigation** : nouvel onglet top-level "Configuration" dans le tableau `SCREENS` de `App.tsx`, distinct de Profil (qui porte les données personnelles de conseil, pas des listes de référence).
- **Structure de l'écran** : sous-navigation interne (onglets) entre les trois sections — Entités, Banques, Types de compte — plutôt qu'un empilement vertical, pour ne pas allonger l'écran (Entités a plus de champs : libellé, type, Charges fixes professionnelles).
- **CRUD** : ajout + édition + suppression sur les trois listes dès la V1. Suppression bloquée avec message explicatif si la valeur est déjà référencée par une Ligne/Enveloppe/Entité existante — même principe que le compte espèces Liquidités.

`CONTEXT.md` mis à jour : entrée **Banque** amendée (liste prédéfinie, table persistée, liste de départ), nouvelle entrée **Configuration globale** (écran).
