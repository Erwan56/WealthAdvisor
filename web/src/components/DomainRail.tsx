import { DOMAIN_KEYS, DOMAIN_LABELS } from '../types';

interface Props {
  active: string;
  onSelect: (domain: string) => void;
}

export function DomainRail({ active, onSelect }: Props) {
  return (
    <nav className="domain-rail">
      {DOMAIN_KEYS.map((k) => {
        const enabled = k === 'liquidites';
        return (
          <button
            key={k}
            type="button"
            className={`rail-item ${k === active ? 'active' : ''}`}
            disabled={!enabled}
            title={enabled ? undefined : 'Domaine pas encore disponible dans cette version'}
            onClick={() => enabled && onSelect(k)}
          >
            {DOMAIN_LABELS[k]}
          </button>
        );
      })}
    </nav>
  );
}
