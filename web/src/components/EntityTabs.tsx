import type { Entity } from '../types';

const TYPE_CLASS: Record<string, string> = {
  personnelle: 'ent-type-personnelle',
  activite_service: 'ent-type-activite_service',
  detention_immobiliere: 'ent-type-detention_immobiliere',
};

export function entityInitial(libelle: string): string {
  return libelle.trim().charAt(0).toUpperCase() || '?';
}

export function EntityAvatar({ entity, small }: { entity: Entity; small?: boolean }) {
  return (
    <div className={`ent-avatar ${small ? 'sm' : ''} ${TYPE_CLASS[entity.type]}`}>
      {entityInitial(entity.libelle)}
    </div>
  );
}

interface Props {
  entities: Entity[];
  selected: number | 'all';
  onSelect: (id: number | 'all') => void;
  onCreateClick: () => void;
}

export function EntityTabs({ entities, selected, onSelect, onCreateClick }: Props) {
  return (
    <div className="entity-tabs">
      <button
        type="button"
        className={`entity-tab ${selected === 'all' ? 'active' : ''}`}
        onClick={() => onSelect('all')}
      >
        Toutes les Entités
      </button>
      {entities.map((e) => (
        <button
          type="button"
          key={e.id}
          className={`entity-tab ${selected === e.id ? 'active' : ''}`}
          onClick={() => onSelect(e.id)}
        >
          <EntityAvatar entity={e} />
          {e.libelle}
        </button>
      ))}
      <button type="button" className="entity-tab add" onClick={onCreateClick}>
        + Nouvelle Entité
      </button>
    </div>
  );
}
