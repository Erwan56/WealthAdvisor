# Conception du moteur de conseil hybride

Type: grilling
Status: resolved
Blocked by: 01, 02, 03
Claimed-by: session_01QHgdqVt4UM28nW12uKohYu

## Question

Comment le moteur de conseil combine-t-il les règles déterministes (issues de [Règles fiscales et légales françaises par domaine](03-regles-fiscales-legales.md), appliquées aux données de [Modèle de données du patrimoine par domaine](01-modele-patrimoine.md) et [Modèle de profil utilisateur & méthodologie de profil de risque](02-profil-risque.md)) et le raisonnement du LLM ?

À trancher :
- Où passe exactement la frontière entre ce qui est calculé en dur (ex. rendement locatif, plafond PEA atteint, plus-value imposable) et ce qui est laissé au LLM (ex. « vaut-il mieux orienter cet argent vers le PEA ou l'assurance-vie compte tenu de ton horizon et de ta fiscalité »).
- Comment le contexte (patrimoine complet + profil + résultats des calculs déterministes) est assemblé et transmis au LLM pour chaque demande de conseil.
- Comment le conseil est déclenché : uniquement à la demande dans le chat, ou proactivement quand une anomalie déterministe est détectée (ex. liquidités dormantes au-delà d'un seuil) ?

## Answer

**Frontière** : principe unique — tout calcul mécanique (règle fiscale sourcée *ou* convention de calcul usuelle comme le rendement locatif/cash-flow, cf. point #8 du recensement fiscal) est hardcodé dans la couche déterministe. Le LLM reste cantonné au qualitatif : interprétation, arbitrage, priorisation, explication.

**Garde-fou numérique** : le LLM n'a pas le droit d'énoncer un chiffre (montant, taux, seuil) qu'il n'a pas reçu de la couche déterministe — il cite les résultats déjà calculés, il ne recalcule jamais. Condition de fiabilité du moteur hybride.

**Incertitude fiscale** : les 11 points signalés "à vérifier" dans [Règles fiscales et légales françaises par domaine](03-regles-fiscales-legales.md) ne sont pas exclus des calculs, mais tout résultat déterministe qui en dépend porte un indicateur de confiance ; le LLM restitue cet indicateur comme réserve en langage naturel dans sa réponse plutôt que de le taire ou de bloquer le calcul.

**Déclenchement** : à la demande dans le chat, plus proactif dès cet effort pour des anomalies déterministes simples (ex. liquidités dormantes, PEA proche du plafond), détectées à l'ouverture de l'app ou après une mise à jour du patrimoine — pas de job périodique en tâche de fond. Le détail des règles d'anomalie par domaine reste dans le fog existant (« Logique de conseil fine par domaine »), à cadrer domaine par domaine une fois ce moteur implémenté.

**Portée du chat** : consultatif par défaut. Seule écriture possible : l'override du bucket de Profil de risque déjà acté dans [Modèle de profil utilisateur & méthodologie de profil de risque](02-profil-risque.md). Pas d'autre action sur les données (patrimoine ou profil) déclenchable depuis le chat dans cet effort — la saisie structurée reste l'unique chemin d'écriture, pour garantir une base fiable aux calculs déterministes.

**Persistance du conseil** : éphémère, recalculé à chaque demande à partir de l'état courant du patrimoine/profil. Pas de nouvel objet domaine "Recommandation" — seul l'historique de conversation (détail d'implémentation UI) est éventuellement conservé.

**Assemblage du contexte** : contexte complet à chaque demande — patrimoine total + profil + tous les résultats déterministes pertinents, sans scoping par domaine ou Objectif. Justifié par le volume de données modeste (usage personnel) et par le besoin d'une vision transversale (ex. arbitrages inter-domaines) qui est la valeur ajoutée du moteur hybride.

Décidé par grilling avec l'utilisateur.
