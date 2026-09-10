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
