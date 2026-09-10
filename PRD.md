# WealthAdvisor — Spécification produit (PRD)

> Généré à partir de la carte wayfinder [`​.scratch/wealth-advisor/map.md`](.scratch/wealth-advisor/map.md) (29 tickets résolus, aucun ticket ouvert au moment de la rédaction). Chaque section renvoie vers le ticket source pour le détail de la discussion ; ce document en est la synthèse actionnable pour l'implémentation.

## 1. Vision

Application web **strictement personnelle** de gestion de patrimoine qui :

1. **Centralise l'inventaire du patrimoine** de l'utilisateur sur six domaines (liquidités, bourse, immobilier, assurance-vie/PER, crypto, private equity/autres), réparti entre plusieurs **Entités** (patrimoine personnel + structures détenues — SARL, SCI...).
2. **Fournit des conseils de placement contextualisés** par domaine, en tenant compte de l'ensemble du patrimoine et du profil personnel, via un moteur **hybride** : règles déterministes codées en dur (calculs, plafonds légaux) + raisonnement LLM (Claude, via le CLI Claude Code) pour l'interprétation qualitative.

**Non-buts explicites** : pas d'agrégation bancaire automatique (saisie manuelle), pas de produit multi-utilisateurs, pas de conseil en investissement réglementé (statut CIF/AMF) — outil informatif uniquement.

## 2. Domaine métier & glossaire

Glossaire canonique tenu à jour dans [`.scratch/wealth-advisor/CONTEXT.md`](.scratch/wealth-advisor/CONTEXT.md) — résumé ici.

### 2.1 Structure du patrimoine

