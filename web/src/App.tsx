import { useEffect, useState } from 'react';
import { api } from './api';
import { AvPerDashboard } from './components/AvPerDashboard';
import { BourseDashboard, type DomainRefreshAction } from './components/BourseDashboard';
import { ConfigurationScreen } from './components/ConfigurationScreen';
import { ConseilsScreen } from './components/ConseilsScreen';
import { CryptoDashboard } from './components/CryptoDashboard';
import { DomainRail } from './components/DomainRail';
import { ImmobilierDashboard } from './components/ImmobilierDashboard';
import { LiquiditesDashboard } from './components/LiquiditesDashboard';
import { ObjectifsScreen } from './components/ObjectifsScreen';
import { PeScpiDashboard } from './components/PeScpiDashboard';
import { ProfilScreen } from './components/ProfilScreen';
import { ReportingDashboard } from './components/ReportingDashboard';
import { useToast } from './hooks/useToast';
import { DOMAIN_KEYS } from './types';
import type { Entity } from './types';

type Screen = 'dashboard' | 'reporting' | 'configuration' | 'profil' | 'objectifs' | 'conseils';

const SCREENS: { key: Screen; label: string }[] = [
  { key: 'dashboard', label: 'Domaines' },
  { key: 'reporting', label: 'Reporting' },
  { key: 'configuration', label: 'Configuration' },
  { key: 'profil', label: 'Profil' },
  { key: 'objectifs', label: 'Objectifs' },
  { key: 'conseils', label: 'Conseils' },
];

// Un sous-titre explicite par écran (ticket 03) — lève l'ambiguïté "saisie vs
// synthèse" dès l'arrivée sur l'écran, sans dépendre du seul libellé de nav.
const SCREEN_SUBTITLES: Partial<Record<Screen, string>> = {
  dashboard: 'Domaines — saisie et suivi du patrimoine',
};

// Remembers where the user was so a page refresh doesn't dump them back on the
// default screen/domain.
const STORAGE_PREFIX = 'wealthadvisor.';

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Persistence is a convenience, not a requirement — ignore storage errors.
  }
}

function readStoredScreen(): Screen {
  const raw = safeGetItem(`${STORAGE_PREFIX}screen`);
  return SCREENS.some((s) => s.key === raw) ? (raw as Screen) : 'dashboard';
}

function readStoredDomain(): string {
  const raw = safeGetItem(`${STORAGE_PREFIX}domain`);
  return raw && DOMAIN_KEYS.includes(raw) ? raw : 'liquidites';
}

export function App() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [domain, setDomain] = useState(readStoredDomain);
  const [screen, setScreen] = useState<Screen>(readStoredScreen);
  const [anomalyCount, setAnomalyCount] = useState(0);
  // The currently-mounted domain dashboard can register one action here to have it
  // rendered at the dashboard-global level rather than inside its own card (generic
  // mechanism from valorisation-bourse-temps-reel, ticket 07). Only BourseDashboard
  // opts in today.
  const [domainAction, setDomainAction] = useState<DomainRefreshAction | null>(null);
  const { toast, notify } = useToast();

  const loadEntities = () => {
    api.entities.list().then(setEntities);
  };

  useEffect(loadEntities, []);

  useEffect(() => safeSetItem(`${STORAGE_PREFIX}screen`, screen), [screen]);
  useEffect(() => safeSetItem(`${STORAGE_PREFIX}domain`, domain), [domain]);

  // Déclenchement proactif (PRD §6) : recompte les anomalies à l'ouverture de l'app et à
  // chaque navigation — le moteur recalcule depuis l'état courant à chaque appel (pas de
  // job périodique, pas de cache), donc toute mise à jour du patrimoine se reflète dès le
  // prochain changement d'écran.
  useEffect(() => {
    api.conseils.findings('all').then(({ findings }) => setAnomalyCount(findings.filter((f) => f.type === 'anomalie').length));
  }, [screen]);

  return (
    <div>
      <div className="app-header">
        <div className="eyebrow">WealthAdvisor</div>
        <h1>{SCREENS.find((s) => s.key === screen)?.label}</h1>
        <nav className="top-nav">
          {SCREENS.map((s) => (
            <button
              type="button"
              key={s.key}
              className={`top-nav-item ${screen === s.key ? 'active' : ''}`}
              onClick={() => setScreen(s.key)}
            >
              {s.label}
              {s.key === 'conseils' && anomalyCount > 0 && <span className="nav-badge">{anomalyCount}</span>}
            </button>
          ))}
        </nav>
      </div>

      <main>
        {SCREEN_SUBTITLES[screen] && <div className="screen-subtitle">{SCREEN_SUBTITLES[screen]}</div>}
        {screen === 'dashboard' && (
          <>
            {domain === 'bourse' && domainAction && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                <button type="button" className="btn primary" onClick={domainAction.onClick} disabled={domainAction.busy}>
                  {domainAction.busy ? domainAction.busyLabel : domainAction.label}
                </button>
              </div>
            )}
            <div className="dash-shell">
              <DomainRail active={domain} onSelect={setDomain} />
              {domain === 'liquidites' && <LiquiditesDashboard entities={entities} notify={notify} />}
              {domain === 'bourse' && (
                <BourseDashboard entities={entities} notify={notify} onDomainAction={setDomainAction} />
              )}
              {domain === 'immobilier' && <ImmobilierDashboard entities={entities} notify={notify} />}
              {domain === 'av_per' && <AvPerDashboard entities={entities} notify={notify} />}
              {domain === 'crypto' && <CryptoDashboard entities={entities} notify={notify} />}
              {domain === 'pe_scpi' && <PeScpiDashboard entities={entities} notify={notify} />}
            </div>
          </>
        )}
        {screen === 'reporting' && <ReportingDashboard />}
        {screen === 'configuration' && (
          <ConfigurationScreen entities={entities} onEntitiesChanged={loadEntities} notify={notify} />
        )}
        {screen === 'profil' && <ProfilScreen notify={notify} onNavigateConseils={() => setScreen('conseils')} />}
        {screen === 'objectifs' && <ObjectifsScreen entities={entities} notify={notify} />}
        {screen === 'conseils' && <ConseilsScreen entities={entities} notify={notify} />}
      </main>

      <div className={`toast ${toast.show ? 'show' : ''} ${toast.warn ? 'warn' : ''}`}>{toast.message}</div>
    </div>
  );
}
