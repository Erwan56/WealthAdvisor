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
