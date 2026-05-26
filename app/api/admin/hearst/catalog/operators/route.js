// GET /api/admin/hearst/catalog/operators
//
// Renvoie la liste des OPERATORS (lib/hearst-constants.js) agrégée avec des
// statistiques dérivées de PUBLIC_SOURCES_LIBRARY (nombre de sources par
// opérateur, moyennes capex/pricing). Pas de DB call — source de vérité côté
// constants.

import { NextResponse } from 'next/server';
import { requireProfile } from '@/lib/supabase-admin';
import { OPERATORS, PUBLIC_SOURCES_LIBRARY } from '@/lib/hearst-constants';

function mean(values) {
  const v = values.filter(x => x != null && Number.isFinite(x));
  if (v.length === 0) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

export async function GET() {
  const auth = await requireProfile('viewer');
  if (auth instanceof NextResponse) return auth;

  // Group sources par operator_id pour des agrégats
  const sourcesByOp = new Map();
  for (const s of PUBLIC_SOURCES_LIBRARY) {
    if (!s.operator_id) continue;
    const arr = sourcesByOp.get(s.operator_id) || [];
    arr.push(s);
    sourcesByOp.set(s.operator_id, arr);
  }

  const operators = OPERATORS.map(op => {
    const sources = sourcesByOp.get(op.id) || [];
    const capex_total = sources.filter(s => s.metric_id === 'capex_total_per_mw').map(s => s.value);
    const pricing = sources
      .filter(s => /^price_/.test(s.metric_id))
      .map(s => s.value);
    return {
      ...op,
      aggregated: {
        sources_count: sources.length,
        avg_capex_per_mw: mean(capex_total),
        avg_pricing_kw_month: mean(pricing),
      },
    };
  });

  return NextResponse.json({ operators }, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
  });
}
