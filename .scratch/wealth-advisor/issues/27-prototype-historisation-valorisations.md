# Prototype de l'historisation des Valorisations

Type: prototype
Status: resolved
Claimed-by: session_01KyTR9vL4DycQpCRNm89HNd

## Question

L'usage réel de l'utilisateur (export Excel fourni en session : mises à jour à des dates arbitraires, environ semestrielles, non temps réel) a révélé un manque dans [UX des formulaires de saisie par domaine](06-ux-formulaires-saisie.md) : le design actuel (édition en ligne d'une Ligne dans le dashboard) suppose implicitement une mise à jour « à aujourd'hui », sans date de Valorisation explicite/éditable ni vue de l'historique passé d'une Ligne.

À prototyper :
- **Date de Valorisation explicite et éditable** sur l'écran de mise à jour d'une Ligne (par défaut aujourd'hui, modifiable pour saisir une mise à jour rétroactive ou rattraper un retard de saisie).
- **Panneau « Historique »** par Ligne (accessible depuis son expansion dans le dashboard) : liste des Valorisations passées, avec correction/suppression d'une entrée erronée — pas seulement la valeur courante.

**Explicitement hors périmètre de ce ticket** : un flux de saisie initiale/bulk pour rattraper l'historique Excel existant de l'utilisateur — il gère cette reprise manuellement, pas besoin d'un mode de saisie dédié.

À invoquer : `/prototype` (comme pour le ticket 06 dont celui-ci amende le design).

## Réponse

**Variante retenue : C — Journal chronologique unifié** : [`assets/prototypes/27-prototype-historisation-valorisations.html`](../assets/prototypes/27-prototype-historisation-valorisations.html) (3 variantes).

Pas de formulaire de mise à jour séparé de l'historique : le dépliage d'une Ligne dans le dashboard **est** directement son journal de Valorisations — une entrée « Nouvelle entrée » épinglée en haut (Date de la valorisation éditable, défaut aujourd'hui ; valeur ; disclosure « Associer un mouvement » existante inchangée) au-dessus d'une timeline reverse-chronologique de toutes les Valorisations passées de la Ligne, chacune avec un delta vs le point précédent et des actions ✎ (corriger) / 🗑 (supprimer) en ligne à l'entrée elle-même. Une Ligne sans historique antérieur affiche un message dédié plutôt qu'un journal vide.

Écarte la variante A (disclosure « Historique » séparée sous le formulaire existant) et la variante B (tiroir latéral dédié, décorrélé de la mise à jour rapide en ligne) : la variante C prolonge directement le principe déjà acté sur [UX des formulaires de saisie par domaine](06-ux-formulaires-saisie.md) (« un seul écran, déduit », pas d'écrans séparés Mouvement/Valorisation) à l'historique — une seule vue dépliée, pas de second mécanisme d'affichage à apprendre.

Décidé par prototype (3 variantes) + réaction directe de l'utilisateur (« le C est très bien »).
