import { redirect } from 'next/navigation';

// /admin/hearst/library — coquille de section.
// Redirige vers le premier tab (Sources) qui est l'écran d'entrée naturel
// pour le référentiel. Les tabs internes sont rendus par
// <SectionTabs section="library" /> sur chaque page concernée.
export default function LibraryIndex() {
  redirect('/admin/hearst/sources');
}
