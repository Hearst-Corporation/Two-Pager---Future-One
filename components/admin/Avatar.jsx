/**
 * Circular avatar — uses avatar_url when present, otherwise initials.
 * Color is derived deterministically from email so the same person always
 * renders the same hue across the app.
 */
const PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#a855f7'];

function hueFor(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function initialsFor(name = '', email = '') {
  const src = (name || email || '?').trim();
  const parts = src.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export default function Avatar({ profile, size = 28, showRing = false, title }) {
  const px = size;
  if (!profile) {
    return (
      <span
        title={title || 'Unassigned'}
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          background: 'transparent',
          border: '1.5px dashed var(--color-border-medium)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          fontSize: Math.max(9, px * 0.4),
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        ·
      </span>
    );
  }
  const seed = String(profile.email || profile.id || profile.full_name || '');
  const bg = hueFor(seed);
  const text = profile.avatar_url ? null : initialsFor(profile.full_name, profile.email);
  return (
    <span
      title={title || profile.full_name || profile.email}
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: profile.avatar_url ? '#f3f4f6' : bg,
        backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.max(9, px * 0.38),
        fontWeight: 700,
        letterSpacing: 0.3,
        flexShrink: 0,
        boxShadow: showRing ? `0 0 0 2px var(--color-bg-main), 0 0 0 3.5px ${bg}` : 'none',
      }}
    >
      {text}
    </span>
  );
}

export function AvatarStack({ profiles = [], size = 24, max = 4 }) {
  const visible = profiles.slice(0, max);
  const overflow = profiles.length - visible.length;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {visible.map((p, i) => (
        <span key={p.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.35 }}>
          <Avatar profile={p} size={size} showRing />
        </span>
      ))}
      {overflow > 0 && (
        <span
          style={{
            marginLeft: -size * 0.35,
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'var(--color-bg-main)',
            border: '1.5px solid var(--color-border-medium)',
            color: 'var(--color-text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.max(9, size * 0.38),
            fontWeight: 700,
          }}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}
