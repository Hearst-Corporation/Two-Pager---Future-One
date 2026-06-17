import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireProfile = vi.fn();
const getAdminClient = vi.fn();
const requireRowOwnership = vi.fn();

vi.mock('@/lib/supabase-admin', () => ({
  requireProfile,
  getAdminClient,
}));

vi.mock('@/lib/auth-guards', () => ({
  requireRowOwnership,
}));

function buildMemoRow(status) {
  return {
    id: 'memo-1',
    status,
    title: 'Memo Title',
    version: 1,
    created_at: '2026-06-15T00:00:00.000Z',
    stakeholder: 'operator',
    region: 'qatar',
    provider_used: 'openai',
    memo_json: {
      _exec_projection: {
        total_capex: 100_000_000,
        irr: 0.12,
        npv: 50_000_000,
        payback_years: 5,
        years: [{ year: 1, calendar_year: 2026, ebitda: 1, revenue: 1 }],
      },
      key_financial_metrics: {
        metrics: [{ label: 'Debt / leverage', source: 'engine', value: 45, unit: '%' }],
      },
      confidence_block: {},
      executive_summary: {},
      risks_constraints: {},
      deployment_roadmap: {},
      recommended_architecture: {},
      strategic_context: {},
      commercialization_strategy: {},
    },
  };
}

function createPdfRouteClient(row) {
  return {
    from(table) {
      expect(table).toBe('strategic_memos');
      return {
        select() {
          return {
            eq(column, value) {
              expect(column).toBe('id');
              expect(value).toBe('memo-1');
              return {
                maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
              };
            },
          };
        },
      };
    },
  };
}

describe('strategic memo PDF gating', () => {
  beforeEach(() => {
    vi.resetModules();
    requireProfile.mockReset();
    getAdminClient.mockReset();
    requireRowOwnership.mockReset();

    requireProfile.mockResolvedValue({ actor: 'user-1', profile: { id: 'user-1', role: 'viewer' } });
    requireRowOwnership.mockResolvedValue(undefined);
  });

  it('rejects draft memo exports before rendering HTML', async () => {
    getAdminClient.mockReturnValue(createPdfRouteClient(buildMemoRow('draft')));
    const { GET } = await import('@/app/api/admin/hearst/strategic-memos/[id]/pdf/route.js');

    const res = await GET(new Request('http://localhost/api/admin/hearst/strategic-memos/memo-1/pdf?format=html'), {
      params: { id: 'memo-1' },
    });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: 'memo_not_exportable',
    });
  });

  it('allows reviewed memo HTML export', async () => {
    getAdminClient.mockReturnValue(createPdfRouteClient(buildMemoRow('reviewed')));
    const { GET } = await import('@/app/api/admin/hearst/strategic-memos/[id]/pdf/route.js');

    const res = await GET(new Request('http://localhost/api/admin/hearst/strategic-memos/memo-1/pdf?format=html'), {
      params: { id: 'memo-1' },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    await expect(res.text()).resolves.toContain('Memo Title');
  });
});
