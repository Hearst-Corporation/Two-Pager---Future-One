const SCALAR_PERCENT_FIELDS = [
  'target_occupancy_pct',
  'capex_contingency_pct',
  'annual_escalation_pct',
  'opex_maintenance_pct',
  'opex_insurance_pct',
  'opex_ga_pct',
  'opex_operator_mgmt_fee_pct',
  'equity_hearst_pct',
  'equity_brookfield_pct',
  'equity_qatar_pct',
  'debt_pct',
  'debt_interest_rate',
];

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRatioLike(value) {
  return isFiniteNumber(value) && value !== 0 && Math.abs(value) <= 1;
}

function sumNumericValues(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const values = Object.values(obj).filter(isFiniteNumber);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

function scaleIfLegacy(value, legacy) {
  if (!legacy || !isRatioLike(value)) return value;
  return value * 100;
}

function normalizeNestedPercentObject(obj, keys, legacy) {
  if (!obj || typeof obj !== 'object') return obj;

  let changed = false;
  const next = { ...obj };
  for (const key of keys) {
    const scaled = scaleIfLegacy(next[key], legacy);
    if (scaled !== next[key]) {
      next[key] = scaled;
      changed = true;
    }
  }

  return changed ? next : obj;
}

export function isLegacyPercentScenario(row) {
  if (!row || typeof row !== 'object') return false;

  const ratioScalarCount = SCALAR_PERCENT_FIELDS.filter((field) => isRatioLike(row[field])).length;

  const equitySum = [row.equity_hearst_pct, row.equity_brookfield_pct, row.equity_qatar_pct]
    .filter(isFiniteNumber)
    .reduce((sum, value) => sum + value, 0);
  const hasLegacyEquity = equitySum > 0 && equitySum <= 1.01;

  const commercialSplitSum = sumNumericValues(row.commercial_split);
  const hasLegacyCommercialSplit =
    commercialSplitSum != null && commercialSplitSum > 0 && commercialSplitSum <= 1.01;

  const hardwareMix = row.hardware_mix;
  const hardwareMixSum = sumNumericValues(
    hardwareMix && {
      classic_pct: hardwareMix.classic_pct,
      liquid_pct: hardwareMix.liquid_pct,
      ai_pct: hardwareMix.ai_pct,
    },
  );
  const hasLegacyHardwareMix =
    hardwareMixSum != null && hardwareMixSum > 0 && hardwareMixSum <= 1.01;

  return (
    isRatioLike(row.target_occupancy_pct) ||
    isRatioLike(row.debt_pct) ||
    hasLegacyEquity ||
    hasLegacyCommercialSplit ||
    hasLegacyHardwareMix ||
    ratioScalarCount >= 3
  );
}

export function normalizeScenarioForRead(row) {
  if (!row || typeof row !== 'object') return row;

  const legacy = isLegacyPercentScenario(row);
  if (!legacy) return row;

  const next = { ...row };

  for (const field of SCALAR_PERCENT_FIELDS) {
    next[field] = scaleIfLegacy(next[field], legacy);
  }

  if (next.commercial_split && typeof next.commercial_split === 'object') {
    next.commercial_split = Object.fromEntries(
      Object.entries(next.commercial_split).map(([key, value]) => [key, scaleIfLegacy(value, legacy)]),
    );
  }

  next.hardware_mix = normalizeNestedPercentObject(next.hardware_mix, [
    'classic_pct',
    'liquid_pct',
    'ai_pct',
    'utilization_pct',
  ], legacy);

  if (Array.isArray(next.hardware_mix?.gpu_mix)) {
    next.hardware_mix = {
      ...next.hardware_mix,
      gpu_mix: next.hardware_mix.gpu_mix.map((entry) => ({
        ...entry,
        pct: scaleIfLegacy(entry?.pct, legacy),
      })),
    };
  }

  return next;
}
