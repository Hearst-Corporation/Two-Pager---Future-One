// GET /api/admin/hearst/deals
//
// Read-only catalogue of deal archetypes from the Hearst engine.
// No DB, no writes — exposes summary fields safe for the FUTUR ONE front.

import { NextResponse } from 'next/server';
import { requireProfile } from '@/lib/supabase-admin';
import { DEAL_ARCHETYPES, PRIMARY_MODEL_IDS } from '@/lib/hearst-deal-structures';

const SIMULATOR_ARCHETYPE_IDS = new Set([
  'powered_shell',
  'neocloud_gpu',
  'sovereign_ai',
]);

function toCatalogEntry(archetype) {
  return {
    id: archetype.id,
    code: archetype.code,
    label: archetype.label,
    short: archetype.short,
    description: archetype.description,
    operator_role: archetype.operator_role,
    compute_as: archetype.compute_as ?? null,
    scores: archetype.scores ?? null,
    recommended: Boolean(archetype.recommended),
    primary_model: PRIMARY_MODEL_IDS.includes(archetype.id),
    in_projection: SIMULATOR_ARCHETYPE_IDS.has(archetype.id),
    deal_terms: Array.isArray(archetype.deal_terms) ? archetype.deal_terms : null,
    real_comp: archetype.real_comp ?? null,
  };
}

export async function GET() {
  const auth = await requireProfile('viewer');
  if (auth instanceof NextResponse) return auth;

  const deals = DEAL_ARCHETYPES.map(toCatalogEntry);
  return NextResponse.json({ deals, count: deals.length });
}
