'use client';
import PropTypes from 'prop-types';

// Table — primitive de tableau. Remplace les 5 réimplémentations inline de
// th/td/tdLabel (dossier, financial, deals, sources, workspace).
// Usage : <Table head={['A','B']}><Row><Cell>…</Cell></Row></Table>
//   ou plein contrôle : <Table><THead>…</THead><tbody>…</tbody></Table>

const S = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cp-font-sm)' },
  th: {
    textAlign: 'left', padding: 'var(--cp-space-2) var(--cp-space-3)', color: 'var(--cp-text-muted)',
    background: 'var(--cp-surface-0)', borderBottom: '1px solid var(--cp-border)',
    fontWeight: 'var(--cp-weight-semibold)', textTransform: 'uppercase', fontSize: 'var(--cp-font-micro)',
    letterSpacing: 'var(--cp-tracking-eyebrow)', whiteSpace: 'nowrap',
  },
  td: { padding: 'var(--cp-space-2) var(--cp-space-3)', color: 'var(--cp-text-body)', borderBottom: '1px solid var(--cp-border)', verticalAlign: 'middle' },
  tdLabel: { padding: 'var(--cp-space-2) var(--cp-space-3)', color: 'var(--cp-text-primary)', fontWeight: 'var(--cp-weight-bold)', borderBottom: '1px solid var(--cp-border)', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid var(--cp-border)' },
};

/**
 * @param {object} props
 * @param {string[]} [props.head]   Si fourni, rend automatiquement le <thead>.
 * @param {boolean} [props.scroll]  Enveloppe dans un conteneur overflow-x:auto.
 * @param {object} [props.style]
 * @param {React.ReactNode} props.children  Lignes (<Row>) ou <tbody>.
 */
export function Table({ head, scroll = false, style, children, ...rest }) {
  const table = (
    <table style={{ ...S.table, ...style }} {...rest}>
      {head && <thead><tr>{head.map((h, i) => <th key={i} style={S.th}>{h}</th>)}</tr></thead>}
      {head ? <tbody>{children}</tbody> : children}
    </table>
  );
  return scroll ? <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>{table}</div> : table;
}

export function THead({ children }) { return <thead>{children}</thead>; }
export function Row({ children, style, ...rest }) { return <tr style={{ ...S.tr, ...style }} {...rest}>{children}</tr>; }
/** @param {{header?:boolean, label?:boolean}} props — header=th, label=1ère colonne forte. */
export function Cell({ header = false, label = false, style, children, ...rest }) {
  if (header) return <th style={{ ...S.th, ...style }} {...rest}>{children}</th>;
  return <td style={{ ...(label ? S.tdLabel : S.td), ...style }} {...rest}>{children}</td>;
}

Table.propTypes = { head: PropTypes.arrayOf(PropTypes.node), scroll: PropTypes.bool, style: PropTypes.object, children: PropTypes.node };
THead.propTypes = { children: PropTypes.node };
Row.propTypes = { children: PropTypes.node, style: PropTypes.object };
Cell.propTypes = { header: PropTypes.bool, label: PropTypes.bool, style: PropTypes.object, children: PropTypes.node };

export default Table;
