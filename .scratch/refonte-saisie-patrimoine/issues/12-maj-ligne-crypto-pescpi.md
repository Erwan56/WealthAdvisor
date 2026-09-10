# Mise à jour d'une Ligne Crypto/PE-SCPI — aligner sur la décision Bourse

Type: grilling
Status: resolved
Claimed-by: session_01PWX6UxecxKh82ZdKTMGDmL
Blocked-by: [Mise à jour d'une Ligne Bourse existante — rôle du Mouvement vs quantité totale](09-maj-ligne-bourse.md)

## Question

L'audit [Audit Mouvement/journal — Assurance-vie/PER, Crypto, Private equity/SCPI](11-audit-mouvement-autres-domaines.md) confirme que Crypto et Private equity/SCPI reproduisent exactement le défaut Bourse : le mouvement achat/vente (ou souscription/rachat) saisi dans "Associer un mouvement" (`EnveloppeLigneJournal.tsx`) est stocké dans `mouvements` mais n'a aucun effet sur la quantité/le nombre de parts réellement détenu — seul un champ séparé (`quantite` pour Crypto, `nombre_parts` pour PE/SCPI, dans les modals d'édition dédiés) le fait. Aucune règle de conseil n'en dépend dans ces deux Domaines.

Une fois la décision prise sur [Mise à jour d'une Ligne Bourse existante](09-maj-ligne-bourse.md) (suppression du mouvement au profit du seul champ "quantité totale", ou l'inverse), appliquer la même décision à Crypto et PE/SCPI — en confirmant qu'aucune spécificité de ces deux Domaines (ex. `nombre_parts` PE/SCPI n'a pas de "prix unitaire" de marché au sens où Bourse/Crypto l'entendent) ne justifie un traitement différent.

## Réponse

Suppression identique dans les deux Domaines : "Associer un mouvement" (achat/vente Crypto, souscription/rachat PE/SCPI) — la sous-section `mouvementKind='quantite_prix'` du journal partagé `EnveloppeLigneJournal.tsx` — disparaît purement du flux de saisie, même traitement que Bourse (ticket 09). Vérifié en code : ni `EditLigneCryptoModal.tsx` (champ "Quantité" seul) ni `EditLigneScpiModal.tsx` (champ "Nombre de parts" seul) ne portent de notion de prix/coût unitaire — l'inquiétude d'une spécificité PE/SCPI évoquée dans la question ne se vérifie pas ; même défaut, même traitement des deux côtés. Le mouvement stocké côté serveur (`server/src/routes/crypto.ts:350-354`, même schéma `peScpi.ts`) n'était de toute façon jamais relu, y compris pour affichage dans le journal (le timeline n'expose que les entrées de Valorisation, jamais le mouvement associé).

La Valorisation réelle (date + valeur, appliquée à `valeur_actuelle`) portée par le même composant n'est pas concernée par cette décision — contrairement à Bourse (valeur dérivée de quantité × cours/coût), c'est le mécanisme réel de suivi de la valeur pour Crypto/PE-SCPI, pas une décoration.

Glossaire `CONTEXT.md` mis à jour (entrée Mouvement) : Crypto/PE-SCPI rejoignent Liquidités et Bourse dans la liste des Domaines où le Mouvement n'existe plus, l'exemple "prix unitaire d'un achat crypto" retiré (obsolète), seul Assurance-vie/PER reste en usage réel, en discussion sur le ticket [Rôle du Mouvement "versement" — Assurance-vie/PER](13-mouvement-versement-avper.md).
