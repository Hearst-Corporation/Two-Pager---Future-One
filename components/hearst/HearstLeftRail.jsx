'use client';

// HearstLeftRail — rail vertical gauche minimaliste du cockpit Hearst.
//
// ⚠ Dérogation SPEC §3 explicitement validée par Adrien (option D /cockpit-adrien fix).
// Le shell @hearst/cockpit-shell rend .ct-rail-left pour un hub multi-produits ;
// Oracle est un produit standalone qui a besoin d'avatar + favoris + nav 4 sections,
// fonctionnalités non couvertes nativement par le shell. Tokens --cp-* utilisés ici
// sont des alias 1:1 vers --ct-* (cf. cp-tokens.css) → palette respectée.
// À retirer si/quand le package shell expose un slot RailLeft custom.
//
// 3 zones :
//   1. Avatar utilisateur en haut
//      - 1 clic → /admin/hearst/profile
//      - 2 clics (double-click) → logout (DELETE /api/admin/login)
//   2. Favoris — liens raccourcis configurables (stockés en localStorage)
//   3. Bouton "+" en bas pour ajouter un favori (modal)

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'hearst.left-rail.favorites';

// Liste des destinations possibles pour les favoris.
// Le user choisit parmi cette liste dans le modal.
const ALL_DESTINATIONS = [
  { href: '/admin/hearst/executive',    label: 'Executive' },
  { href: '/admin/hearst',              label: 'Brief' },
  { href: '/admin/hearst/simulator',    label: 'Simulator' },
  { href: '/admin/hearst/engine',       label: 'Engine' },
  { href: '/admin/hearst/scenarios',    label: 'Scenarios' },
  { href: '/admin/hearst/financial',    label: 'Financial' },
  { href: '/admin/hearst/assumptions',  label: 'Assumptions' },
  { href: '/admin/hearst/pipeline',     label: 'Pipeline' },
  { href: '/admin/hearst/deals',        label: 'Deals' },
  { href: '/admin/hearst/contracts',    label: 'Contracts' },
  { href: '/admin/hearst/data-room',    label: 'Data Room' },
  { href: '/admin/hearst/dossier',      label: 'Dossier' },
  { href: '/admin/hearst/sources',      label: 'Sources' },
  { href: '/admin/hearst/documents',    label: 'Exports' },
  { href: '/admin/hearst/timeline',     label: 'Timeline' },
  { href: '/admin/hearst/risks',        label: 'Risks' },
  { href: '/admin/hearst/audit',        label: 'Changelog' },
];

