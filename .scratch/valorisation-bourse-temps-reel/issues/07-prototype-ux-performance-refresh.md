# Prototype UI — colonnes de performance et bouton refresh sur le dashboard Bourse

Type: prototype
Status: resolved
Claimed-by: session_013yZgqVv9UEGzjsxyB8dDE8

## Question

Concevoir l'affichage de la performance par Ligne et par Enveloppe sur `BourseDashboard.tsx`, et l'emplacement/comportement du bouton refresh global, en s'inspirant de la capture de référence fournie par l'utilisateur (colonnes quantité, prix de revient, cours actuel, valorisation, plus-value €, plus-value %) tout en respectant ce qui est hors périmètre (pas de variation journalière) et le principe « un seul écran, déduit » déjà retenu pour le dashboard Bourse dans l'effort parent ([UX des formulaires de saisie par domaine](../../wealth-advisor/issues/06-ux-formulaires-saisie.md)).

À couvrir :
- Emplacement et libellé du bouton refresh global (« en haut » du dashboard Bourse).
- État de chargement pendant le refresh (potentiellement plusieurs appels réseau séquentiels/parallèles selon le nombre de Lignes).
- Affichage du résultat par Ligne après refresh : succès (nouveau cours, plus-value mise à jour) vs échec silencieux (ISIN non renseigné) vs échec signalé (ISIN non trouvé/non convertible) — cf. fog « Comportement du refresh en cas d'échec partiel » sur la [carte](../map.md).
- Colonnes/valeurs ajoutées par Ligne titre : ISIN, coût d'acquisition, cours actuel, plus-value €, plus-value % — en cohérence avec les libellés déjà utilisés dans l'app (`euros()` de `format.ts`).
- Ligne d'agrégat par Enveloppe (plus-value €/% à côté de `valeur_totale`).

Ce ticket peut avancer en parallèle de [Modèle de données — ISIN, coût d'acquisition, contrat de l'endpoint refresh](06-modele-donnees-refresh.md) (design visuel indépendant des noms de colonnes exacts), à réconcilier avec le schéma final une fois les deux résolus.

## Réponse

**Variante retenue : A — colonnes inline**, avec deux amendements décidés en réaction au prototype :

- **Colonnes par Ligne titre** (dans cet ordre, reprenant l'ordre du relevé de courtier fourni en référence) : Titre · **Qté** · ISIN · Coût d'acquisition · Cours · **Valorisation** · Plus-value € · Plus-value % · chevron disclosure. Qté est une colonne à part entière (pas dans le sous-titre sous le nom, comme testé initialement) ; Valorisation (= `valeur_actuelle`, déjà affichée ailleurs dans l'app) a été ajoutée — la première itération du prototype l'avait omise par erreur alors que c'est l'information la plus consultée.
- **Agrégat par Enveloppe** : plus-value €/% à côté de `valeur_totale` sur la ligne d'en-tête de l'Enveloppe, conservé tel que prototypé.
- **Bouton refresh — emplacement** : décision structurante, amendée en session — le bouton **« Actualiser les cours » ne vit pas dans `BourseDashboard.tsx`** (ni dans sa carte, ni dans son `dash-toolbar` local) mais **au niveau du dashboard global** (rendu par `App.tsx`, au-dessus du rail de Domaines, donc visible quel que soit le Domaine actif). Il est **conditionné au Domaine sélectionné** : chaque Dashboard de Domaine peut « enregistrer » une action de rafraîchissement auprès du shell de l'app (mécanisme générique) ; pour l'instant seul Bourse l'utilise. Les autres Domaines (Crypto compris) n'ont pas encore d'action de ce type — cohérent avec le hors-périmètre acté sur la [carte](../map.md) (Crypto : effort futur séparé). Prototype de ce mécanisme : `App.tsx` détient un état `domainAction` que le Dashboard de Domaine actif peuple via un callback ; le Dashboard le nettoie à son démontage (changement de Domaine ⇒ bouton disparaît automatiquement).
- **État de chargement** : rafraîchissement séquentiel (une Ligne à la fois, pas de parallélisation agressive vis-à-vis de la source Yahoo — cohérent avec le [ticket 06](06-modele-donnees-refresh.md)), bouton global désactivé + libellé "Actualisation… x/y" pendant le refresh ; un spinner inline apparaît en colonne Cours sur la Ligne en cours de traitement.
- **Affichage du résultat par Ligne** : succès -> Cours/Valorisation/PV € /PV % se remplissent, coloration verte/rouge (`--good`/`--bad`) selon le signe ; échec silencieux (ISIN non renseigné) -> colonne ISIN affiche "non saisi" en italique, aucune tentative de refresh, reste à "—" ; échec signalé (ISIN non trouvé/non convertible/source indisponible) -> icône ⚠ dans la colonne Cours avec la raison en tooltip.

**Assets** : prototype construit directement sur la vraie route `BourseDashboard.tsx` (sous-forme A, cf. skill `/prototype`), variantes switchables via `?perfProto=A|B|C` (bar flottante bas d'écran, masquée en prod). Code dans `web/src/components/BourseDashboard.prototype-performance.tsx` (les 3 variantes + le mock de refresh) et `web/src/components/PrototypeSwitcher.tsx` (switcher générique), avec le point d'ancrage dans `web/src/components/BourseDashboard.tsx` et `web/src/App.tsx`. **Encore non commité** au moment de la résolution de ce ticket — assis dans l'arbre de travail à côté d'autres modifications non liées en cours (formulaires d'édition Enveloppe/Ligne) ; à ne pas confondre avec du code produit, et à isoler proprement (branche `prototype/...`) avant tout nettoyage de l'arbre de travail.
