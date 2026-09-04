import { useEffect, useState } from 'react';
import { api } from './api';
import { BourseDashboard } from './components/BourseDashboard';
import { CreateEntityPanel } from './components/CreateEntityPanel';
import { DomainRail } from './components/DomainRail';
import { EntityTabs } from './components/EntityTabs';
import { LiquiditesDashboard } from './components/LiquiditesDashboard';
import { useToast } from './hooks/useToast';
import type { Entity, EntityType } from './types';

export function App() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<number | 'all'>('all');
  const [domain, setDomain] = useState('liquidites');
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
        <h1>Tableau de bord</h1>
        <EntityTabs
          entities={entities}
          selected={selectedEntity}
          onSelect={setSelectedEntity}
          onCreateClick={() => setShowCreateEntity(true)}
        />
      </div>

      <main>
        <div className="dash-shell">
          <DomainRail active={domain} onSelect={setDomain} />
          {domain === 'liquidites' && (
            <LiquiditesDashboard entities={entities} selectedEntity={selectedEntity} notify={notify} />
          )}
          {domain === 'bourse' && (
            <BourseDashboard entities={entities} selectedEntity={selectedEntity} notify={notify} />
          )}
        </div>
      </main>

      {showCreateEntity && (
        <CreateEntityPanel onCancel={() => setShowCreateEntity(false)} onCreate={createEntity} />
      )}

      <div className={`toast ${toast.show ? 'show' : ''} ${toast.warn ? 'warn' : ''}`}>{toast.message}</div>
    </div>
  );
}
