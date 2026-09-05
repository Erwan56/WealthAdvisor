import { DOMAIN_COLOR_VARS } from '../types';
import type { Point } from '../types';

interface Props {
  points: Point[];
  width?: number;
  height?: number;
  domaine?: string;
}

// Minimal inline-SVG line — no charting dependency (PRD §5.3: one point per real
// Valorisation, never resampled, so this only ever connects actual data points).
export function Sparkline({ points, width = 96, height = 28, domaine }: Props) {
  if (points.length < 2) {
    return <svg width={width} height={height} aria-hidden />;
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - 2 - ((p.value - min) / range) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const trendUp = values[values.length - 1] >= values[0];
  const stroke = domaine ? DOMAIN_COLOR_VARS[domaine] : trendUp ? 'var(--good)' : 'var(--bad)';

  return (
    <svg width={width} height={height}>
      <polyline
        points={coords.join(' ')}
        fill="none"
        style={{ stroke }}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
