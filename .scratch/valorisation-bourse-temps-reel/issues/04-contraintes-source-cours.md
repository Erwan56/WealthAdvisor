# Contraintes pour la source de cours externe

Type: grilling
Status: resolved
Claimed-by: session_013yZgqVv9UEGzjsxyB8dDE8
Blocked by: 01

## Question

L'application ne fait aujourd'hui aucun appel réseau sortant (confirmé : aucune dépendance client HTTP, un seul `fetch()` dans tout le repo et il cible le backend de l'app elle-même — cf. exploration du 09/09/2026). Le principe du PRD parent « stockage local uniquement, pas de cloud » porte sur le stockage des données, pas sur les appels réseau sortants.

Avant de lancer la recherche de fournisseur (ticket [Recherche : source de cours gratuite par ISIN, couverture EUR + conversion devise étrangère](05-recherche-source-cours.md)), cadrer les contraintes : l'appel à une API tierce est-il acceptable, quel est le budget, et comment traiter les titres cotés en devise étrangère sachant que le modèle de données du PRD parent est explicitement « euros uniquement » (`PRD.md:42`) ?

## Réponse

- **Appel réseau tiers accepté** : une consultation de cours (identifiants de titre + prix, pas de donnée personnelle sensible) est distincte du principe de stockage local — première sortie réseau de l'app, mais jugée acceptable pour cet usage.
- **Budget** : gratuit uniquement. Pas de plafond alloué à un abonnement payant — usage personnel, faible volume d'appels (refresh à la demande, pas de polling en continu).
- **Devises étrangères** : couvertes, mais via une conversion « légère » cantonnée au flux de refresh — le cours récupéré en devise étrangère est converti en EUR au taux du jour au moment du refresh (via la même source ou une source de change complémentaire), puis stocké comme une simple valeur EUR (comme aujourd'hui, dans `valorisations.valeur`). **Aucun champ `devise` n'est ajouté au modèle de données** — le principe PRD « euros uniquement » reste intact partout ailleurs ; seul le refresh sait gérer la conversion en interne. Une Ligne dont l'ISIN ne résout à aucune cotation exploitable (EUR direct ou convertible) n'est pas rafraîchie automatiquement mais reste modifiable manuellement comme aujourd'hui — pas une erreur bloquante pour le refresh global.
- **Amendement explicitement écarté** : une vraie extension multi-devise du modèle (champ `devise` sur Ligne/Mouvement/Valorisation) a été considérée et rejetée pour cet effort — cf. [Out of scope](../map.md#out-of-scope). Resterait disponible comme effort futur si le besoin se généralise au-delà du refresh de cours.
