# Mise à jour d'une Ligne Bourse existante — rôle du Mouvement vs quantité totale

Type: grilling
Status: resolved

## Question

`BourseLigneJournal.tsx:16-28,117-163` propose un "Associer un mouvement" (achat/vente, quantité + prix unitaire) sur la mise à jour d'une Ligne. Confirmé côté serveur (`server/src/routes/bourse.ts:418-428`) : ce mouvement est stocké dans la table `mouvements` mais n'a **aucun effet** sur `line_bourse.quantite` — la quantité détenue ne se met à jour que via un champ séparé "quantité" direct dans `EditLigneBourseModal` (route ligne 348-349), complètement déconnecté du mouvement saisi juste à côté. Aucune règle de conseil (`server/src/advice/rules/bourse.ts`, 0 résultat en recherche) ne dépend du Mouvement Bourse aujourd'hui.

L'utilisateur pense qu'on ne devrait avoir besoin que de fixer la nouvelle quantité totale détenue (déduite de ses achats/ventes réels, pas ressaisie comme un mouvement séparé).

Trancher : supprime-t-on le mouvement achat/vente de ce flux au profit du seul champ "quantité totale" (cohérent avec la décision Liquidités, voir [Formulaire Liquidités](04-formulaire-liquidites.md)), ou lui donne-t-on enfin un rôle réel — dériver automatiquement la quantité (et recalculer le coût d'acquisition moyen pondéré) à partir des mouvements saisis, utile si on veut un jour suivre le plafond de versement PEA comme `../../wealth-advisor/CONTEXT.md` l'affirme sans que ce soit implémenté ?

## Réponse

Faits vérifiés en code avant tranchage : aucune règle de conseil (`server/src/advice/rules/bourse.ts`) ne lit la table `mouvements` pour Bourse — le PRU (`cout_acquisition_unitaire`) alimentant la Plus-value latente (CTO et dashboard global, `server/src/routes/reporting.ts:39-46`) est un champ purement manuel, déjà mandaté par le ticket [Formulaire +titre Bourse](08-formulaire-titre-bourse.md), jamais dérivé des Mouvements. Par ailleurs le suivi du plafond de versement PEA n'est pas une simple aspiration non implémentée : il a été **explicitement évalué et écarté** dans un effort précédent (voir [Logique de conseil et anomalies — Bourse](../../wealth-advisor/issues/15-conseil-bourse.md), "Écarté explicitement" — l'utilisateur juge l'anomalie non utile, son propre plafond PEA étant déjà atteint sans action possible une fois franchi).

Décisions :

1. **Suppression pure de "Associer un mouvement"** dans le flux Bourse (`BourseLigneJournal.tsx:16-28,117-163`), exactement comme pour Liquidités (ticket 04) — plus de saisie achat/vente décorative dans le journal ; le mouvement inséré aujourd'hui (`server/src/routes/bourse.ts:418-428`) n'est lu nulle part.
2. **Quantité et coût d'acquisition unitaire restent deux champs manuels indépendants**, édités via `EditLigneBourseModal` comme aujourd'hui — pas de formulaire "achat" combiné qui recalculerait automatiquement le PRU moyen pondéré : confirmé par l'utilisateur qu'il ne recalcule pas le coût unitaire lors d'un renforcement en pratique (la Plus-value latente affichée reste une approximation assumée après un renforcement, comme c'est déjà implicitement le cas aujourd'hui).
3. **Le suivi du plafond de versement PEA reste hors périmètre** de cette refonte — déjà écarté par une décision antérieure, pas une piste ouverte. Le glossaire `../../wealth-advisor/CONTEXT.md` est corrigé pour ne plus laisser croire que c'est une aspiration en attente d'implémentation.

Conséquence sur le ticket bloqué [Mise à jour d'une Ligne Crypto/PE-SCPI](12-maj-ligne-crypto-pescpi.md) : applique la même décision (suppression pure du mouvement décoratif, quantité/nombre de parts en champ manuel séparé) — aucune spécificité Crypto/PE-SCPI relevée dans l'audit qui justifierait un traitement différent, mais reste à confirmer explicitement sur ce ticket.
