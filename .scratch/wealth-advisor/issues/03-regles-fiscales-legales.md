# Règles fiscales et légales françaises par domaine

Type: research
Status: resolved

## Question

Recenser, par domaine, les règles et paramètres déterministes nécessaires au moteur de conseil hybride, avec sources :

- **Bourse** : plafond de versement PEA, règles de sortie/clôture anticipée, fiscalité PEA vs CTO (flat tax, prélèvements sociaux).
- **Assurance-vie** : fiscalité selon ancienneté du contrat (avant/après 8 ans), abattements annuels, régime en cas de rachat.
- **PER** : déductibilité des versements, conditions de sortie (rente/capital), fiscalité à la sortie.
- **Immobilier** : méthode de calcul du rendement locatif brut/net et du cash-flow (loyers, charges, mensualité de prêt, taxe foncière), fiscalité des plus-values immobilières (résidence principale vs locatif, abattements pour durée de détention), seuil et calcul de l'IFI.
- **Crypto** : régime fiscal (flat tax, distinction occasionnel/habituel), déclaration.
- **Private equity / autres (FCPR, FIP, SCPI...)** : durée de blocage typique, avantages fiscaux éventuels, contraintes de liquidité.

Produire un document structuré (un fichier par domaine ou une section par domaine) avec les valeurs/seuils actuels et leurs sources, à lier depuis ce ticket.

## Answer

Recensement complet livré dans [`assets/03-regles-fiscales-legales.md`](../assets/03-regles-fiscales-legales.md) (370 lignes, sources primaires citées par affirmation : service-public.fr, impots.gouv.fr, legifrance.gouv.fr, AMF, URSSAF).

Domaines couverts, avec les points clés :

- **Bourse (PEA vs CTO)** : plafond PEA 150 000€ / PEA-PME 225 000€ (plafond global), règles de clôture avant/après 5 ans (loi PACTE), fiscalité PEA (12,8% IR avant 5 ans, exonération d'IR après) vs flat tax 30% en CTO.
- **Assurance-vie** : PFL/PFU selon date des versements (avant/après le 27/09/2017), abattements annuels 4 600€ (seul) / 9 200€ (couple) après 8 ans, seuil des 150 000€ d'encours, abattement décès de 152 500€ par bénéficiaire.
- **PER** : plafonds de déduction (10% des revenus, plafonné à 37 680€ en 2026 pour les salariés ; plafond spécifique TNS), 6 cas de déblocage anticipé, fiscalité de sortie selon origine des versements (déduits ou non à l'entrée).
- **Immobilier** : abattement pour durée de détention (IR : 6%/an → exonération totale à 22 ans ; prélèvements sociaux → exonération à 30 ans), seuil IFI à 1 300 000€ et barème par tranches.
- **Crypto-actifs** : art. 150 VH bis CGI, flat tax 30% (cession occasionnelle) vs régime BIC (habituel), seuil d'exonération annuel de 305€, formulaires déclaratifs 2086 et 3916-bis.
- **Private equity / SCPI** : durées de blocage typiques, réduction d'impôt FIP/FCPI (taux et plafonds), fiscalité des revenus SCPI.

**Point de vigilance signalé dans le document** : la LFSS 2026 relève les prélèvements sociaux sur revenus du capital de 17,2% à 18,6% (CSG 9,2%→10,6%) — confirmé pour le CTO, mais l'application au PEA et aux crypto reste incertaine faute de source primaire explicite au moment de la recherche.

**11 points signalés comme incertains ou non trouvés**, listés en fin de fichier — à revalider avant de coder ces règles dans le moteur de conseil (ex. taux PS exact PEA/crypto en 2026, plafond chiffré PER-TNS, barème au-delà de l'abattement décès assurance-vie, conventions de calcul rendement locatif/cash-flow — pas de source légale, ce sont des formules d'usage).
