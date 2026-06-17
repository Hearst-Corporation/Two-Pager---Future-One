import { PUBLIC_SOURCES_LIBRARY } from './oracle-intelligence/source-library.js';

function sortSourcesDescending(left, right) {
  const leftDate = left.date_published || left.created_at || '';
  const rightDate = right.date_published || right.created_at || '';
  return String(rightDate).localeCompare(String(leftDate));
}

export function normalizePublicSourceRow(source) {
  return {
    ...source,
    project_id: null,
    source_url: source.url,
    used_in_model: true,
    admin_override: false,
    triangulation_status: source.triangulation_status || 'single',
    used_in_scenario: source.used_in_scenario || 'all',
    created_at: source.created_at || source.date_published || null,
    updated_at: source.updated_at || source.date_published || null,
    last_updated: source.last_updated || source.date_published || null,
  };
}

export function buildHearstSourceRegister({
  projectSources = [],
  metric_id = null,
  source_type = null,
} = {}) {
  const normalizedPublicSources = PUBLIC_SOURCES_LIBRARY
    .map(normalizePublicSourceRow)
    .filter((source) => !metric_id || source.metric_id === metric_id)
    .filter((source) => !source_type || source.source_type === source_type);

  const normalizedProjectSources = (projectSources || [])
    .filter((source) => !metric_id || source.metric_id === metric_id)
    .filter((source) => !source_type || source.source_type === source_type);

  return [...normalizedProjectSources, ...normalizedPublicSources].sort(sortSourcesDescending);
}
