# Logique de conseil et anomalies — Bourse

Type: grilling
Status: resolved
Claimed-by: session_01KyTR9vL4DycQpCRNm89HNd
Blocked by: 01, 03, 04, 23

## Question

Suite au ticket [Conception du moteur de conseil hybride](04-moteur-conseil-hybride.md), définir la logique de conseil déterministe propre au domaine Bourse (PEA/PEA-PME/CTO) :

- Diversification/rééquilibrage : quelles règles déterministes simples permettent de détecter une concentration excessive (ex. sur une ligne, un secteur si l'information est disponible) et quel est le rôle du LLM dans l'interprétation ?
- Anomalies proactives propres à la bourse au-delà du suivi du plafond PEA déjà évoqué (ex. proximité du plafond de versement PEA — seuil exact à préciser ici).
- Angles de conseil liés à la fiscalité déjà recensée dans [Règles fiscales et légales françaises par domaine](03-regles-fiscales-legales.md) (ex. arbitrage PEA vs CTO selon durée de détention, plus-value latente).

**Cadrage déjà tranché (à ne pas rouvrir)** : socle minimal, 2 à 4 règles/angles maximum ; formules usuelles sourcées si convention établie existe, seuils de déclenchement tranchés en jugement personnel sinon ; le LLM ne recalcule jamais un chiffre.

## Réponse

Socle retenu : **3 règles/angles** (dans la limite 2-4 déjà cadrée).

1. **Concentration excessive par Ligne** — calcul sur le total bourse cumulé (PEA + PEA-PME + CTO), pas par Enveloppe séparée, et uniquement par Ligne individuelle (pas de regroupement par secteur — pas de champ secteur ajouté au modèle, pour ne pas alourdir la saisie pour un gain marginal). Seuil : **25 %** du total bourse cumulé, jugement personnel tranché en session (pas de convention sourcée à chercher, c'est un choix de risque personnel). Rôle du LLM : interpréter qualitativement le risque de concentration et suggérer un rééquilibrage vers d'autres Lignes/Enveloppes **déjà existantes** dans le patrimoine bourse de l'utilisateur — jamais vers un titre précis non détenu (hors scope : pas de conseil de sélection de valeurs).

2. **Cash dormant en Enveloppe bourse** — **amendement au modèle** (voir [Modèle de données du patrimoine par domaine](01-modele-patrimoine.md)) : ajout d'une Ligne "compte espèces" au sein d'une Enveloppe bourse (PEA/PEA-PME/CTO), distincte des Lignes-titres, pour représenter le cash non investi dans la poche de l'enveloppe. Anomalie : cash / valeur totale de l'Enveloppe au-delà de **5 %** (couvre le cash technique — règlement/dividendes en attente, petite marge — au-delà on considère que c'est dormant). Seuil issu de [Recherche : rationale et seuil usuel du cash dormant en portefeuille bourse](23-recherche-cash-dormant-portefeuille-bourse.md), qui n'a trouvé aucune convention chiffrée reconnue (contrairement au fonds d'urgence générique du ticket [Recherche : seuil usuel de liquidités dormantes sur compte courant/livret](19-recherche-seuil-liquidites-dormantes.md)) — seuil bas retenu en jugement personnel, cohérent avec le fait que les usages sourcés de cash "légitime" en portefeuille sont surtout techniques (2-4 %) en phase d'accumulation, pas une réserve tactique large. Message qualitatif du LLM volontairement court par défaut (signalement + suggestion d'investir, éventuellement vers une Ligne/Enveloppe existante si pertinente) — le débat dry-powder vs tout-investi (documenté dans la recherche) n'est développé que si l'utilisateur le demande explicitement en chat, pas dans l'anomalie proactive.

3. **Angle fiscal PEA vs CTO** — transmis en contexte au LLM, pas une anomalie à seuil : (a) ancienneté du PEA (date du premier versement → nombre d'années, pour se situer par rapport au seuil des 5 ans de [Règles fiscales et légales françaises par domaine](03-regles-fiscales-legales.md) §1.4), (b) plus-value latente par Ligne CTO (valeur actuelle − prix de revient moyen pondéré, déjà calculable via le modèle). Le LLM combine ces chiffres avec la fiscalité déjà recensée pour argumenter un arbitrage PEA/CTO si pertinent, sans jamais recalculer un chiffre lui-même.

**Écarté explicitement** : anomalie de proximité du plafond de versement PEA/PEA-PME (envisagée dans le cadrage initial du ticket). Jugée non utile par l'utilisateur — son propre plafond de versement PEA (150 000 €) est déjà atteint, sans action possible une fois ce seuil franchi (le plafond de versement est fixe, contrairement au cash dormant qui reste actionnable). Pas retenue dans le socle.

Décidé par grilling avec l'utilisateur, à partir d'un cas d'usage concret (PEA à 280k€, 100k€ en cash non investi) et de la recherche [Recherche : rationale et seuil usuel du cash dormant en portefeuille bourse](23-recherche-cash-dormant-portefeuille-bourse.md).
