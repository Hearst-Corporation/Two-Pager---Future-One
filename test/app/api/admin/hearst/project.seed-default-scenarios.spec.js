import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireProfile = vi.fn();
const authedWrite = vi.fn();
const getAdminClient = vi.fn();

vi.mock('@/lib/supabase-admin', () => ({
  requireProfile,
  authedWrite,
  getAdminClient,
}));

describe('Hearst project auto-seeding', () => {
  beforeEach(() => {
    vi.resetModules();
    requireProfile.mockReset();
    authedWrite.mockReset();
    getAdminClient.mockReset();
    requireProfile.mockResolvedValue({ actor: 'user-1', profile: { id: 'user-1', role: 'viewer' } });
  });

  it('seeds complete default scenarios when the project does not exist', async () => {
    const insertedScenarios = [];
    const projectUpdates = [];
    let fetchProjectCalls = 0;

    const supa = {
      from(table) {
        if (table === 'hearst_projects') {
          return {
            select() {
              return {
                limit: vi.fn().mockImplementation(async () => {
                  fetchProjectCalls += 1;
                  return { data: fetchProjectCalls <= 2 ? [] : [{ id: 'project-1', name: 'Hearst', hearst_scenarios: [] }] };
                }),
                single: vi.fn().mockResolvedValue({ data: { id: 'project-1', name: 'Hearst' }, error: null }),
              };
            },
            insert(payload) {
              expect(payload.created_by).toBe('user-1');
              return {
                select() {
                  return {
                    single: vi.fn().mockResolvedValue({ data: { id: 'project-1', ...payload }, error: null }),
                  };
                },
              };
            },
            update(payload) {
              return {
                eq: vi.fn().mockImplementation(async (column, value) => {
                  projectUpdates.push({ payload, column, value });
                  return { error: null };
                }),
              };
            },
          };
        }

        if (table === 'hearst_scenarios') {
          return {
            insert(payload) {
              insertedScenarios.push(payload);
              return {
                select() {
                  return {
                    single: vi.fn().mockResolvedValue({
                      data: { id: `${payload.scenario_type}-id`, ...payload },
                      error: null,
                    }),
                  };
                },
              };
            },
          };
        }

        if (table === 'hearst_data_room' || table === 'hearst_contracts') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    };

    getAdminClient.mockReturnValue(supa);

    const { GET } = await import('@/app/api/admin/hearst/project/route.js');
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.project.id).toBe('project-1');
    expect(insertedScenarios).toHaveLength(3);

    for (const scenario of insertedScenarios) {
      expect(scenario.project_id).toBe('project-1');
      expect(scenario.created_by).toBe('user-1');
      expect(scenario.total_mw).toBeGreaterThan(0);
      expect(scenario.pue).toBeGreaterThan(0);
      expect(scenario.target_occupancy_pct).toBeGreaterThan(1);
      expect(scenario.capex_contingency_pct).toBeGreaterThan(1);
      expect(scenario.annual_escalation_pct).toBeGreaterThan(1);
      expect(scenario.commercial_split).toBeTruthy();
    }

    expect(insertedScenarios.map((scenario) => scenario.name)).toEqual([
      'Base Case',
      'Downside Case',
      'Upside Case',
    ]);
    expect(projectUpdates).toEqual([
      {
        payload: { active_scenario_id: 'base-id' },
        column: 'id',
        value: 'project-1',
      },
    ]);
  });
});
