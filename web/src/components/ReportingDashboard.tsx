import { useEffect, useState } from 'react';
import { api } from '../api';
import { euros, pct } from '../format';
import { DOMAIN_LABELS } from '../types';
import type { ReportingSummary } from '../types';
import { Donut } from './Donut';
import { ReportingDomainDetail } from './ReportingDomainDetail';
import { Sparkline } from './Sparkline';

function VariationCell({ variation }: { variation: number | null }) {
  if (variation === null) {
    return <span style={{ color: 'var(--muted)' }}>—</span>;
  }
  return (
    <span className={`delta ${variation >= 0 ? 'up' : 'down'}`}>
      {variation >= 0 ? '+' : ''}
      {euros(variation)}
    </span>
  );
}

export function ReportingDashboard() {
  const [summary, setSummary] = useState<ReportingSummary | null>(null);
  const [openDomain, setOpenDomain] = useState<string | null>(null);

  useEffect(() => {
    api.reporting.summary('all').then(setSummary);
  }, []);

  return (
    <div className="dash-main">
      <div className="dash-toolbar">
        <h2>Reporting</h2>
      </div>
      <div className="screen-subtitle">Reporting — vue d'ensemble en lecture seule</div>

      {summary === null ? (
        <div className="card empty-state">Chargement…</div>
      ) : (
        <>
          <div className="report-kpis">
            <div className="card kpi-card">
              <div className="kpi-label">Patrimoine total</div>
              <div className="kpi-value mono">{euros(summary.patrimoine_total)}</div>
            </div>
            <div className="card kpi-card">
              <div className="kpi-label">Patrimoine net</div>
              <div className="kpi-value mono">{euros(summary.patrimoine_net)}</div>
            </div>
            <div className="card kpi-card small">
              <div className="kpi-label">Nombre d'Entités</div>
              <div className="kpi-value mono">{summary.nombre_entites}</div>
            </div>
          </div>

          <div className="card report-donut-card">
            <div className="donut-wrap">
              <Donut segments={summary.domains.map((d) => ({ key: d.domaine, value: d.valeur }))} />
              <div className="donut-center">
                <div className="donut-center-value mono">{euros(summary.patrimoine_total)}</div>
                <div className="donut-center-label">Patrimoine total</div>
              </div>
            </div>
            <div className="donut-legend">
              {summary.domains
                .filter((d) => d.valeur > 0)
                .map((d) => (
                  <div className="legend-item" key={d.domaine}>
                    <span className={`swatch dom-${d.domaine}`} />
                    <span>{DOMAIN_LABELS[d.domaine]}</span>
                    <span className="mono muted">{pct(d.part)}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="card">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Domaine</th>
                  <th>Valeur</th>
                  <th>Part</th>
                  <th>Variation</th>
                  <th>Évolution</th>
                  <th>Indicateur clé</th>
                </tr>
              </thead>
              <tbody>
                {summary.domains.map((d) => (
                  <tr key={d.domaine} onClick={() => setOpenDomain(d.domaine)}>
                    <td>
                      <span className={`swatch dom-${d.domaine}`} />
                      {DOMAIN_LABELS[d.domaine]}
                    </td>
                    <td className="mono">{euros(d.valeur)}</td>
                    <td className="mono muted">{pct(d.part)}</td>
                    <td>
                      <VariationCell variation={d.variation} />
                    </td>
                    <td>
                      <Sparkline points={d.sparkline} domaine={d.domaine} />
                    </td>
                    <td className="muted" style={{ fontSize: 12 }}>
                      {d.indicateur_cle ? (
                        <>
                          {d.indicateur_cle.label} <strong className="mono">{d.indicateur_cle.value}</strong>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {openDomain && <ReportingDomainDetail domaine={openDomain} entityId="all" onClose={() => setOpenDomain(null)} />}
    </div>
  );
}
