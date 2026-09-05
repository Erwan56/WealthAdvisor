// Seuils du socle de règles de conseil par domaine (PRD §7) — distincts des constantes
// fiscales/légales de fiscal-constants.ts (§8) : ce sont des conventions usuelles ou des
// jugements de conception tranchés en grilling, pas des chiffres légaux.

export const RULES = {
  liquidites: {
    // Règle A — compte courant dormant : 1 mois de dépenses + marge 15 % (issue 14).
    compteCourantMargeSecurite: 0.15,
    // Règle B — fonds de précaution livret : mois de réserve visés (Profil, défaut 6) déjà stocké.
    // Règle C — trésorerie professionnelle dormante : 4 mois de charges fixes pro (issue 25).
    tresorerieProMoisCharges: 4,
    // Réserve de précaution immobilier : 1 % de la valeur du bien par an (défaut, curseur indicatif
    // 0,5-3 % non exposé en ticket 3 — pas d'UI/champ persistant pour cet effort, PRD §7.1).
    reserveImmobilierPctDefaut: 0.01,
  },
  bourse: {
    concentrationLigneSeuilPct: 0.25,
    cashDormantEnveloppeSeuilPct: 0.05,
    peaAngleAncienneteAns: 5,
  },
  immobilier: {
    rendementNetAnormalSeuilPct: 0.03,
    pretSoldeAlerteMoisAvant: 6,
  },
  avPer: {
    capHuitAnsAlerteMoisAvant: 6,
    seuil150kMargeRestante: 20_000, // proactif dès qu'il reste ≤ 20k€ avant le plafond de 150k€
    perPlafondSeuilPctUtilise: 0.80,
  },
  cryptoPe: {
    // Exposition crypto par bucket de Profil de risque (borne haute = seuil de déclenchement).
    cryptoExpositionSeuilParBucket: {
      prudent: 0.02,
      equilibre: 0.05,
      dynamique: 0.10,
    } as Record<'prudent' | 'equilibre' | 'dynamique', number>,
    peScpiExpositionSeuilPct: 0.20,
    peScpiBlocageAlerteMoisAvant: 6,
  },
} as const;
