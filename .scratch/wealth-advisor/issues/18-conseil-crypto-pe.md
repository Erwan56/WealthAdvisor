# Logique de conseil et anomalies — Crypto & Private equity/autres

Type: grilling
Status: resolved
Claimed-by: session_01XoLJJEihPVwiZUVYQx1TvJ
Blocked by: 01, 03, 04, 22

## Question

Suite au ticket [Conception du moteur de conseil hybride](04-moteur-conseil-hybride.md), définir la logique de conseil déterministe propre aux domaines Crypto et Private equity/autres :

- Limites d'exposition selon le Profil de risque (bucket prudent/équilibré/dynamique) : seuils déterministes internes purement destinés à déclencher une alerte qualitative (ex. « ta poche crypto dépasse ce qui est habituel pour un profil prudent »), **jamais affichés comme une allocation cible chiffrée** (le Profil de risque reste qualitatif, décision déjà actée dans [Modèle de profil utilisateur & méthodologie de profil de risque](02-profil-risque.md)).
- Origine des seuils : à sourcer par recherche dans la littérature patrimoniale usuelle (ex. % du patrimoine net recommandé en crypto par bucket de risque) — pas un choix arbitraire de l'utilisateur, contrairement à d'autres seuils de ce fog.
- Anomalies/angles de conseil propres au private equity/SCPI (ex. durée de blocage, échéance de sortie de fonds) à explorer en session.

**Cadrage déjà tranché (à ne pas rouvrir)** : socle minimal, 2 à 4 règles/angles maximum ; le LLM ne recalcule jamais un chiffre — il reçoit le pourcentage déjà calculé et le seuil déjà comparé, et habille le résultat en recommandation qualitative ; les seuils d'exposition doivent être sourcés (recherche), pas de valeur arbitraire.

## Réponse

Socle de **3 règles déterministes**, toutes calculées en dur sur le **Patrimoine net total** (concept déjà modélisé) et transmises en contexte au LLM (jamais recalculées) :

1. **Crypto — seuil d'exposition par Profil de risque** : % du Patrimoine net total investi en crypto, comparé à la borne haute du palier du bucket courant (grille sourcée dans [Recherche : limites d'exposition usuelles crypto & private equity par profil de risque](22-recherche-limites-exposition-crypto-pe.md)) : **prudent > 2 %, équilibré > 5 %, dynamique > 10 %**. Le seuil du profil dynamique coïncide avec le plafond absolu de 10 % cité de façon quasi unanime dans la recherche, donc pas de seuil distinct pour ce profil. Ton de l'alerte hedged (repère indicatif, pas une norme) — aucune source ne présente ces chiffres comme une cible ferme.

2. **Private equity/SCPI — seuil d'exposition plat** : % du Patrimoine net total investi en PE/SCPI (toutes Enveloppes du domaine), comparé à un seuil unique **20 %**, **non modulé par le Profil de risque** — la recherche ne fournit aucune grille sourcée par bucket pour ce domaine (contrairement à la crypto), seulement des fourchettes larges indexées sur le patrimoine/l'horizon (5-20 %+). 20 % retenu comme jugement de conception (borne haute de la fourchette « portefeuille équilibré » de Leduc & Associés dans la recherche), assumé comme tel — ton de l'alerte encore plus hedged que pour la crypto.

3. **Private equity/SCPI — échéance de blocage** (par Enveloppe) : pour toute Enveloppe PE/SCPI dont le champ `durée de blocage` est renseigné, alerte proactive **6 mois avant** l'échéance calculée (`date d'ouverture` + `durée de blocage`), puis note ponctuelle au franchissement effectif — même structure à deux temps que le cap des 8 ans de l'assurance-vie (règle 1 de [Logique de conseil et anomalies — Assurance-vie/PER](17-conseil-assurance-vie-per.md)), pour cohérence entre domaines. Une Enveloppe sans `durée de blocage` (ex. SCPI à capital variable) est **ignorée silencieusement** pour cette règle — champ optionnel déjà modélisé, pas de valeur par défaut inventée.

**Non retenu** : grille PE/SCPI par profil de risque construite par extrapolation (aurait présenté comme structuré un chiffre qui ne l'est pas, contrairement au vrai consensus trouvé côté crypto) ; distinction SCPI capital fixe/variable dans la règle d'échéance (le champ `durée de blocage` reste la seule donnée déterminante, silencieux si absent) ; angles crypto au-delà de l'exposition (pas demandés par le cadrage du ticket).

Décidé par grilling avec l'utilisateur.
