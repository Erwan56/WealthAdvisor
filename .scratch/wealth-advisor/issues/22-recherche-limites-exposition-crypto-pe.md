# Recherche : limites d'exposition usuelles crypto & private equity par profil de risque

Type: research
Status: resolved
Blocked by: 02, 03

## Question

Pour alimenter [Logique de conseil et anomalies — Crypto & Private equity/autres](18-conseil-crypto-pe.md) : quelles limites d'exposition (en % du patrimoine net ou du patrimoine investissable) sont usuellement recommandées pour les actifs crypto et private equity/SCPI, selon un profil de risque qualitatif (prudent/équilibré/dynamique — voir [Modèle de profil utilisateur & méthodologie de profil de risque](02-profil-risque.md)) ?

À rechercher :
- Fourchettes usuelles par bucket de risque pour la crypto (littérature de gestion de patrimoine personnelle grand public — pas de recherche académique).
- Fourchettes usuelles pour le private equity/SCPI (souvent traité différemment de la crypto du fait de la liquidité réduite — noter si les sources distinguent les deux).
- Ces seuils sont destinés à un usage interne (déclenchement d'alerte qualitative par le LLM), pas affichés comme allocation cible chiffrée à l'utilisateur — noter si les sources elles-mêmes présentent ces chiffres comme des cibles strictes ou des repères indicatifs (utile pour calibrer le ton de l'alerte).

Capturer les fourchettes et sources dans `assets/22-recherche-limites-exposition-crypto-pe.md`, avec le degré de consensus/variabilité entre sources.

## Answer

Recensement complet livré dans [`assets/22-recherche-limites-exposition-crypto-pe.md`](../assets/22-recherche-limites-exposition-crypto-pe.md), sourcé sur des médias patrimoniaux grand public français, des banques privées anglo-saxonnes (repère de comparaison), et le cadre réglementaire français.

**Crypto** — convergence assez nette entre sources françaises indépendantes (Wigl, Audit Conseil Patrimoine, Finary, Alaia) sur une grille à trois paliers : **prudent ≈ 1-2 %, équilibré ≈ 3-5 %, dynamique ≈ 5-10 %**, avec **10 %** cité de façon quasi unanime comme plafond au-delà duquel l'exposition n'est plus raisonnable pour un non-spécialiste. Les banques privées anglo-saxonnes (Morgan Stanley 0/2/3/4 %, Bank of America 1-4 %) confirment la même structure graduée mais à des niveaux systématiquement plus bas — écart à noter mais non expliqué par les sources elles-mêmes. Aucun chiffre attribuable à l'AMF. Toutes les sources, sans exception, présentent ces pourcentages comme des repères indicatifs, jamais comme des cibles fermes.

**Private equity/SCPI** — pas de grille comparable calée sur prudent/équilibré/dynamique. Les sources indexent plutôt sur le niveau de patrimoine et l'horizon : Leduc & Associés 5-10 % (constitution) à 15-20 % (patrimoine important) ; Allnews 15 % comme « socle raisonnable », jusqu'à 30 %+ pour patrimoines importants ; SCPI souvent traité comme classe immobilière mainstream (10-20 %) plutôt que comme alternatif à plafonner sévèrement. Variabilité nettement supérieure à celle de la crypto — un seuil interne pour ce ticket sera un jugement de conception (fourchette large type 5-20 %), pas une convention sourcée. Un plancher réglementaire (loi Industrie Verte, 0/4/8 % par profil en gestion pilotée) existe mais ne s'applique pas au patrimoine global et n'est pas réutilisable tel quel.

**Illiquidité** — aucune source ne traite l'illiquidité du PE/SCPI comme motif d'un plafond plus bas que la crypto ; au contraire les fourchettes PE/SCPI sont plus hautes malgré une illiquidité bien supérieure. L'illiquidité est traitée comme un facteur de capacité (patrimoine/horizon suffisants pour immobiliser du capital), tandis que le plafond bas de la crypto est motivé par la volatilité/le risque de perte totale, indépendamment de la liquidité.

**Consensus** — pour la crypto, quasi-consensus qualitatif sur la structure à trois paliers et l'ordre de grandeur (plus faible que la convention « 3-6 mois » de [Recherche : seuil usuel de liquidités dormantes sur compte courant/livret](19-recherche-seuil-liquidites-dormantes.md), mais réel). Pour le PE/SCPI, pas de convention comparable — variabilité du même ordre que celle de [Recherche : convention de réserve de précaution pour un bien locatif](20-recherche-convention-reserve-precaution.md). Le ton de l'alerte devra donc être hedged pour la crypto et encore plus hedged pour le PE/SCPI.
