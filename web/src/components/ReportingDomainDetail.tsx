import { useEffect, useState } from 'react';
import { api } from '../api';
import { euros, fmtDate } from '../format';
import { DOMAIN_LABELS } from '../types';
import type { ReportingDomainDetail as DomainDetail } from '../types';
import { Sparkline } from './Sparkline';

interface Props {
  domaine: string;
  entityId: number | 'all';
  onClose: () => void;
}

function DeltaPill({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="delta up" style={{ opacity: 0.5 }}>
        —
      </span>
    );
  }
  return (
    <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
      {delta >= 0 ? '+' : ''}
      {euros(delta)}
    </span>
  );
}

export function ReportingDomainDetail({ domaine, entityId, onClose }: Props) {
  const [detail, setDetail] = useState<DomainDetail | null>(null);

  useEffect(() => {
    setDetail(null);
    api.reporting.domain(domaine, entityId).then(setDetail);
  }, [domaine, entityId]);

  const hasEnvelope = domaine !== 'liquidites' && domaine !== 'immobilier';

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="create-panel" style={{ width: 560 }}>
        <div className="create-panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3>{DOMAIN_LABELS[domaine]}</h3>
            <p>Courbe complète, par mise à jour réelle.</p>
          </div>
          <button type="button" className="btn ghost icon" onClick={onClose}>
            ✕
          </button>
        </div>

        {detail === null ? (
          <div className="empty-state">Chargement…</div>
        ) : (
          <>
            <div style={{ padding: '16px 22px 4px' }}>
              {detail.curve.length >= 2 ? (
                <>
                  <Sparkline points={detail.curve} width={510} height={90} domaine={domaine} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', fontFamily: 'IBM Plex Mono' }}>
                    <span>{fmtDate(detail.curve[0].date)}</span>
                    <span>{fmtDate(detail.curve[detail.curve.length - 1].date)}</span>
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{ padding: '8px 0' }}>
                  Historique insuffisant pour tracer une courbe.
                </div>
              )}
              {detail.indicateur_cle && (
                <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--muted)' }}>
                  {detail.indicateur_cle.label} · <strong className="mono">{detail.indicateur_cle.value}</strong>
                </div>
              )}
            </div>

            <div className="env-group-label">{hasEnvelope ? 'Enveloppes' : 'Lignes'}</div>
            {detail.items.length === 0 ? (
              <div className="empty-state">Rien à afficher pour ce Domaine.</div>
            ) : (
              detail.items.map((item) => (
                <div className="ledger-row" key={item.id}>
                  <div className="ledger-row-head with-entity" style={{ cursor: 'default' }}>
                    <div className="name">{item.libelle}</div>
                    <div className="ent-cell">{item.entity_libelle}</div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="val">{euros(item.valeur)}</div>
                      <div className="asof">
                        <DeltaPill delta={item.delta} />
                      </div>
                    </div>
                    <div />
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
