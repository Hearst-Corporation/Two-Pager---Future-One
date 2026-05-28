import { redirect } from 'next/navigation';

// /admin/hearst/hub — coquille de section.
// Redirige vers le premier tab (Pipeline) qui est l'écran d'entrée naturel
// pour l'ops/CRM. Les tabs internes (Pipeline/Deals/Contracts/Data Room)
// sont rendus par <SectionTabs section="hub" /> sur chaque page concernée.
export default function HubIndex() {
  redirect('/admin/hearst/pipeline');
}
