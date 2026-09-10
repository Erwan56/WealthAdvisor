# Refonte de la saisie Immobilier — calcul du capital restant dû et édition des paramètres locatifs

Type: grilling
Status: resolved
Claimed-by: session_01PWX6UxecxKh82ZdKTMGDmL

## Question

Deux irritants remontés sur `CreateLigneImmobilierModal.tsx`/`ImmobilierLigneJournal.tsx` :

1. Le "capital restant dû" est un champ manuel ressaisi à chaque nouvelle entrée du journal (`ImmobilierLigneJournal.tsx:110-142`), sans aucun champ taux de prêt ni calcul d'amortissement. L'utilisateur veut renseigner le taux (et la durée ?) du prêt et laisser l'app calculer le capital restant dû (et la date de fin de prêt) automatiquement.

2. Loyer/charges/mensualité/taxe foncière/assurance/frais de gestion sont en fait déjà modifiables aujourd'hui — mais uniquement en repassant par le flux "Nouvelle entrée" du journal, qui impose aussi une date + une valeur estimée du bien. Contrairement à ce que l'utilisateur croit ("on ne peut pas modifier"), le vrai problème est l'absence d'une action de modification dédiée, indépendante de la création d'un nouveau point de Valorisation — pas un manque fonctionnel.

Trancher :
- Le modèle de prêt (taux, durée, méthode d'amortissement — probablement amortissement classique français à mensualités constantes, date de départ) qui remplace la saisie manuelle du capital restant dû, et l'impact sur l'historique des Valorisations déjà saisies (capital restant dû recalculé rétroactivement, ou seules les nouvelles entrées en bénéficient ?).
- Si l'édition des paramètres locatifs courants (loyer/charges/mensualité...) doit devenir une action séparée de l'ajout d'un point de Valorisation, ou si le modèle actuel (un changement de loyer = un nouveau point d'historique) est en fait le bon et qu'il suffit de le rendre plus visible/direct.

## Résolution

**Modèle de prêt** — nouveau concept **Prêt immobilier**, porté par la Ligne (`line_immobilier`, pas par Valorisation), optionnel : capital emprunté initial, taux annuel, durée, date de départ. Amortissement classique français à mensualités constantes. UI : ces 4 champs rejoignent `CreateLigneImmobilierModal.tsx` et `EditLigneImmobilierModal.tsx` (pattern d'édition Ligne déjà existant pour `prix_acquisition_total`/`date_acquisition`/`residence_principale`/`regime_location` — pas de nouvelle modale à inventer pour ça).

Dès qu'un Prêt est configuré sur une Ligne : capital restant dû **et** mensualité cessent d'être des champs saisis/stockés dans `valorisation_immobilier` et deviennent calculés à la volée par la formule d'amortissement, à toute date (y compris les Valorisations déjà passées) — jamais snapshotés. Conséquence assumée : corriger une coquille sur le taux plus tard replie la correction sur tout l'affichage, passé compris. Pas d'override manuel possible une fois le Prêt configuré.

L'historique déjà saisi à la main **avant** la configuration du Prêt reste figé tel quel — aucun recalcul rétroactif silencieux (même principe que la décision Liquidités du ticket 04). Une Ligne sans Prêt configuré garde le comportement actuel : capital restant dû et mensualité restent des champs manuels par Valorisation.

Date de fin de prêt : exacte (`date de départ + durée`) pour une Ligne avec Prêt configuré — remplace l'usage de `estimateLoanPayoffDate()` (tendance linéaire, `server/src/advice/rules/immobilier.ts:98-120`) pour ces Lignes ; celui-ci reste le seul recours (fallback) pour une Ligne sans Prêt configuré.

Renégociation de taux et remboursement anticipé partiel : explicitement hors périmètre de ce ticket — envoyés en fog (map, "Not yet specified"), pas modélisés par le Prêt immobilier tel que défini ici.

**Édition des paramètres locatifs courants** (loyer/charges/taxe foncière/assurance/frais de gestion) — nouvelle action "Modifier" dédiée, distincte de "Nouvelle entrée" : elle met à jour la dernière Valorisation en place (aucun nouveau point d'historique créé). "Nouvelle entrée" reste réservée à un vrai nouveau point d'historique : date + valeur estimée (+ capital restant dû/mensualité seulement pour les Lignes sans Prêt configuré).

**Glossaire** (`CONTEXT.md`) amendé : la définition de **Valorisation** distingue désormais les faits réellement portés par la Valorisation (loyer/charges/taxe foncière/assurance/frais de gestion, éditables via la nouvelle action "Modifier") de ce qui devient dérivé du Prêt (capital restant dû, mensualité) ; nouvelle entrée glossaire **Prêt immobilier**.
