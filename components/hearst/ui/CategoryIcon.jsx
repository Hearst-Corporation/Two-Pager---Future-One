'use client';

import PropTypes from 'prop-types';
import {
  Building2, MapPin, Zap, ClipboardList, Settings2, Handshake,
  DollarSign, Scale, Leaf, BarChart3, ShieldCheck, FileText,
} from 'lucide-react';

// Lucide icon registry for data-room categories (and any name-keyed icon).
// DATA_ROOM_CATEGORIES.icon holds one of these names (not an emoji).
const REGISTRY = {
  Building2, MapPin, Zap, ClipboardList, Settings2, Handshake,
  DollarSign, Scale, Leaf, BarChart3, ShieldCheck,
};

/**
 * CategoryIcon — renders a lucide-react icon by registry name.
 * @param {object} props
 * @param {string} props.name lucide icon name (see REGISTRY)
 * @param {number} [props.size=16] icon size in px
 * @param {string} [props.color] CSS color (defaults to currentColor)
 */
export default function CategoryIcon({ name, size = 16, color, ...rest }) {
  const Glyph = REGISTRY[name] || FileText; // safe fallback, never an empty render
  return <Glyph size={size} color={color || 'currentColor'} strokeWidth={1.75} aria-hidden="true" {...rest} />;
}

CategoryIcon.propTypes = {
  name: PropTypes.string,
  size: PropTypes.number,
  color: PropTypes.string,
};
