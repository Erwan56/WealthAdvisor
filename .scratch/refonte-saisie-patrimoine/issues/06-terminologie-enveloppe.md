# Terminologie Enveloppe — cohérence à travers les domaines

Type: grilling
Status: resolved
Claimed-by: session_01PWX6UxecxKh82ZdKTMGDmL

## Question

"Enveloppe" (le contenant PEA/PEA-PME/CTO, contrat assurance-vie, contrat PER, fonds PE/SCPI, portefeuille crypto par plateforme) est perçu comme un terme artificiel par l'utilisateur, qui l'assimile spontanément à "compte-titres ou PEA". Le terme est partagé à travers 4 des 6 Domaines (Bourse, Assurance-vie/PER, Crypto, PE/SCPI) dans `../../wealth-advisor/CONTEXT.md` et `PRD.md`.

Trancher : garde-t-on "Enveloppe" comme terme générique transverse (et on améliore alors son explication/affichage dans l'UI, ex. libellé contextuel par Domaine tout en gardant le terme technique), ou bascule-t-on vers un terme plus concret par Domaine (ex. "Compte" pour Bourse) au risque de perdre la cohérence transverse dans `PRD.md` et le moteur de conseil qui raisonnent aujourd'hui par "Enveloppe" générique ?

## Réponse

Faits vérifiés en code avant de trancher : 3 des 4 Domaines concernés ont **déjà** basculé vers un nom concret dans leur UI — Assurance-vie/PER dit "contrat" (`CreateEnveloppeAvPerModal.tsx:75`), Crypto dit "portefeuille" (`CreateEnveloppeCryptoModal.tsx:82`), PE/SCPI dit "fonds" (`CreateEnveloppePeScpiModal.tsx:76`). Seul Bourse dit encore littéralement "Enveloppe" dans son UI (titre de modale, libellés, toasts — `BourseDashboard.tsx`, `CreateEnveloppeBourseModal.tsx`, `EditEnveloppeBourseModal.tsx`). `PRD.md` (30 occurrences) et le moteur de conseil (`server/src/advice/rules/*.ts`, types `BourseEnvelopeRow`/`AvPerEnvelopeRow`/`PeScpiEnvelopeRow`, table `envelopes`) utilisent "Enveloppe" comme clé de regroupement transverse — mais ce terme fuit aussi dans des messages de conseil affichés à l'utilisateur (`rules/bourse.ts:51,87`, `rules/cryptoPe.ts:80`, `rules/liquidites.ts:48,77,129`).

Décisions :
1. **Bourse s'aligne sur le pattern des 3 autres Domaines** : bascule vers "Compte" en UI (ex. "Nouveau compte — Bourse", "Libellé du compte"), le terme spontané de l'utilisateur — complète le pattern plutôt que d'en faire une exception.
2. **"Enveloppe" reste le terme interne/technique transverse** (glossaire `CONTEXT.md`, `PRD.md`, noms de composants/tables en base, types du moteur de conseil) — utile pour raisonner "le contenant, quel que soit le Domaine" sans répéter contrat/portefeuille/fonds/compte à chaque fois. Règle : ce terme ne doit plus jamais apparaître dans une chaîne lue par l'utilisateur.
3. **Fuites du moteur de conseil corrigées, avec deux traitements différents** :
   - `rules/bourse.ts:51,87` : renommer "Enveloppe" → "Compte" (cohérent avec la décision 1, un seul Domaine concerné).
   - `rules/cryptoPe.ts:80` : règle partagée entre Crypto et PE/SCPI — message rendu **dépendant du Domaine** qui déclenche l'alerte ("portefeuille" pour Crypto, "fonds" pour PE/SCPI), la règle sachant déjà quel Domaine l'a déclenchée.
   - `rules/liquidites.ts:48,77,129` : référence réellement transverse (cash dormant redirigeable vers n'importe quel contenant existant, tous Domaines confondus) — pas de nom de Domaine unique à substituer, donc les contenants sont **énumérés explicitement** ("...vers un livret, un compte-titres, un contrat, un portefeuille ou un fonds existant") plutôt que d'inventer un cinquième synonyme jamais vu ailleurs dans l'UI.
4. **`CONTEXT.md` et `PRD.md`** : le glossaire garde "Enveloppe" comme terme transverse, mais gagne une clarification — le terme n'est jamais montré à l'utilisateur, chaque Domaine a son propre nom d'écran (Compte pour Bourse, contrat pour AV/PER, portefeuille pour Crypto, fonds pour PE/SCPI).

Non affecté : le `_Avoid_: Compte (au sens générique)` déjà présent sur l'entrée Enveloppe de `CONTEXT.md` reste valide — il portait sur l'usage de "Compte" comme terme *générique* transverse, pas sur son usage comme libellé *spécifique* au Domaine Bourse (deux rôles distincts, pas de contradiction).
