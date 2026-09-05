// Référentiel fiscal et légal français — couche déterministe (PRD §8).
//
// Traduction directe de .scratch/wealth-advisor/assets/03-regles-fiscales-legales.md
// (état du droit au 02-03/09/2026, post-LFSS 2026). Chaque valeur porte un niveau de
// confiance : `fiable` = citation littérale d'une source primaire ; `a_verifier` = déduite
// par recoupement ou non confirmée nommément dans une source primaire pour ce cas précis.
// Le moteur de conseil ne bloque jamais un calcul faute de certitude (PRD §6) — il propage
// `a_verifier` jusqu'au Finding, à charge pour le LLM (ticket 4) de le restituer en réserve.
//
// Les 11 points signalés « à vérifier » dans le recensement source sont repris ici avec
// la valeur adoptée (meilleure estimation disponible) — voir commentaire `Point N/11`.

export type Confiance = 'fiable' | 'a_verifier';

export interface FiscalValue<T> {
  valeur: T;
  confiance: Confiance;
  source: string;
}

function fiable<T>(valeur: T, source: string): FiscalValue<T> {
  return { valeur, confiance: 'fiable', source };
}

function aVerifier<T>(valeur: T, source: string): FiscalValue<T> {
  return { valeur, confiance: 'a_verifier', source };
}

