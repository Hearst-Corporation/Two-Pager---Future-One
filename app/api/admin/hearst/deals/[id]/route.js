import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';
import { z } from 'zod';

const DEAL_STATUS_VALUES = ['prospecting', 'term_sheet_sent', 'due_diligence', 'negotiation', 'signed', 'live'];
const DEAL_TYPE_VALUES = ['powered_shell', 'wholesale_lease', 'hyperscale_anchor', 'jv', 'sale_leaseback', 'manage_only'];

const DealUpdateSchema = z.object({
  operator_id: z.string().min(1).max(100).optional(),
  operator_name: z.string().min(1).max(200).optional(),
  deal_type: z.enum(DEAL_TYPE_VALUES).optional(),
  status: z.enum(DEAL_STATUS_VALUES).optional(),
  capacity_mw: z.number().finite().min(0).max(10000).optional().nullable(),
  price_kw_month: z.number().finite().min(0).max(10000).optional().nullable(),
  contract_term_years: z.number().int().min(1).max(50).optional().nullable(),
  expected_close_date: z.string().min(1).max(40).optional().nullable(),
  linked_scenario_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
}).strict();

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const parsed = DealUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('hearst_deals')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ deal: data });
  } catch (err) {
    console.error('[deals PATCH]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const supabase = getAdminClient();
    const { error } = await supabase.from('hearst_deals').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[deals DELETE]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
