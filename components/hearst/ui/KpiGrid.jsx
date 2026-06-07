'use client';
import PropTypes from 'prop-types';

// KpiGrid — grille de KPI auto-responsive. Remplace les `kpiGrid`/`statRow`/
// `secondaryKpis` inline. Réutilise KpiCard comme enfant (ne pas recoder une card).
// Tokens --cp-* uniquement.

/**
 * @param {object} props
 * @param {number} [props.cols]   Nombre de colonnes FIXE. Par défaut: auto-fit
 *                                sur --cp-kpi-min-width (responsive intrinsèque).
 * @param {object} [props.style]
 * @param {React.ReactNode} props.children  Idéalement des <KpiCard/>.
 */
export default function KpiGrid({ cols, style, children, ...rest }) {
  const gridTemplateColumns = cols
    ? `repeat(${cols}, minmax(0, 1fr))`
    : 'repeat(auto-fit, minmax(var(--cp-kpi-min-width), 1fr))';
  return (
    <div style={{ display: 'grid', gridTemplateColumns, gap: 'var(--cp-space-3)', ...style }} {...rest}>
      {children}
    </div>
  );
}

KpiGrid.propTypes = {
  cols: PropTypes.number,
  style: PropTypes.object,
  children: PropTypes.node,
};