| Concept | Définition |
|---|---|
| **Entité** | Conteneur de patrimoine, sibling de la personne, au-dessus de Domaine. `perso` existe implicitement (non supprimable, type `personnelle`) ; d'autres sont créées à la demande (`type ∈ {activité de service, détention immobilière}`, ex. SARL, SCI). Porte un libellé libre. |
| **Domaine** | Catégorie d'actifs, répétée par Entité : liquidités, bourse, immobilier, assurance-vie/PER, crypto, private equity/autres. |
| **Enveloppe** | Contenant de Lignes avec métadonnées propres (libellé, type, date d'ouverture, statut) — PEA/PEA-PME/CTO, contrat AV/PER, fonds PE/SCPI, portefeuille crypto par plateforme. Terme interne/technique transverse uniquement : jamais montré à l'utilisateur — chaque Domaine a son propre nom d'écran (**Compte** pour Bourse, contrat pour AV/PER, portefeuille pour Crypto, fonds pour PE/SCPI). **Liquidités et Immobilier n'ont pas d'Enveloppe** : Lignes autonomes. |
| **Ligne** | Actif individuel (titre, support AV/PER, actif crypto, part de fonds, bien immobilier, compte de liquidités). Rattachée à une Enveloppe quand le Domaine en a une. Champs communs : id, libellé, domaine, entité, enveloppe parente optionnelle, valeur actuelle, date de dernière valorisation, note libre. |
| **Mouvement** | Événement daté qui modifie la composition du patrimoine (versement, retrait, achat, vente, souscription, rachat). Porte les métadonnées fiscales nécessaires aux calculs (ex. date de versement AV, caractère déductible PER, prix unitaire crypto). Attaché à l'Enveloppe ou à la Ligne selon le niveau où s'applique la règle fiscale. |
| **Valorisation** | Instantané daté de la valeur d'une Ligne. Pour l'immobilier, porte aussi les paramètres courants du bien à cette date (capital restant dû, loyer, charges, mensualité). Indépendante des Mouvements. |
| **Patrimoine net** | Valeur d'une Ligne (ou du total) diminuée des dettes rattachées (immobilier : valeur estimée − capital restant dû). |
| **Prix de revient moyen pondéré (PRU)** | Coût d'acquisition moyen d'une Ligne bourse en CTO, dérivé des Mouvements d'achat. N'existe pas en PEA/PEA-PME (fiscalité au niveau Enveloppe). |

### 2.2 Profil utilisateur

| Concept | Définition |
|---|---|
| **Profil** | Informations personnelles uniques (non dupliquées par Entité) : date de naissance, horizon global, TMI, Plafond PER annuel, Dépenses mensuelles courantes, Mois de réserve visés, situation familiale (statut marital, personnes à charge), Objectifs, Profil de risque. État courant, **non historisé**. |
| **Profil de risque** | Tolérance au risque réduite à un bucket (prudent/équilibré/dynamique) + connaissance des marchés (novice/initié/expert). Qualitatif — jamais traduit en allocation cible chiffrée. Déterminé par le Questionnaire de risque ; overridable en chat jusqu'au prochain passage du questionnaire. |
| **Questionnaire de risque** | 4 questions scorées (réaction à une perte simulée, horizon, connaissance des marchés, priorité sécurité/performance) → bucket. |
| **Objectif** | But patrimonial nommé (retraite, achat immobilier, transmission, sécurité/urgence, projet libre) : libellé, horizon propre, montant cible optionnel, **Lien patrimoine** (Patrimoine net total et/ou Domaine(s) et/ou Entité — pas de granularité Enveloppe/Ligne, pas de valeur par défaut, double-compte autorisé entre Objectifs), **Date d'atteinte estimée** (calculée). |

## 3. Périmètre fonctionnel par domaine — modèle de données

Devise : **euros uniquement**. Toutes les Lignes/Enveloppes appartiennent à une **Entité**.

### 3.1 Liquidités (pas d'Enveloppe)

Ligne : libellé, type de compte, plafond du livret, taux de rémunération actuel, **Banque**, valeur actuelle, `réserve_pour` (référence optionnelle vers une Ligne immobilier — voir §7.1).

> Champs `Perso/Pro` et `Charges fixes professionnelles` initialement portés par la Ligne ont été **migrés sur l'Entité** (voir ticket 28).

### 3.2 Bourse — PEA / PEA-PME / CTO (Enveloppe)

Enveloppe : libellé, type (PEA/PEA-PME/CTO), date d'ouverture, statut.
Ligne = titre : nom/ISIN, quantité, valeur actuelle, PRU (CTO uniquement).
**Ligne spéciale « compte espèces »** par Enveloppe : représente le cash non investi de la poche — mêmes champs qu'une Ligne (valeur actuelle, historisée), sans nom/ISIN ni PRU.

### 3.3 Immobilier (pas d'Enveloppe)

Ligne : libellé, **prix d'acquisition total** (inclut frais de notaire + travaux initiaux — convention actée), date d'acquisition, résidence principale (bool), régime de location.
Valorisation (paramètres courants historisés à chaque mise à jour) : valeur estimée, capital restant dû, loyer, charges, taxe foncière, assurance, frais de gestion, mensualité.

### 3.4 Assurance-vie / PER (Enveloppe)

Enveloppe = contrat : libellé, type (AV/PER), date d'ouverture, statut.
Ligne = support : nom, type (fonds euro/UC), valeur actuelle.

### 3.5 Crypto (Enveloppe)

Enveloppe = portefeuille par plateforme : libellé, plateforme étrangère (bool), prix d'acquisition cumulé.
Ligne = actif : symbole, quantité, valeur actuelle.

### 3.6 Private equity / SCPI (Enveloppe)

Enveloppe = fonds : libellé, type de dispositif (FCPR/FIP/FCPI/SCPI), durée de blocage.
Ligne = part souscrite : nombre de parts, valeur actuelle estimée.

### 3.7 Historisation

Deux flux indépendants :
- **Mouvements** typés et horodatés (versement, retrait, achat, vente, souscription, rachat), attachés à l'Enveloppe ou la Ligne selon le niveau fiscal pertinent.
- **Valorisations** datées, une par mise à jour de Ligne — pas de rééchantillonnage, la granularité affichée dans les vues de reporting est **par mise à jour réelle**, jamais mensuelle/annuelle.

*(Source : [Modèle de données du patrimoine par domaine](.scratch/wealth-advisor/issues/01-modele-patrimoine.md))*

## 4. Modélisation multi-Entités

Nouveau niveau **Entité**, sibling de la personne : `perso` implicite + Entités créées à la demande (`activité de service`, `détention immobilière`). Le Profil reste unique, découplé des Entités.

- Toute règle de conseil déjà cadrée par Domaine (§7) s'applique à **toute Entité qui a ce Domaine**, indépendamment (ex. concentration bourse jugée séparément pour `perso` et `pro_1`).
- **Patrimoine net total et vision consolidée** : agrégés toutes Entités par défaut, détail par Entité disponible au clic.
- **IFI** (§7.3) : agrégé toutes Entités (perso + détention immobilière).
- **Objectifs** : le Lien patrimoine peut aussi cibler une Entité.
- **`réserve_pour`** : reste intra-Entité.

*(Source : [Modélisation multi-entités juridiques / sociétés](.scratch/wealth-advisor/issues/28-modelisation-multi-entites-juridiques.md))*

## 5. UX & écrans

Design system commun aux prototypes : Fraunces (titres) / Public Sans (corps) / IBM Plex Mono (chiffres), fond `#EDEBE2`, accent `#96601F`. Prototypes HTML de référence dans [`assets/prototypes/`](.scratch/wealth-advisor/assets/prototypes/).

### 5.1 Navigation multi-Entités (transverse à 5.2 et 5.3)

Rangée d'**onglets d'Entité** au-dessus de l'écran (Dashboard et Reporting) : `perso` (badge), Entités créées (badge coloré par type + libellé), puis `+ Nouvelle Entité`. Onglet **« Toutes les Entités »** disponible sur les deux écrans :
- Reporting : KPI + tableau de répartition agrégés toutes Entités (+ carte KPI "Nombre d'Entités", masquée dès qu'une Entité précise est sélectionnée).
- Dashboard : cliquer un Domaine affiche la liste **fusionnée** des Lignes de toutes les Entités concernées, avec une **colonne Entité** par ligne ; le bouton « + Ajouter » est remplacé par une invite à choisir une Entité (créer une Ligne reste une action intra-Entité).

Création d'Entité : mini-formulaire (libellé + type, `Activité de service`/`Détention immobilière` uniquement — pas `Personnelle`), accessible à tout moment.

*(Source : [UX multi-Entités — création et navigation](.scratch/wealth-advisor/issues/29-ux-multi-entites-navigation.md), prototype [`29-ux-multi-entites-navigation.html`](.scratch/wealth-advisor/assets/prototypes/29-ux-multi-entites-navigation.html))*

### 5.2 Dashboard de saisie

**Structure = tableau de bord** (rail de Domaines à gauche + liste Enveloppe/Ligne, édition en ligne par expansion) :
- Cliquer une Ligne l'étend : affiche par défaut les champs de **Valorisation**, avec un disclosure repliable « Associer un mouvement » — pas d'écrans séparés Mouvement/Valorisation.
- **Historique** : déplier une Ligne affiche directement son **journal chronologique de Valorisations** — une entrée « Nouvelle entrée » épinglée en haut (date éditable, défaut aujourd'hui) au-dessus d'une timeline reverse-chronologique avec delta et actions corriger/supprimer par entrée. Pas de vue séparée.
- **Création (« + Ajouter »)** : panneau/modale par-dessus le dashboard, formulaire unique par domaine ; deux points d'entrée — dashboard (nouvelle Enveloppe + première Ligne, ou Ligne autonome pour liquidités/immobilier) et local à une Enveloppe existante (nouvelle Ligne directe).
- Immobilier : rendement brut, rendement net de charges et cash-flow affichés directement sur la Ligne (champs dérivés à l'affichage, cf. §7.3).

*(Source : [UX des formulaires de saisie par domaine](.scratch/wealth-advisor/issues/06-ux-formulaires-saisie.md), [Prototype de l'historisation des Valorisations](.scratch/wealth-advisor/issues/27-prototype-historisation-valorisations.md))*

### 5.3 Reporting

**Structure = synthèse chiffrée** :
- Deux KPI cards toujours visibles côte à côte : Patrimoine total, Patrimoine net.
- Donut de répartition par domaine.
- Tableau des domaines : valeur, part, variation, sparkline (granularité = par mise à jour réelle), indicateur clé par domaine.
- Détail par Domaine (clic sur une ligne du tableau) : courbe complète, indicateur clé, liste des Enveloppes/Lignes avec valeur et **delta individuel** (pas seulement agrégé).

*(Source : [Reporting et visualisation de l'évolution du patrimoine](.scratch/wealth-advisor/issues/07-reporting-visualisation.md))*

### 5.4 Profil & Questionnaire de risque

Écran **« Profil »**, accessible à tout moment (pas d'onboarding obligatoire), formulaire unique avec navigation ancrée : Identité & fiscalité, Situation familiale, Questionnaire de risque. Carte Questionnaire de risque avec résultat (bucket + connaissance des marchés) et bouton **« Ajuster en chat »**.

**Objectifs sortent entièrement de cet écran** — écran top-level séparé (§5.5).

*(Source : [UX du formulaire de profil et du Questionnaire de risque](.scratch/wealth-advisor/issues/08-ux-profil-questionnaire-risque.md))*

### 5.5 Objectifs

Grille de cartes. Création par **mini-assistant 3 étapes** (type → libellé/horizon → montant cible). Chaque carte affiche :
- **Avancée** (barre de progression + %) basée sur le Lien patrimoine (Patrimoine net).
- **Date d'atteinte estimée** (avance/retard vs horizon), calculée par tendance linéaire sur tout l'historique de Valorisations du périmètre lié — pas affichée si < 2 points ou tendance plate/négative (message qualitatif à la place).
- **Édition rapide** inline (horizon, montant cible, Lien patrimoine) via bouton crayon.

Carte **« Partir de modèles suggérés »** : gabarits (fonds d'urgence, retraite, achat immobilier, transmission, indépendance financière) sélectionnables en lot.

**Calculette FIRE** (pour Objectifs difficiles à chiffrer) : deux méthodes en toggle — « Règle de retrait (SWR) » (dépenses annuelles visées) et « Niveau de vie actuel » (dépenses mensuelles actuelles × 12) — même formule, source différente. **Multiplicateur fixé à 25× (règle des 4 %), non ajustable**, un seul scénario affiché. Avertissement visible : *« Objectif brut — ne tient pas compte de la fiscalité au retrait »*.

*(Source : [UX de l'écran Objectifs](.scratch/wealth-advisor/issues/09-ux-objectifs.md), [Lien Objectif ↔ patrimoine](.scratch/wealth-advisor/issues/10-lien-objectif-patrimoine.md), [Estimation de date d'atteinte](.scratch/wealth-advisor/issues/26-estimation-date-objectif.md), [Prototype calculette FIRE](.scratch/wealth-advisor/issues/12-prototype-calculette-fire.md))*

## 6. Moteur de conseil hybride

**Principe unique** : tout calcul mécanique (règle fiscale sourcée *ou* convention usuelle comme le rendement locatif) est **hardcodé** dans la couche déterministe. Le LLM ne recalcule **jamais** un chiffre — garde-fou numérique : il ne peut énoncer que des chiffres reçus de la couche déterministe.

**Incertitude fiscale** : les points signalés « à vérifier » (§8) ne sont pas exclus des calculs, mais portent un **indicateur de confiance** que le LLM restitue en langage naturel.

**Déclenchement** : à la demande dans le chat, + proactif pour les anomalies déterministes simples (§7), détecté à l'ouverture de l'app ou après mise à jour du patrimoine — pas de job périodique en tâche de fond.

**Portée du chat** : consultatif. **Seule action d'écriture possible** : override du bucket de Profil de risque.

**Persistance du conseil** : éphémère, recalculé à chaque demande depuis l'état courant. Pas d'objet domaine « Recommandation ».

**Contexte transmis à chaque demande** : patrimoine total + profil + tous les résultats déterministes pertinents — pas de scoping par domaine/Objectif (volume modeste, besoin de vision transversale).

*(Source : [Conception du moteur de conseil hybride](.scratch/wealth-advisor/issues/04-moteur-conseil-hybride.md))*

## 7. Règles de conseil déterministes, par domaine

Socle **2 à 4 règles/angles par domaine** (budget volontairement restreint). Chaque règle est calculée en dur ; le LLM ne fait qu'habiller le résultat en langage qualitatif.

### 7.1 Liquidités — 3 règles (comptes **personnels** uniquement pour A/B ; C ciblée)

- **A — Compte courant dormant** (par compte perso individuel) : seuil = 1 mois de *Dépenses mensuelles courantes* (Profil) + marge 15 %.
- **B — Fonds de précaution livret** (total agrégé livrets perso) : cible = *Mois de réserve visés* (Profil, défaut 6) × Dépenses mensuelles courantes.
- **C — Trésorerie professionnelle dormante** (Entités de type `activité de service` uniquement, pas `détention immobilière`) : seuil = **4 mois** de *Charges fixes professionnelles* (champ Entité). Provisions fiscales/sociales (TVA, URSSAF, IS/IR) **non modélisées** — hors périmètre.
- **Réserve de précaution immobilier** (hors socle ci-dessus, transverse liquidités↔immobilier) : `réserve_pour` sur une Ligne liquidités référence une Ligne immobilier ; surplus investissable = cash au-delà d'une cible ajustable, défaut **1 % de la valeur du bien/an** (curseur indicatif 0,5–3 %). Le LLM peut orienter le surplus vers des Enveloppes existantes du patrimoine.

*(Sources : [Liquidités](.scratch/wealth-advisor/issues/14-conseil-liquidites.md), [Trésorerie pro dormante](.scratch/wealth-advisor/issues/25-conseil-tresorerie-pro.md), [Réserve précaution immobilier](.scratch/wealth-advisor/issues/13-reserve-precaution-immobilier.md))*

### 7.2 Bourse — 3 règles/angles

- **Concentration excessive par Ligne** : sur le total bourse cumulé (PEA+PEA-PME+CTO), seuil **25 %**.
- **Cash dormant en Enveloppe** (Ligne « compte espèces ») : seuil **5 %** de la valeur totale de l'Enveloppe.
- **Angle fiscal PEA vs CTO** (contexte, pas anomalie à seuil) : ancienneté PEA (vs seuil 5 ans) + plus-value latente par Ligne CTO.
- *Écarté* : proximité du plafond de versement PEA (non actionnable une fois atteint).

*(Source : [Bourse](.scratch/wealth-advisor/issues/15-conseil-bourse.md))*

### 7.3 Immobilier — 3 règles/angles

- **Rentabilité anormale** (biens loués uniquement) : rendement net de charges < **3 %** et/ou cash-flow < 0 €.
- **Prêt bientôt soldé** : alerte **6 mois avant** échéance estimée — déclenche l'angle vendre/garder (rendement, cash-flow, cash-flow projeté post-prêt, plus-value latente si non-RP, ancienneté de détention). Angle aussi disponible à la demande.
- **Proximité seuil IFI** : total immobilier net (toutes Entités) vs **1 300 000 €**, résidence principale abattue de 30 % — **indicateur de confiance** (approximations : usufruit, biens pro exonérés, autres dettes, parts SCPI non comptées).

**Formules retenues** :
- Rendement brut = loyer annuel hors charges / prix d'acquisition total × 100.
- Rendement net de charges = (loyer − charges − taxe foncière − assurance − frais de gestion) / prix d'acquisition total × 100 (exclut intérêts d'emprunt et vacance locative).
- Cash-flow = loyer − charges − taxe foncière − assurance − frais de gestion − mensualité, **avant impôt**.
- Prix d'acquisition total = prix d'achat + frais de notaire + travaux initiaux.

*(Sources : [Immobilier](.scratch/wealth-advisor/issues/16-conseil-immobilier.md), [Conventions rendement locatif](.scratch/wealth-advisor/issues/21-recherche-rendement-locatif-conventions.md))*

### 7.4 Assurance-vie / PER — 3 règles

- **AV — cap des 8 ans** (par contrat) : alerte **6 mois avant**, puis note au franchissement.
- **AV — seuil des 150 000 €** de versements cumulés par assuré (tous contrats) : proactif dès qu'il reste **≤ 20 000 €**.
- **PER — plafond de déduction annuel** : champ Profil « Plafond PER annuel » (saisi directement, pas recalculé) comparé aux versements PER de l'année civile en cours ; déclenchement à **80 %** utilisé.
- Répartition fonds euro/UC : reste **qualitative** (pas de seuil sourcé).

*(Source : [Assurance-vie/PER](.scratch/wealth-advisor/issues/17-conseil-assurance-vie-per.md))*

### 7.5 Crypto & Private equity/autres — 3 règles (sur Patrimoine net total)

- **Crypto — exposition par Profil de risque** : prudent > **2 %**, équilibré > **5 %**, dynamique > **10 %** (= plafond absolu).
- **PE/SCPI — exposition plate** : seuil unique **20 %**, non modulé par profil (pas de grille sourcée — jugement de conception, ton très hedged).
- **PE/SCPI — échéance de blocage** (par Enveloppe avec `durée de blocage` renseignée) : alerte **6 mois avant** `date d'ouverture + durée`, puis note au franchissement. Enveloppe sans durée = ignorée silencieusement.

*(Sources : [Crypto & PE](.scratch/wealth-advisor/issues/18-conseil-crypto-pe.md), [Recherche limites d'exposition](.scratch/wealth-advisor/issues/22-recherche-limites-exposition-crypto-pe.md))*

## 8. Règles fiscales et légales françaises (couche déterministe)

Recensement complet sourcé dans [`assets/03-regles-fiscales-legales.md`](.scratch/wealth-advisor/assets/03-regles-fiscales-legales.md) — **370 lignes, à relire avant codage**. Points clés :

- **PEA/PEA-PME** : plafond 150 000 € / 225 000 € (global) ; clôture avant/après 5 ans (loi PACTE) ; fiscalité 12,8 % IR (<5 ans) vs exonération IR (≥5 ans).
- **CTO** : flat tax 30 %.
- **Assurance-vie** : PFL/PFU selon date de versement (avant/après 27/09/2017), abattement annuel 4 600 €/9 200 € après 8 ans, seuil 150 000 € d'encours, abattement décès 152 500 €/bénéficiaire.
- **PER** : plafond déduction 10 % des revenus (37 680 € en 2026 salariés), 6 cas de déblocage anticipé, fiscalité de sortie selon origine des versements.
- **Immobilier** : abattement durée de détention (IR exo à 22 ans, PS exo à 30 ans), IFI seuil 1 300 000 €.
- **Crypto** : art. 150 VH bis CGI, flat tax 30 %, seuil d'exonération 305 €/an.
- **PE/SCPI** : durées de blocage typiques, réduction FIP/FCPI.

⚠️ **11 points signalés incertains ou non trouvés** dans le document source, à revalider avant de coder les règles correspondantes (ex. taux PS exact PEA/crypto post-LFSS 2026, plafond chiffré PER-TNS, barème décès AV au-delà de l'abattement). La LFSS 2026 relève les PS de 17,2 % à 18,6 % — confirmé CTO, incertain PEA/crypto.

## 9. Calculette FIRE — méthodologie

Formule : **Capital cible = Dépenses annuelles × Multiplicateur**, Multiplicateur = 1 ÷ Taux de retrait. **Multiplicateur retenu et figé dans l'UI : 25× (règle des 4 %, Trinity/Bengen)**. Fiscalité française non modélisée par les études sources → objectif affiché comme **brut**, comparé à un Lien patrimoine **net** (avertissement visible dans l'UI, pas de paramètre de correction fiscale).

*(Source : [Recherche méthodologie FIRE](.scratch/wealth-advisor/issues/11-recherche-methodologie-fire.md))*

## 10. Architecture technique

| Aspect | Décision |
|---|---|
| **Exécution** | App web locale, servie sur `localhost` uniquement — pas de LAN, pas d'app desktop empaquetée. |
| **Base de données** | SQLite, en clair (pas de chiffrement au repos — machine mono-utilisateur, login OS). |
| **Langage/frameworks** | TypeScript full-stack — backend Node (Express) + frontend React (Vite). SQLite via `better-sqlite3`. |
| **Intégration LLM** | **Sous-processus CLI Claude Code** (mode print/non-interactif), authentifié via l'abonnement Claude déjà actif — **pas** de clé API Anthropic facturée séparément. Format de sortie structuré du CLI + parsing backend + mécanisme de l'override du Profil de risque sous ce mode : **à affiner en implémentation** (non trivial, cf. §12). |
| **Packaging** | Script un clic qui démarre le serveur et ouvre le navigateur — pas de service permanent au démarrage machine. |

*(Source : [Choix de la stack technique](.scratch/wealth-advisor/issues/05-stack-technique.md))*

## 11. Modèle de données — schéma relationnel (esquisse)

Traduction directe du §3/§4 en tables SQLite. Détail exact des colonnes/contraintes à affiner en implémentation, mais la forme (tables par domaine plutôt que schéma libre) est actée.

```
entities(id, libelle, type, charges_fixes_professionnelles NULL)
  -- type ∈ {personnelle, activite_service, detention_immobiliere}; ligne 'perso' non supprimable

profil(id=1, date_naissance, horizon_global, tmi, plafond_per_annuel,
       depenses_mensuelles_courantes, mois_reserve_visees DEFAULT 6,
       statut_marital, personnes_a_charge,
       risque_bucket, risque_connaissance, risque_override_manuel)

questionnaire_risque_reponses(id, question_index, reponse, date)

objectifs(id, type, libelle, horizon, montant_cible NULL,
          lien_patrimoine_type ∈ {total, domaines, entite}, lien_domaines JSON NULL, lien_entite_id NULL)

envelopes(id, entity_id FK, domaine, libelle, type, date_ouverture, statut)
  -- domaine ∈ {bourse, av_per, crypto, pe_scpi} uniquement (liquidités/immobilier: pas d'enveloppe)
envelope_bourse(envelope_id FK, type ∈ {PEA, PEA-PME, CTO})
envelope_av_per(envelope_id FK, type ∈ {assurance_vie, per})
envelope_crypto(envelope_id FK, plateforme_etrangere BOOL, prix_acquisition_cumule)
envelope_pe_scpi(envelope_id FK, type_dispositif ∈ {FCPR,FIP,FCPI,SCPI}, duree_blocage)

lines(id, entity_id FK, domaine, envelope_id FK NULL, libelle, valeur_actuelle,
      date_derniere_valorisation, note)
line_liquidites(line_id FK, type_compte, plafond, taux, banque, reserve_pour_line_id FK NULL)
line_immobilier(line_id FK, prix_acquisition_total, date_acquisition,
                residence_principale BOOL, regime_location)
line_bourse(line_id FK, nom_isin NULL, quantite NULL, pru NULL, est_compte_especes BOOL DEFAULT false)
line_av_per(line_id FK, nom_support, type_support ∈ {fonds_euro, uc})
line_crypto(line_id FK, symbole, quantite)
line_pe_scpi(line_id FK, nombre_parts)

mouvements(id, line_id FK NULL, envelope_id FK NULL, type, date, montant NULL,
           quantite NULL, prix_unitaire NULL, deductible BOOL NULL)

valorisations(id, line_id FK, date, valeur)
valorisation_immobilier(valorisation_id FK, capital_restant_du, loyer, charges,
                         taxe_fonciere, assurance, frais_gestion, mensualite)
```

## 12. Zones d'incertitude à traiter en implémentation

Ces points sont **explicitement reportés** par les tickets sources — ne pas les considérer comme des oublis :

1. **Mécanisme exact de l'override du Profil de risque via le CLI Claude Code** — format de sortie structuré, parsing/validation backend (ticket 05).
2. **11 points fiscaux incertains** du recensement §8 — à revalider avant de coder les règles correspondantes.
3. **Rattachement des comptes SARL/SCI déjà identifiés** aux nouvelles Entités `pro_1`/`sci_1` — détail de migration, pas une décision de modélisation (ticket 28).

## 13. Hors périmètre de cet effort

- Agrégation bancaire automatique (API tierce type Bridge/Powens).
- Produit multi-utilisateurs/partagé.
- Conseil en investissement réglementé (statut CIF/AMF).

## 14. Fog — pistes non cadrées (hors scope immédiat, dans le scope de l'effort)

- Comptes dédiés aux enfants (statut vs Perso/Pro, rattachement Objectif, inclusion dans le Patrimoine net).
- Autres nudges de finance personnelle au-delà des règles déjà cadrées.
- Valorisation automatisée/temps réel (API tierces cours de bourse, estimation immobilière).
- Maintenance annuelle des paramètres fiscaux (seuils/taux qui évoluent chaque année) — comment ils sont stockés/mis à jour sans re-rechercher tout le recensement.
- Notifications/rappels périodiques pour inciter à la mise à jour du patrimoine.

## Annexe — index des tickets sources

Voir [`.scratch/wealth-advisor/map.md`](.scratch/wealth-advisor/map.md) pour la carte complète et [`.scratch/wealth-advisor/issues/`](.scratch/wealth-advisor/issues/) pour le détail intégral de chaque décision (29 tickets, tous résolus).
