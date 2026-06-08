// CSS cockpit en layout serveur — évite le flash / écrasement des --cp-* au refresh
// (imports dans un 'use client' layout arrivent après hydratation).
import './cp-tokens.css';
import './cockpit.css';
import './oracle-layout.css';
import '@/components/hearst/chat-fab.css';
import HearstLayoutClient from './HearstLayoutClient';

export default function HearstLayout({ children }) {
  return <HearstLayoutClient>{children}</HearstLayoutClient>;
}
