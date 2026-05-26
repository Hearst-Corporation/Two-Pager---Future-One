// GET /api/admin/hearst/catalog/gpus
//
// Renvoie le catalogue GPU. Tente d'abord crm.hearst_gpu_catalog (DB seed),
// fallback sur GPU_CATALOG (constants in-memory) si la table est vide ou
// inexistante.

import { NextResponse } from 'next/server';
import { requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { GPU_CATALOG, mergeCatalog } from '@/lib/hearst-gpu-catalog';

export async function GET() {
  const auth = await requireProfile('viewer');
  if (auth instanceof NextResponse) return auth;

  let remote = [];
  try {
    const supa = getAdminClient();
    const { data, error } = await supa
      .from('hearst_gpu_catalog')
      .select('*')
      .order('sku');
    if (!error && Array.isArray(data)) {
      remote = data;
    }
  } catch (e) {
    // Table pas encore créée — on tombe sur le fallback
  }

  const gpus = mergeCatalog(GPU_CATALOG, remote);
  return NextResponse.json({ gpus, source: remote.length > 0 ? 'db' : 'in_memory' }, {
    headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=3600' },
  });
}
