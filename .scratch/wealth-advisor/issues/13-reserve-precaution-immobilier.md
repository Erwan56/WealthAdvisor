# Réserve de précaution immobilier et arbitrage liquidités ↔ investissement

Type: grilling
Status: resolved
Claimed-by: session_01QHgdqVt4UM28nW12uKohYu
Blocked by: 01, 04

## Question

Sous-question du fog « Logique de conseil fine par domaine », séparée en ticket dédié car transversale à liquidités et immobilier plutôt que propre à un seul domaine (voir [Modèle de données du patrimoine par domaine](01-modele-patrimoine.md) et [Conception du moteur de conseil hybride](04-moteur-conseil-hybride.md)).

Cas d'usage de référence donné par l'utilisateur : « j'ai 15K€ dans un compte courant dédié à un investissement locatif, est-ce que j'ai besoin de garder cette somme dormante ? ou puis-je garder 5K€ (ou autre montant) et investir les 10K€ restants quelque part, en sachant que je dois pouvoir en disposer rapidement ? »

À trancher :
- Faut-il un lien persistant dans le modèle entre une Ligne liquidités et une Ligne immobilier (« ce compte est la réserve dédiée à ce bien »), ou le rapprochement reste-t-il purement conversationnel ?
- D'où vient le montant de réserve « correct » par bien (convention sourcée, saisie manuelle, ou mix) ?
- Jusqu'où va la recommandation du LLM sur le surplus investissable (catégories génériques vs Enveloppes existantes du patrimoine) ? Faut-il formaliser la contrainte de liquidité (délai de récupération) ?

## Réponse

- **Lien persistant** : champ optionnel `réserve_pour` sur la Ligne liquidités, référençant une Ligne immobilier — pas de rapprochement purement conversationnel à refaire à chaque demande. Amendement posé sur [Modèle de données du patrimoine par domaine](01-modele-patrimoine.md).
- **Montant de réserve cible par bien** : mix — une convention par défaut proposée (à sourcer par recherche : % de la valeur du bien par an, ou nombre de mois de charges/loyer, pratique courante en gestion locative), ajustable par bien. Cohérent avec le principe déjà acté « formules usuelles sourcées, seuils ajustables ».
- **Calcul déterministe** : la couche déterministe calcule le surplus investissable (cash du compte réservé au-delà de la cible de réserve) ; le LLM ne recalcule jamais ce chiffre, il le reçoit dans son contexte (cf. [Conception du moteur de conseil hybride](04-moteur-conseil-hybride.md)) et l'habille en recommandation qualitative.
- **Portée de la recommandation** : le LLM peut s'appuyer sur les Enveloppes déjà existantes dans le patrimoine de l'utilisateur pour orienter le surplus (pas seulement des catégories génériques type « livret »/« fonds euro »), en s'appuyant sur le contexte complet déjà transmis à chaque demande.
- **Contrainte de liquidité** : reste qualitative, pondérée par le LLM dans son explication — pas de délai de récupération chiffré formalisé dans les règles déterministes.

**Point de recherche restant** : la convention par défaut de réserve de précaution (% valeur du bien/an, ou mois de charges) n'est pas encore sourcée — reporté au fog « Maintenance annuelle des paramètres fiscaux » élargi, ou à un point de recherche à cadrer lors de l'implémentation de ce ticket.

Décidé par grilling avec l'utilisateur, à partir d'un cas d'usage concret.
