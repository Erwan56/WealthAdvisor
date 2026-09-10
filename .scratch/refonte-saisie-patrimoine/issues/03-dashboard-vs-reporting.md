# Dashboard vs Reporting — clarifier le libellé et la découvrabilité

Type: grilling
Status: resolved
Claimed-by: session_01PWX6UxecxKh82ZdKTMGDmL

## Question

`App.tsx:20-28` place "Dashboard" et "Reporting" comme deux écrans de navigation au même niveau. En pratique ils sont déjà cohérents fonctionnellement : les Dashboards par Domaine portent tout le CRUD (+Ajouter, journal, édition), `ReportingDashboard.tsx`/`ReportingDomainDetail.tsx` sont purement lecture seule (KPIs, donut, tableau, drilldown par Domaine). Mais rien dans les libellés ou l'agencement de navigation ne communique cette distinction, d'où la confusion de l'utilisateur ("dashboard = saisie, reporting = synthèse" — deviné, pas confirmé par l'UI).

Trancher les libellés/l'agencement de navigation qui rendraient la distinction évidente sans changer la fonction actuelle de chaque écran (ex. renommer "Dashboard" en "Domaines"/"Saisie", ajouter un sous-titre explicite, regrouper visuellement les deux entrées de nav pour montrer qu'elles regardent le même patrimoine sous deux angles).

## Réponse

Trois décisions, la fonction de chaque écran restant inchangée :

1. **Renommer "Dashboard" en "Domaines"** (`App.tsx:23`) : reprend le nom déjà utilisé un niveau plus bas (`DomainRail.tsx`), donc le libellé de nav reste cohérent avec la navigation qu'on trouve juste en dessous, sans présupposer que l'utilisateur sache déjà que "saisie" est la fonction de l'écran.
2. **Garder "Reporting" tel quel** : la confusion rapportée portait sur la *paire* de libellés, pas sur "Reporting" isolément — une fois "Dashboard" renommé en "Domaines", "Reporting" se lit déjà sans ambiguïté comme "vue de synthèse en lecture seule".
3. **Ajouter un sous-titre explicite sous le titre de chaque écran** : "Domaines — saisie et suivi du patrimoine" pour l'écran de saisie, et garder/renforcer le sous-titre déjà présent côté Reporting (`ReportingDashboard.tsx:37,42`, ex. "Reporting — vue d'ensemble en lecture seule"). Coût quasi nul, lève toute ambiguïté dès l'arrivée sur l'écran sans dépendre du libellé de nav seul.

Explicitement écarté : regrouper visuellement les deux entrées de nav (séparateur, sous-groupe partagé) pour signaler qu'elles regardent le même patrimoine sous deux angles — pas retenu, chrome visuel supplémentaire pour un gain marginal une fois le libellé + sous-titre en place, sur une appli mono-utilisateur.

Pas de changement de vocabulaire domaine (Entité/Enveloppe/Ligne/Mouvement/Domaine) : "Dashboard"/"Domaines" est un libellé de navigation UI, pas un terme du glossaire `CONTEXT.md` — aucune mise à jour de `CONTEXT.md` nécessaire pour ce ticket.
