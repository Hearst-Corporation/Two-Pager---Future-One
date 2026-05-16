// test/validators/hearst.spec.js
// Vitest-style unit tests for lib/validators/hearst.js.
// Vitest is not yet wired in (A8 owns the runner). These tests will run as
// soon as `vitest` is installed and `npm test` is configured.

import { describe, it, expect } from 'vitest';
import {
  AdvisorRequestSchema,
  ProjectUpdateSchema,
  ScenarioCreateSchema,
  ScenarioUpdateSchema,
  SourceCreateSchema,
  SourceUpdateSchema,
  ContractCreateSchema,
  ContractUpdateSchema,
  DataRoomCreateSchema,
  DataRoomUpdateSchema,
  PipelineCreateSchema,
  PipelineUpdateSchema,
} from '../../lib/validators/hearst.js';

const UUID = '11111111-1111-4111-8111-111111111111';

function expectIssueWithPath(result, pathSegment) {
  expect(result.success).toBe(false);
  if (result.success) return;
  const flat = result.error.issues
    .map((i) => [...i.path, ...(i.keys || [])].join('.'))
    .join('|');
  expect(flat).toContain(pathSegment);
}

// ────────────────────────────────────────────────────────────────────────
// AdvisorRequestSchema
// ────────────────────────────────────────────────────────────────────────
describe('AdvisorRequestSchema', () => {
  it('accepts a minimal valid request with `message`', () => {
    const r = AdvisorRequestSchema.safeParse({
      project_id: UUID,
      message: 'What is the IRR?',
    });
    expect(r.success).toBe(true);
  });

  it('accepts a request with `messages` array', () => {
    const r = AdvisorRequestSchema.safeParse({
      project_id: UUID,
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(r.success).toBe(true);
  });

  it('rejects { project_id: "not-uuid", message: "hi" } with a meaningful error', () => {
    const r = AdvisorRequestSchema.safeParse({ project_id: 'not-uuid', message: 'hi' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const projectIssue = r.error.issues.find((i) => i.path[0] === 'project_id');
      expect(projectIssue).toBeDefined();
      // Zod's uuid error code is 'invalid_string' with validation 'uuid'
      expect(projectIssue.code).toBe('invalid_string');
    }
  });

  it('rejects when both message and messages are missing', () => {
    const r = AdvisorRequestSchema.safeParse({ project_id: UUID });
    expect(r.success).toBe(false);
  });

  it('rejects unknown top-level keys (strict)', () => {
    const r = AdvisorRequestSchema.safeParse({
      project_id: UUID,
      message: 'hi',
      stowaway: true,
    });
    expectIssueWithPath(r, 'stowaway');
  });

  // Regression: real clients send a page_context object with many extra keys
  // (HEARST_PAGE_CONTEXT[path]: title, mission, keyFields, advisorTips, …).
  // PageContextSchema must passthrough unknown keys instead of 400-ing.
  it('accepts a page_context with cosmetic UI keys (passthrough)', () => {
    const r = AdvisorRequestSchema.safeParse({
      project_id: UUID,
      messages: [{ role: 'user', content: 'hi' }],
      page_context: {
        path: '/admin/hearst',
        page: 'cockpit',
        title: 'Cockpit',
        mission: 'Run the show',
        keyFields: ['phase1_mw', 'pue'],
        keyOutputs: ['irr'],
        keyTerms: { irr: 'Internal Rate of Return' },
        qatarDefaults: { electricity_price_mwh: 30 },
        advisorTips: ['ask about PUE'],
        suggestedPrompts: ['What is the IRR?'],
      },
    });
    expect(r.success).toBe(true);
  });

  // Regression: clients pass `page_context: pageContext || null` — null is a
  // valid value, not "missing", so .nullable() must be on the field.
  it('accepts page_context: null (nullable)', () => {
    const r = AdvisorRequestSchema.safeParse({
      project_id: UUID,
      messages: [{ role: 'user', content: 'hi' }],
      page_context: null,
    });
    expect(r.success).toBe(true);
  });

  // Regression: with only the singular `message` and no `messages`, the
  // request must still be accepted (the route normalises it).
  it('accepts a request with only a singular `message` field', () => {
    const r = AdvisorRequestSchema.safeParse({
      project_id: UUID,
      message: 'hello',
    });
    expect(r.success).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────
// ProjectUpdateSchema
// ────────────────────────────────────────────────────────────────────────
describe('ProjectUpdateSchema', () => {
  it('accepts a valid partial update', () => {
    const r = ProjectUpdateSchema.safeParse({ id: UUID, name: 'New Name' });
    expect(r.success).toBe(true);
  });

  it('requires id', () => {
    const r = ProjectUpdateSchema.safeParse({ name: 'New Name' });
    expectIssueWithPath(r, 'id');
  });

  it('rejects unknown keys (strict mode)', () => {
    const r = ProjectUpdateSchema.safeParse({ id: UUID, secret_admin_flag: true });
    expectIssueWithPath(r, 'secret_admin_flag');
  });

  it('rejects an invalid site_readiness enum', () => {
    const r = ProjectUpdateSchema.safeParse({ id: UUID, site_readiness: 'haunted' });
    expectIssueWithPath(r, 'site_readiness');
  });
});

// ────────────────────────────────────────────────────────────────────────
// ScenarioCreateSchema / ScenarioUpdateSchema
// ────────────────────────────────────────────────────────────────────────
describe('ScenarioCreateSchema', () => {
  it('accepts a minimal valid create', () => {
    const r = ScenarioCreateSchema.safeParse({
      project_id: UUID,
      name: 'Base Case',
      scenario_type: 'base',
    });
    expect(r.success).toBe(true);
  });

  it('accepts `kind` as an alias for scenario_type', () => {
    const r = ScenarioCreateSchema.safeParse({
      project_id: UUID,
      name: 'Stress',
      kind: 'downside',
    });
    expect(r.success).toBe(true);
  });

  it('rejects when both scenario_type and kind are missing', () => {
    const r = ScenarioCreateSchema.safeParse({ project_id: UUID, name: 'X' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid scenario_type', () => {
    const r = ScenarioCreateSchema.safeParse({
      project_id: UUID,
      name: 'X',
      scenario_type: 'wishful',
    });
    expectIssueWithPath(r, 'scenario_type');
  });

  it('rejects unknown keys', () => {
    const r = ScenarioCreateSchema.safeParse({
      project_id: UUID,
      name: 'X',
      scenario_type: 'base',
      malicious: 'payload',
    });
    expectIssueWithPath(r, 'malicious');
  });
});

describe('ScenarioUpdateSchema', () => {
  it('accepts an empty patch', () => {
    const r = ScenarioUpdateSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it('accepts a numeric capex override', () => {
    const r = ScenarioUpdateSchema.safeParse({ capex_shell_per_mw: 7_000_000 });
    expect(r.success).toBe(true);
  });

  it('rejects unknown keys (strict)', () => {
    const r = ScenarioUpdateSchema.safeParse({ admin_bypass: true });
    expectIssueWithPath(r, 'admin_bypass');
  });

  it('rejects non-finite numbers', () => {
    const r = ScenarioUpdateSchema.safeParse({ pue: Number.POSITIVE_INFINITY });
    expectIssueWithPath(r, 'pue');
  });

  it('rejects out-of-range probability/pct', () => {
    const r = ScenarioUpdateSchema.safeParse({ target_occupancy_pct: 250 });
    expectIssueWithPath(r, 'target_occupancy_pct');
  });
});

// ────────────────────────────────────────────────────────────────────────
// SourceCreateSchema / SourceUpdateSchema
// ────────────────────────────────────────────────────────────────────────
describe('SourceCreateSchema', () => {
  it('accepts a valid source row', () => {
    const r = SourceCreateSchema.safeParse({
      metric_id: 'pue',
      metric_name: 'Power Usage Effectiveness',
      source_name: 'Uptime Institute',
      source_type: 'official_source',
    });
    expect(r.success).toBe(true);
  });

  it('rejects an unknown source_type', () => {
    const r = SourceCreateSchema.safeParse({
      metric_id: 'pue',
      metric_name: 'PUE',
      source_name: 'Anon',
      source_type: 'rumor',
    });
    expectIssueWithPath(r, 'source_type');
  });
});

describe('SourceUpdateSchema', () => {
  it('accepts a partial update with a single field', () => {
    const r = SourceUpdateSchema.safeParse({ confidence_score: 4 });
    expect(r.success).toBe(true);
  });

  it('rejects unknown keys (strict)', () => {
    const r = SourceUpdateSchema.safeParse({ confidence_score: 4, evil: true });
    expectIssueWithPath(r, 'evil');
  });
});

// ────────────────────────────────────────────────────────────────────────
// ContractCreateSchema / ContractUpdateSchema
// ────────────────────────────────────────────────────────────────────────
describe('ContractCreateSchema', () => {
  it('accepts a valid contract', () => {
    const r = ContractCreateSchema.safeParse({
      project_id: UUID,
      document_type: 'lease',
      title: 'Master Colocation Services Agreement',
    });
    expect(r.success).toBe(true);
  });

  it('rejects missing required title', () => {
    const r = ContractCreateSchema.safeParse({
      project_id: UUID,
      document_type: 'lease',
    });
    expectIssueWithPath(r, 'title');
  });
});

describe('ContractUpdateSchema', () => {
  it('accepts an empty patch', () => {
    const r = ContractUpdateSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it('rejects unknown keys (strict)', () => {
    const r = ContractUpdateSchema.safeParse({ title: 'X', stash: 1 });
    expectIssueWithPath(r, 'stash');
  });
});

// ────────────────────────────────────────────────────────────────────────
// DataRoomCreateSchema / DataRoomUpdateSchema
// ────────────────────────────────────────────────────────────────────────
describe('DataRoomCreateSchema', () => {
  it('accepts a valid data room item', () => {
    const r = DataRoomCreateSchema.safeParse({
      project_id: UUID,
      category: 'power',
      document_type: 'power',
      title: 'Power Allocation Letter',
    });
    expect(r.success).toBe(true);
  });

  it('rejects an invalid category', () => {
    const r = DataRoomCreateSchema.safeParse({
      project_id: UUID,
      category: 'paranormal',
      document_type: 'x',
      title: 'X',
    });
    expectIssueWithPath(r, 'category');
  });
});

describe('DataRoomUpdateSchema', () => {
  it('accepts a status patch', () => {
    const r = DataRoomUpdateSchema.safeParse({ status: 'approved' });
    expect(r.success).toBe(true);
  });

  it('rejects unknown keys (strict)', () => {
    const r = DataRoomUpdateSchema.safeParse({ status: 'approved', sneak: true });
    expectIssueWithPath(r, 'sneak');
  });

  it('rejects an invalid status enum', () => {
    const r = DataRoomUpdateSchema.safeParse({ status: 'gone_missing' });
    expectIssueWithPath(r, 'status');
  });
});

// ────────────────────────────────────────────────────────────────────────
// PipelineCreateSchema / PipelineUpdateSchema
// ────────────────────────────────────────────────────────────────────────
describe('PipelineCreateSchema', () => {
  it('accepts a valid prospect with enum prospect_type', () => {
    const r = PipelineCreateSchema.safeParse({
      project_id: UUID,
      prospect_name: 'CoreWeave',
      prospect_type: 'neocloud',
      mw_requested: 30,
      probability_pct: 60,
      status: 'loi',
    });
    expect(r.success).toBe(true);
  });

  it('accepts a free-text prospect_type', () => {
    const r = PipelineCreateSchema.safeParse({
      project_id: UUID,
      prospect_name: 'Local Bank',
      prospect_type: 'qatar bank consortium',
    });
    expect(r.success).toBe(true);
  });

  it('rejects probability_pct above 100', () => {
    const r = PipelineCreateSchema.safeParse({
      project_id: UUID,
      prospect_name: 'X',
      prospect_type: 'enterprise',
      probability_pct: 250,
    });
    expectIssueWithPath(r, 'probability_pct');
  });
});

describe('PipelineUpdateSchema', () => {
  it('accepts a partial status update', () => {
    const r = PipelineUpdateSchema.safeParse({ status: 'contracted' });
    expect(r.success).toBe(true);
  });

  it('rejects unknown keys (strict)', () => {
    const r = PipelineUpdateSchema.safeParse({ status: 'loi', secret: 'no' });
    expectIssueWithPath(r, 'secret');
  });
});