function initials(name, email) {
  const src = (name || email || '').trim();
  if (!src) return 'U';
  const parts = src.split(/[\s@.]/).filter(Boolean);
  if (parts.length === 0) return src[0]?.toUpperCase() || 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function HearstLeftRail() {
  const pathname = usePathname();

  const [favorites, setFavorites] = useState([]);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setFavorites(arr);
      }
    } catch {}
  }, []);

  const persistFavorites = useCallback((next) => {
    setFavorites(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  function addFavorite(dest) {
    if (favorites.some(f => f.href === dest.href)) return;
    persistFavorites([...favorites, dest]);
    setAddOpen(false);
  }

  function removeFavorite(href) {
    persistFavorites(favorites.filter(f => f.href !== href));
  }

  const availableDest = ALL_DESTINATIONS.filter(d => !favorites.some(f => f.href === d.href));

  return (
    <>
      <aside aria-label="Hearst left rail" style={S.rail}>
        {/* Avatar retiré — le shell CockpitShell rend déjà .ct-avatar en bas du rail-left.
            HearstLeftRail garde uniquement la fonctionnalité Favoris non-native. */}

        {/* Favoris */}
        <div style={S.favList} role="list" aria-label="Favoris">
          {favorites.map(f => {
            const active = pathname === f.href || pathname?.startsWith(f.href + '/');
            return (
              <div key={f.href} style={S.favItem} role="listitem">
                <Link
                  href={f.href}
                  aria-label={f.label}
                  title={f.label}
                  style={{ ...S.favLink, ...(active ? S.favLinkActive : {}) }}
                >
                  <span style={S.favInitials}>{initials(f.label, '')}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => removeFavorite(f.href)}
                  aria-label={`Retirer ${f.label} des favoris`}
                  style={S.favRemove}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        {/* Bouton + pour ajouter un favori */}
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          aria-label="Ajouter un favori"
          title="Ajouter un favori"
          style={S.addBtn}
          disabled={availableDest.length === 0}
        >
          +
        </button>
      </aside>

      {addOpen && (
        <div
          style={S.modalBackdrop}
          onClick={() => setAddOpen(false)}
          role="dialog"
          aria-label="Ajouter un favori"
        >
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <header style={S.modalHead}>
              <h2 style={S.modalTitle}>Ajouter un favori</h2>
              <button type="button" onClick={() => setAddOpen(false)} aria-label="Fermer" style={S.modalClose}>×</button>
            </header>
            <div style={S.modalBody}>
              {availableDest.length === 0 ? (
                <p style={S.modalEmpty}>Toutes les pages sont déjà en favoris.</p>
              ) : (
                <ul style={S.modalList}>
                  {availableDest.map(d => (
                    <li key={d.href}>
                      <button type="button" onClick={() => addFavorite(d)} style={S.modalListBtn}>
                        <span style={S.modalListInitials}>{initials(d.label, '')}</span>
                        <span>{d.label}</span>
                        <span style={S.modalListHref}>{d.href}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const S = {
  rail: {
    position: 'fixed',
    left: 0,
    top: 80,
    bottom: 80,
    width: 'var(--cp-rail-left, 72px)',
    zIndex: 25,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0 16px',
    pointerEvents: 'auto',
  },

  // Favoris
  favList: { display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' },
  favItem: { position: 'relative', display: 'inline-flex' },
  favLink: {
    width: 40, height: 40,
    borderRadius: 10,
    background: 'var(--cp-surface-2)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--cp-border)',
    color: 'var(--cp-text-muted)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
    fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
  },
  favLinkActive: {
    background: 'var(--cp-accent-soft)',
    color: 'var(--cp-accent)',
    borderColor: 'var(--cp-accent)',
  },
  favInitials: { fontSize: 11, fontWeight: 700 },
  favRemove: {
    position: 'absolute', top: -6, right: -6,
    width: 16, height: 16,
    borderRadius: '50%',
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)',
    fontSize: 11, lineHeight: 1,
    cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  },

  // Bouton +
  addBtn: {
    width: 40, height: 40,
    borderRadius: 10,
    background: 'var(--cp-surface-2)',
    color: 'var(--cp-text-muted)',
    border: '1px dashed var(--cp-border)',
    fontSize: 20, fontWeight: 700, lineHeight: 1,
    cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  // Modal
  modalBackdrop: {
    position: 'fixed', inset: 0, zIndex: 60,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  },
  modal: {
    width: '100%', maxWidth: 440,
    background: 'var(--cp-surface-1, var(--cp-surface-2))',
    border: '1px solid var(--cp-border)',
    borderRadius: 14,
    display: 'flex', flexDirection: 'column',
    maxHeight: '70vh',
  },
  modalHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid var(--cp-border)',
  },
  modalTitle: { fontSize: 14, fontWeight: 800, color: 'var(--cp-text-primary)', margin: 0, letterSpacing: 0.3 },
  modalClose: {
    width: 28, height: 28, borderRadius: 8,
    background: 'transparent', border: 'none',
    color: 'var(--cp-text-muted)', cursor: 'pointer',
    fontSize: 18, lineHeight: 1,
  },
  modalBody: { padding: 12, overflowY: 'auto' },
  modalEmpty: { fontSize: 13, color: 'var(--cp-text-muted)', textAlign: 'center', padding: 24 },
  modalList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 },
  modalListBtn: {
    width: '100%', textAlign: 'left',
    padding: '10px 12px', borderRadius: 8,
    background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)',
    color: 'var(--cp-text-body)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 12,
    fontSize: 13, font: 'inherit',
  },
  modalListInitials: {
    width: 32, height: 32, borderRadius: 8,
    background: 'var(--cp-surface-0)', color: 'var(--cp-text-primary)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  modalListHref: {
    marginLeft: 'auto', fontSize: 11, color: 'var(--cp-text-muted)',
    fontFamily: 'ui-monospace, monospace',
  },
};
