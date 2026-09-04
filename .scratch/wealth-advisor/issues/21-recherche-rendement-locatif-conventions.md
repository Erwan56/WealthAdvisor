# Recherche : conventions de calcul du rendement locatif et du cash-flow

Type: research
Status: closed
Blocked by: 03 (closed — unblocked)

## Question

Pour alimenter [Logique de conseil et anomalies — Immobilier](16-conseil-immobilier.md) : quelles sont les formules usuelles de calcul du rendement locatif et du cash-flow d'un investissement locatif, à partir des champs déjà modélisés (prix d'acquisition, loyer, charges, taxe foncière, assurance, frais de gestion, mensualité, capital restant dû — voir [Modèle de données du patrimoine par domaine](01-modele-patrimoine.md)) ?

À rechercher :
- Rendement brut (loyer annuel / prix d'acquisition) — formule usuelle, sert de repère rapide.
- Rendement net de charges (loyer − charges − taxe foncière − assurance − frais de gestion, rapporté au prix d'acquisition) — formule usuelle.
- Cash-flow mensuel/annuel après remboursement de prêt (loyer − charges − mensualité) — convention de présentation usuelle (avant/après impôt).
- Éventuel rendement net-net (après fiscalité) — pertinent seulement si une convention simple et largement admise existe ; sinon écarter (cohérent avec l'incertitude fiscale déjà actée au ticket 03).
- Sources : littérature d'investissement locatif grand public.

Capturer les formules et sources dans `assets/21-recherche-rendement-locatif-conventions.md`.

## Answer

Recensement sourcé (5 sources : investissement-locatif.com, trackstone.fr, Empruntis, Meilleurtaux.be, MAIF) dans [`assets/21-recherche-rendement-locatif-conventions.md`](../assets/21-recherche-rendement-locatif-conventions.md).

Formules retenues pour le moteur déterministe :
- **Rendement brut** = loyer annuel (hors charges récupérables) / prix d'acquisition total (le champ déjà modélisé), × 100.
- **Rendement net de charges** = (loyer − charges − taxe foncière − assurance − frais de gestion) / prix d'acquisition total, × 100 — exclut explicitement intérêts d'emprunt/mensualité (consensus majoritaire) et vacance locative (consensus).
- **Cash-flow** = loyer − charges − taxe foncière − assurance − frais de gestion − mensualité de prêt, présenté **avant impôt** (« cash-flow net » dans la convention à trois étages brut/net/net-net identifiée chez investissement-locatif.com).

Écarté : **rendement net-net / cash-flow net-net (après impôt)** — aucune convention simple et consensuelle trouvée (la seule formule chiffrée, chez Empruntis, renvoie à un calcul fiscal individuel non standardisé) ; confirme la décision déjà actée de ne pas modéliser finement la fiscalité immobilière ([Règles fiscales et légales françaises par domaine](03-regles-fiscales-legales.md)).

Point ouvert non tranché par la littérature (à trancher côté produit, pas de blocage) : le dénominateur « prix d'acquisition » inclut-il frais de notaire/travaux initiaux ou seulement le prix d'achat nu — une seule source tranche explicitement (pour l'inclusion). Recommandation : documenter le choix retenu dans l'aide contextuelle de l'app plutôt que d'ouvrir un nouveau ticket, puisque le champ produit "prix d'acquisition total" est déjà nommé pour couvrir ce cas.