export const FISCAL = {
  bourse: {
    peaPlafondVersement: fiable(150_000, 'service-public.fr F2385 — plafond PEA classique'),
    peaPmePlafondGlobal: fiable(225_000, 'service-public.fr F2385 — plafond global PEA+PEA-PME'),
    peaDureeExonerationIrAns: fiable(5, 'service-public.fr F2385 — exonération IR après 5 ans (loi PACTE)'),
    peaTauxIrAvant5Ans: fiable(0.128, 'service-public.fr F2385 — IR forfaitaire avant 5 ans'),
    // Point 1/11 : hausse LFSS 2026 (17,2 % → 18,6 %) non confirmée nommément pour le PEA.
    peaPsTaux: aVerifier(0.186, 'Point 1/11 — application au PEA non confirmée par une source primaire nommant le PEA'),
    ctoTauxIr: fiable(0.128, 'impots.gouv.fr — cessions mobilières, PFU'),
    ctoPsTaux: fiable(0.186, 'impots.gouv.fr — cessions mobilières, LFSS 2026, cessions depuis 01/01/2025'),
    ctoFlatTaxGlobal: fiable(0.314, 'impots.gouv.fr — cessions mobilières, PFU global 12,8 % + 18,6 %'),
  },
  av: {
    dureeCapAns: fiable(8, 'impots.gouv.fr — imposition des produits AV'),
    seuilVersementsAssure: fiable(150_000, 'impots.gouv.fr / BOFiP BOI-RPPM-RCM-20-10-20-50 — seuil apprécié par assuré'),
    abattementAnnuelSeul: fiable(4_600, 'impots.gouv.fr — abattement annuel rachat AV > 8 ans, personne seule'),
    abattementAnnuelCouple: fiable(9_200, 'impots.gouv.fr — abattement annuel rachat AV > 8 ans, couple'),
    psTaux: fiable(0.172, 'impots.gouv.fr — produits AV explicitement exceptés de la hausse LFSS 2026'),
    tauxReduitApres8Ans: fiable(0.075, 'impots.gouv.fr — PFU part IR, encours ≤ 150k€, contrat ≥ 8 ans'),
    tauxPleinApres8AnsAuDela: fiable(0.128, 'impots.gouv.fr — PFU part IR, encours > 150k€ ou contrat < 8 ans'),
    // Point 4/11 : barème du prélèvement au-delà de l'abattement décès non confirmé en source primaire grand public.
    abattementDecesParBeneficiaire: aVerifier(152_500, 'Point 4/11 — BOFiP BOI-TCAS-AUT-60, art. 990 I CGI'),
  },
  per: {
    plafondSalarie2026Max: fiable(37_680, 'service-public.fr F14709 — 10 % revenus 2025, plafond 8×PASS'),
    plafondSalarie2026Min: fiable(4_710, 'service-public.fr F14709 — plancher 10 % PASS 2025'),
    ageLimiteDeductibiliteAns: fiable(70, 'service-public.fr F14709 — versements après 70 ans non déductibles depuis 2026'),
    reportPlafondsAnsAvant2026: fiable(3, 'service-public.fr F14709 — report jusqu’aux versements 2025'),
    reportPlafondsAnsDepuis2026: fiable(5, 'service-public.fr F14709 — report étendu à partir des versements 2026'),
    // Formule TNS (référence uniquement — la règle PER du moteur utilise le champ Profil
    // « Plafond PER annuel » saisi par l'utilisateur, pas cette formule, cf. issue 17).
    tnsTauxBase: fiable(0.10, 'BOFiP BOI-IR-BASE-20-50-20 — 10 % du bénéfice imposable, plafond 8×PASS'),
    tnsTauxSupplementaire: fiable(0.15, 'BOFiP BOI-IR-BASE-20-50-20 — 15 % supplémentaires, tranche 1-8×PASS'),
    // Point 3/11 : PASS 2026 relayé par des sites spécialisés, non vérifié directement Légifrance/URSSAF.
    pass2026: aVerifier(48_060, 'Point 3/11 — décret 22/12/2025, non consulté directement'),
  },
  immobilier: {
    ifiSeuilAssujettissement: fiable(1_300_000, 'impots.gouv.fr — calcul de l’IFI, seuil de déclenchement'),
    ifiAbattementResidencePrincipale: fiable(0.30, 'impots.gouv.fr — calcul de l’IFI, abattement RP'),
    ifiBareme: fiable(
      [
        { jusqua: 800_000, taux: 0 },
        { jusqua: 1_300_000, taux: 0.005 },
        { jusqua: 2_570_000, taux: 0.007 },
        { jusqua: 5_000_000, taux: 0.01 },
        { jusqua: 10_000_000, taux: 0.0125 },
        { jusqua: null, taux: 0.015 },
      ],
      'impots.gouv.fr — calcul de l’IFI, barème par tranches'
    ),
    ifiDecoteBorneBasse: fiable(1_300_000, 'impots.gouv.fr — calcul de l’IFI, mécanisme de décote'),
    ifiDecoteBorneHaute: fiable(1_400_000, 'impots.gouv.fr — calcul de l’IFI, mécanisme de décote'),
    exonerationResidencePrincipale: fiable(true, 'BOFiP BOI-RFPI-PVI-20-20-20230718 — art. 150 U, II-1° CGI'),
    abattementDetentionDebutAns: fiable(6, 'BOFiP BOI-RFPI-PVI-20-20-20230718 — abattement dès la 6e année'),
    exonerationIrDetentionAns: fiable(22, 'BOFiP BOI-RFPI-PVI-20-20-20230718 — exonération IR totale à 22 ans'),
    exonerationPsDetentionAns: fiable(30, 'BOFiP BOI-RFPI-PVI-20-20-20230718 — exonération PS totale à 30 ans'),
    // Point 5/11 : taux stable mais non re-vérifié par une seconde source primaire indépendante.
    plusValueTauxIr: aVerifier(0.19, 'Point 5/11 — BOFiP BOI-RFPI-TPVIE-20, non re-vérifié ligne à ligne'),
    plusValuePsTaux: fiable(0.172, 'BOFiP — plus-values immobilières, non affectées par la hausse LFSS 2026'),
    plusValueSurtaxeSeuil: fiable(50_000, 'BOFiP BOI-RFPI-TPVIE-20 — seuil de déclenchement de la surtaxe'),
    microFoncierSeuil: fiable(15_000, 'service-public.fr F1991 — seuil revenus fonciers bruts'),
    microFoncierAbattement: fiable(0.30, 'service-public.fr F1991 — abattement forfaitaire micro-foncier'),
    deficitFoncierPlafondImputable: fiable(10_700, 'service-public.fr F1991 — plafond d’imputation sur le revenu global'),
  },
  crypto: {
    tauxIr: fiable(0.128, 'BOFiP BOI-RPPM-PVBMC-30-30 — art. 150 VH bis CGI'),
    psTauxHistorique: fiable(0.172, 'BOFiP BOI-RPPM-PVBMC-30-30 — publié 23/04/2024, non mis à jour LFSS 2026'),
    // Point 2/11 : la page BOFiP de référence n'a pas été mise à jour post-LFSS 2026 pour la crypto.
    psTaux2026: aVerifier(0.186, 'Point 2/11 — taux global 31,4 % non confirmé nommément pour l’art. 150 VH bis'),
    seuilExonerationAnnuel: fiable(305, 'Légifrance art. 150 VH bis CGI — somme des prix de cession'),
    // Point 11/11 : barème repris par analogie avec le régime général des comptes bancaires étrangers.
    amendeCompteEtrangerBase: fiable(750, 'impots.gouv.fr — déclaration 3916-bis, amende par compte non déclaré'),
    amendeOmissionInexactitude: fiable(125, 'impots.gouv.fr — déclaration 3916-bis, amende par omission/inexactitude'),
    amendePlafondParDeclaration: fiable(10_000, 'impots.gouv.fr — déclaration 3916-bis, plafond par déclaration'),
    amendeSeuilMajoration: aVerifier(50_000, 'Point 11/11 — non vérifié spécifiquement pour les actifs numériques'),
    amendeMajoreeParCompte: aVerifier(1_500, 'Point 11/11 — non vérifié spécifiquement pour les actifs numériques'),
  },
  peScpi: {
    dureeBlocageMaxAns: fiable(10, 'AMF — guide FCPR/FCPI/FIP, durée de vie du fonds'),
    dureeConservationReductionAns: fiable(5, 'Légifrance art. 199 terdecies-0 A CGI — conservation jusqu’au 31/12 de la 5e année'),
    reductionTauxGeneral: fiable(0.18, 'Légifrance art. 199 terdecies-0 A CGI — régime général FIP/FCPI'),
    reductionPlafondVersementSeul: fiable(50_000, 'Légifrance art. 199 terdecies-0 A CGI'),
    reductionPlafondVersementCouple: fiable(100_000, 'Légifrance art. 199 terdecies-0 A CGI'),
    reductionTauxCorseOutreMer: fiable(0.30, 'Légifrance art. 199 terdecies-0 A CGI — FIP Corse/outre-mer'),
    reductionTauxFcpiJei: fiable(0.30, 'BOFiP BOI-IR-RICI-110-10-20 — FCPI investis en JEI depuis le 28/09/2025'),
    // Point 6/11 : bascule confirmée seulement par recoupement de sources secondaires.
    basculeFcpiClassiqueDate: aVerifier('2026-02-21', 'Point 6/11 — loi n° 2026-103, non lue directement sur Légifrance'),
    // Point 7/11 : plafonnement global des niches fiscales, connaissance générale non re-vérifiée pour ce cas.
    plafonnementNichesFiscalesAnnuel: aVerifier(10_000, 'Point 7/11 — art. 200-0 A CGI, non re-vérifié pour ce dispositif'),
    // Point 9/11 : liquidité SCPI non confirmée par lecture directe d’une page amf-france.org unique.
    scpiLiquiditeNote: aVerifier(
      'Capital variable : compensation souscriptions/retraits, sans garantie. Capital fixe : marché secondaire, sans garantie de contrepartie.',
      'Point 9/11 — synthèse non confirmée par lecture directe amf-france.org'
    ),
    // Point 10/11 : régime des revenus financiers internes à une SCPI, extrapolé du régime général du PFU.
    scpiRevenusFinanciersInternesTaux: aVerifier(0.314, 'Point 10/11 — extrapolé du PFU général, non confirmé pour les SCPI'),
  },
} as const;

// Formules de rendement locatif / cash-flow (PRD §7.3) : conventions usuelles de calcul,
// pas de règle fiscale sourcée — Point 8/11. Déjà mises en œuvre telles quelles dans
// server/src/routes/immobilier.ts (`withDerived`) ; reprises ici comme note de référence.
export const CONVENTION_RENDEMENT_LOCATIF = aVerifier(
  'Rendement brut = loyer annuel / prix d’acquisition total ; net = (loyer − charges − taxe foncière − assurance − frais de gestion) / prix d’acquisition total ; cash-flow = loyer − charges − taxe foncière − assurance − frais de gestion − mensualité, avant impôt.',
  'Point 8/11 — convention usuelle de gestion de patrimoine, aucune source légale primaire dédiée'
);
