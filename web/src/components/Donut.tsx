import { DOMAIN_COLOR_VARS } from '../types';

interface Segment {
  key: string;
  value: number;
}

interface Props {
  segments: Segment[];
  size?: number;
}

// Répartition par domaine — anneau composé d'arcs superposés (technique
// stroke-dasharray), pas de dépendance de charting externe.
export function Donut({ segments, size = 140 }: Props) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size / 2},${size / 2}) rotate(-90)`}>
        <circle r={r} fill="none" style={{ stroke: 'var(--surface-2)' }} strokeWidth={18} />
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => {
              const frac = s.value / total;
              const dash = frac * c;
              const el = (
                <circle
                  key={s.key}
                  r={r}
                  fill="none"
                  style={{ stroke: DOMAIN_COLOR_VARS[s.key] }}
                  strokeWidth={18}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return el;
            })}
      </g>
    </svg>
  );
}
