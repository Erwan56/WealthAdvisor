export function euros(v: number): string {
  return `${v.toLocaleString('fr-FR')} €`;
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function pct(v: number): string {
  return `${v.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

export function monthYear(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}
