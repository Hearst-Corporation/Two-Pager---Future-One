import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';
import { z } from 'zod';

const DEAL_STATUS_VALUES = ['prospecting', 'term_sheet_sent', 'due_diligence', 'negotiation', 'signed', 'live'];
const DEAL_TYPE_VALUES = ['powered_shell', 'wholesale_lease', 'hyperscale_anchor', 'jv', 'sale_leaseback', 'manage_only'];

const DealCreateSchema = z.object({
  project_id: z.string().uuid(),
  operator_id: z.string().min(1).max(100),
  operator_name: z.string().min(1).max(200),
  deal_type: z.enum(DEAL_TYPE_VALUES),
  status: z.enum(DEAL_STATUS_VALUES).default('prospecting'),
  capacity_mw: z.number().finite().min(0).max(10000).optional().nullable(),
  price_kw_month: z.number().finite().min(0).max(10000).optional().nullable(),
  contract_term_years: z.number().int().min(1).max(50).optional().nullable(),
  expected_close_date: z.string().min(1).max(40).optional().nullable(),
  linked_scenario_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
}).strict();

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

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get('project_id');
    if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 });

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('hearst_deals')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at', { ascending: false });

    if (error) {
      // Table may not exist yet — return empty array gracefully
      if (error.code === '42P01') return NextResponse.json({ deals: [] });
      throw error;
    }
    return NextResponse.json({ deals: data || [] });
  } catch (err) {
    console.error('[deals GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = DealCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('hearst_deals')
      .insert([parsed.data])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ deal: data }, { status: 201 });
  } catch (err) {
    console.error('[deals POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
