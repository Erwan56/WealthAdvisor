import { DOMAIN_KEYS, DOMAIN_LABELS } from '../types';

interface Props {
  active: string;
  onSelect: (domain: string) => void;
}

export function DomainRail({ active, onSelect }: Props) {
  return (
    <nav className="domain-rail">
      {DOMAIN_KEYS.map((k) => (
        <button
          key={k}
          type="button"
          className={`rail-item ${k === active ? 'active' : ''}`}
          onClick={() => onSelect(k)}
        >
          {DOMAIN_LABELS[k]}
        </button>
      ))}
    </nav>
  );
}
