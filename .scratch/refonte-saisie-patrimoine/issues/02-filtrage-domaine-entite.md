# Filtrage Domaine × type d'Entité

Type: grilling
Status: resolved
Claimed-by: session_01PWX6UxecxKh82ZdKTMGDmL

## Question

Reformulée après résolution de [Modèle Entité — attribut par Ligne vs conteneur hiérarchique](01-modele-entite.md) : les Dashboards par Domaine n'ont plus d'onglet par Entité ni de notion d'"Entité courante" — une seule vue agrégée "Toutes les Entités" par Domaine. La question initiale ("masquer un Domaine dès qu'il n'a aucune Ligne pour l'Entité courante") n'a donc plus de sens telle quelle.

`DomainRail.tsx` liste aujourd'hui les 6 Domaines sans aucune condition : un Domaine sans Ligne apparaît juste vide (ex. le rail Crypto reste visible même si aucune Entité n'y détient jamais rien). L'utilisateur trouve ça confus.

Trancher, dans ce nouveau cadre sans sélection d'Entité : veut-on masquer un Domaine du rail dès qu'**aucune** Entité (toutes confondues) n'y a jamais eu de Ligne (règle purement globale, entité-agnostique), ou garder les 6 Domaines toujours visibles (le vide lui-même étant l'information : "tu n'as encore rien ici") ?

## Réponse

Les 6 Domaines restent **toujours visibles** dans `DomainRail.tsx` — aucun masquage, même pour un Domaine sans aucune Ligne (Entités confondues). Avec la suppression des onglets par Entité (ticket 01), il n'existe plus de notion d'"Entité courante" créant une ambiguïté contextuelle sur le vide : un Domaine vide l'est sans ambiguïté, et ce vide est lui-même l'information ("tu n'as encore rien ici"). Ça évite aussi d'avoir à inventer un mécanisme de ré-affichage pour créer la toute première Ligne d'un Domaine qui serait masqué.

Fait vérifié en base (`server/data/wealth-advisor.db`) : 3 des 6 Domaines sont aujourd'hui réellement vides (Assurance-vie/PER, Crypto, PE/SCPI n'ont aucune Ligne), Bourse/Immobilier/Liquidités en ont — ce n'est pas hypothétique. Précédent noté mais non retenu comme argument : la légende du donut Reporting (`ReportingDashboard.tsx:75-76`) filtre déjà les Domaines à `valeur > 0`, mais ce filtre reste local à cette légende, pas étendu au rail de navigation ni au tableau récapitulatif.

Aucun changement de code nécessaire pour ce ticket au-delà de la confirmation du comportement actuel — pas de nouvelle donnée de comptage/emptiness à exposer côté API.
