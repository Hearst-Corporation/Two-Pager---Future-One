import { describe, expect, it } from 'vitest';
import { buildHearstSourceRegister, normalizePublicSourceRow } from '@/lib/hearst-sources-catalog';

describe('hearst-sources-catalog', () => {
  it('normalizes public library rows for the Sources API shape', () => {
    const row = normalizePublicSourceRow({
      id: 'source-1',
      metric_id: 'pue',
      metric_name: 'PUE',
      source_name: 'Example Source',
      source_type: 'official_source',
      url: 'https://example.com',
      date_published: '2025-01-01',
    });

    expect(row).toMatchObject({
      id: 'source-1',
      source_url: 'https://example.com',
      used_in_model: true,
      project_id: null,
      triangulation_status: 'single',
      used_in_scenario: 'all',
    });
  });

  it('merges project rows with public library rows', () => {
    const rows = buildHearstSourceRegister({
      projectSources: [
        {
          id: 'db-source-1',
          metric_id: 'pue',
          metric_name: 'Project PUE',
          source_name: 'Uploaded PUE',
          source_type: 'uploaded_document',
          created_at: '2026-06-17T00:00:00.000Z',
        },
      ],
      metric_id: 'pue',
    });

    expect(rows[0]).toMatchObject({
      id: 'db-source-1',
      metric_name: 'Project PUE',
    });
    expect(rows.some((row) => row.id === 'eqx_pue')).toBe(true);
    expect(rows.some((row) => row.id === 'ntt_pue')).toBe(true);
  });
});
