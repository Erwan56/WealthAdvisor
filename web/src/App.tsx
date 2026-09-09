import { useEffect, useState } from 'react';
import { api } from './api';
import { AvPerDashboard } from './components/AvPerDashboard';
import { BourseDashboard } from './components/BourseDashboard';
import { ConseilsScreen } from './components/ConseilsScreen';
import { CreateEntityPanel } from './components/CreateEntityPanel';
import { CryptoDashboard } from './components/CryptoDashboard';
import { DomainRail } from './components/DomainRail';
import { EntityTabs } from './components/EntityTabs';
import { ImmobilierDashboard } from './components/ImmobilierDashboard';
import { LiquiditesDashboard } from './components/LiquiditesDashboard';
import { ObjectifsScreen } from './components/ObjectifsScreen';
import { PeScpiDashboard } from './components/PeScpiDashboard';
import { ProfilScreen } from './components/ProfilScreen';
import { ReportingDashboard } from './components/ReportingDashboard';
import { useToast } from './hooks/useToast';
import { DOMAIN_KEYS } from './types';
import type { Entity, EntityType } from './types';

type Screen = 'dashboard' | 'reporting' | 'profil' | 'objectifs' | 'conseils';

const SCREENS: { key: Screen; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'reporting', label: 'Reporting' },
  { key: 'profil', label: 'Profil' },
  { key: 'objectifs', label: 'Objectifs' },
  { key: 'conseils', label: 'Conseils' },
];

// Remembers where the user was so a page refresh doesn't dump them back on the
// default screen/domain/entity.
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

function readStoredEntity(): number | 'all' {
  const raw = safeGetItem(`${STORAGE_PREFIX}selectedEntity`);
  if (!raw || raw === 'all') return 'all';
  const id = Number(raw);
  return Number.isFinite(id) ? id : 'all';
}

export function App() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<number | 'all'>(readStoredEntity);
  const [domain, setDomain] = useState(readStoredDomain);
  const [screen, setScreen] = useState<Screen>(readStoredScreen);
  const [showCreateEntity, setShowCreateEntity] = useState(false);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const { toast, notify } = useToast();

  const loadEntities = () => {
    api.entities.list().then((rows) => {
      setEntities(rows);
      if (selectedEntity !== 'all' && !rows.some((r) => r.id === selectedEntity)) {
        setSelectedEntity('all');
      }
    });
  };

  useEffect(loadEntities, []);

  useEffect(() => safeSetItem(`${STORAGE_PREFIX}screen`, screen), [screen]);
  useEffect(() => safeSetItem(`${STORAGE_PREFIX}domain`, domain), [domain]);
  useEffect(() => safeSetItem(`${STORAGE_PREFIX}selectedEntity`, String(selectedEntity)), [selectedEntity]);

  // Déclenchement proactif (PRD §6) : recompte les anomalies à l'ouverture de l'app et à
  // chaque navigation — le moteur recalcule depuis l'état courant à chaque appel (pas de
  // job périodique, pas de cache), donc toute mise à jour du patrimoine se reflète dès le
  // prochain changement d'écran ou d'Entité.
  useEffect(() => {
    api.conseils.findings('all').then(({ findings }) => setAnomalyCount(findings.filter((f) => f.type === 'anomalie').length));
  }, [screen, selectedEntity]);

  const createEntity = async (data: { libelle: string; type: EntityType }) => {
    const created = await api.entities.create(data);
    notify(`Entité « ${created.libelle} » créée`);
    setShowCreateEntity(false);
    loadEntities();
    setSelectedEntity(created.id);
  };

  const deleteEntity = async (entity: Entity) => {
    if (!window.confirm(`Supprimer l'Entité « ${entity.libelle} » et tout son patrimoine ?`)) return;
    try {
      await api.entities.delete(entity.id);
      notify(`Entité « ${entity.libelle} » supprimée`);
      if (selectedEntity === entity.id) setSelectedEntity('all');
      loadEntities();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur lors de la suppression', true);
    }
  };

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
        {(screen === 'dashboard' || screen === 'reporting' || screen === 'conseils') && (
          <EntityTabs
            entities={entities}
            selected={selectedEntity}
            onSelect={setSelectedEntity}
            onCreateClick={() => setShowCreateEntity(true)}
            onDelete={deleteEntity}
          />
        )}
      </div>

      <main>
        {screen === 'dashboard' && (
          <div className="dash-shell">
            <DomainRail active={domain} onSelect={setDomain} />
            {domain === 'liquidites' && (
              <LiquiditesDashboard entities={entities} selectedEntity={selectedEntity} notify={notify} />
            )}
            {domain === 'bourse' && (
              <BourseDashboard entities={entities} selectedEntity={selectedEntity} notify={notify} />
            )}
            {domain === 'immobilier' && (
              <ImmobilierDashboard entities={entities} selectedEntity={selectedEntity} notify={notify} />
            )}
            {domain === 'av_per' && (
              <AvPerDashboard entities={entities} selectedEntity={selectedEntity} notify={notify} />
            )}
            {domain === 'crypto' && (
              <CryptoDashboard entities={entities} selectedEntity={selectedEntity} notify={notify} />
            )}
            {domain === 'pe_scpi' && (
              <PeScpiDashboard entities={entities} selectedEntity={selectedEntity} notify={notify} />
            )}
          </div>
        )}
        {screen === 'reporting' && <ReportingDashboard entities={entities} selectedEntity={selectedEntity} />}
        {screen === 'profil' && <ProfilScreen notify={notify} onNavigateConseils={() => setScreen('conseils')} />}
        {screen === 'objectifs' && <ObjectifsScreen entities={entities} notify={notify} />}
        {screen === 'conseils' && <ConseilsScreen entities={entities} selectedEntity={selectedEntity} notify={notify} />}
      </main>

      {showCreateEntity && (
        <CreateEntityPanel onCancel={() => setShowCreateEntity(false)} onCreate={createEntity} />
      )}

      <div className={`toast ${toast.show ? 'show' : ''} ${toast.warn ? 'warn' : ''}`}>{toast.message}</div>
    </div>
  );
}
