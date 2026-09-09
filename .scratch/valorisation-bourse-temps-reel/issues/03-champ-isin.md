# Champ ISIN dédié et migration

Type: grilling
Status: resolved
Claimed-by: session_013yZgqVv9UEGzjsxyB8dDE8
Blocked by: 01

## Question

Le champ actuel `line_bourse.nom_isin` (`EditLigneBourseModal.tsx:66`, libellé « Nom / ISIN ») est un texte libre qui mélange le nom du titre et son ISIN, saisi à la main sans structure. Or `lines.libelle` porte déjà séparément le nom de la Ligne. Pour interroger une source de cours externe de façon fiable, un ISIN structuré et validé est nécessaire.

Faut-il transformer ce champ en ISIN dédié, et comment gérer les données existantes déjà saisies dans ce champ texte libre ?

## Réponse

- **Champ dédié** : `nom_isin` devient un champ ISIN structuré et validé (12 caractères : 2 lettres de code pays + identifiant alphanumérique + chiffre de contrôle), utilisé pour l'appel à la source de cours. Le nom du titre reste porté par `lines.libelle`, qui existe déjà séparément — pas de duplication nom/ISIN dans un seul champ texte.
- **Migration des données existantes** : ressaisie manuelle, pas d'extraction automatique. Le texte libre actuel mélange nom et ISIN de façon non fiable pour une extraction automatique sûre (ordre, présence ou non des deux, formats variés) ; le volume de Lignes est faible (usage strictement personnel). Le nouveau champ ISIN démarre vide sur les Lignes existantes ; le refresh est silencieusement sans effet sur une Ligne dont l'ISIN n'est pas encore renseigné (pas une erreur bloquante), en cohérence avec [Contraintes pour la source de cours externe](04-contraintes-source-cours.md).
