import { useEffect, useState } from 'react';
import { api } from './api';
import { AvPerDashboard } from './components/AvPerDashboard';
import { BourseDashboard } from './components/BourseDashboard';
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
import type { Entity, EntityType } from './types';

type Screen = 'dashboard' | 'reporting' | 'profil' | 'objectifs';

const SCREENS: { key: Screen; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'reporting', label: 'Reporting' },
  { key: 'profil', label: 'Profil' },
  { key: 'objectifs', label: 'Objectifs' },
];

export function App() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<number | 'all'>('all');
  const [domain, setDomain] = useState('liquidites');
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [showCreateEntity, setShowCreateEntity] = useState(false);
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

  const createEntity = async (data: { libelle: string; type: EntityType }) => {
    const created = await api.entities.create(data);
    notify(`Entité « ${created.libelle} » créée`);
    setShowCreateEntity(false);
    loadEntities();
    setSelectedEntity(created.id);
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
            </button>
          ))}
        </nav>
        {(screen === 'dashboard' || screen === 'reporting') && (
          <EntityTabs
            entities={entities}
            selected={selectedEntity}
            onSelect={setSelectedEntity}
            onCreateClick={() => setShowCreateEntity(true)}
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
        {screen === 'profil' && <ProfilScreen notify={notify} />}
        {screen === 'objectifs' && <ObjectifsScreen entities={entities} notify={notify} />}
      </main>

      {showCreateEntity && (
        <CreateEntityPanel onCancel={() => setShowCreateEntity(false)} onCreate={createEntity} />
      )}

      <div className={`toast ${toast.show ? 'show' : ''} ${toast.warn ? 'warn' : ''}`}>{toast.message}</div>
    </div>
  );
}
