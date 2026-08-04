import { EMISSION_FACTORS } from '../data/esg';
import { mapScopeToFramework } from '../data/frameworks';
import type { ScopeCategory, ReviewStatus } from '../types';

export interface EmissionsCalcResult {
  tco2e: number;
  factorUsed: number;
  factorUnit: string;
  factorCitation: string;
  mapping: ReturnType<typeof mapScopeToFramework>;
}

export function calculateEmissions(
  activityType: string,
  rawQuantity: number,
  scope: ScopeCategory
): EmissionsCalcResult {
  const ef = EMISSION_FACTORS[activityType];
  if (!ef) {
    return {
      tco2e: 0,
      factorUsed: 0,
      factorUnit: 'unknown',
      factorCitation: 'No factor found',
      mapping: mapScopeToFramework(scope),
    };
  }

  const totalKg = rawQuantity * ef.factor;
  const totalT = totalKg / 1000;

  return {
    tco2e: Number(totalT.toFixed(6)),
    factorUsed: ef.factor,
    factorUnit: ef.unit,
    factorCitation: ef.citation,
    mapping: mapScopeToFramework(scope),
  };
}

export function generateDisclosureFromActivity(
  framework: string,
  indicator: string,
  tco2e: number,
  source: string,
  user: string
): {
  framework: string;
  indicator: string;
  indicator_name: string | null;
  value_text: string | null;
  value_numeric: number;
  unit: string;
  source: string;
  review_status: ReviewStatus;
  last_modified_by: string;
} {
  return {
    framework,
    indicator,
    indicator_name: null,
    value_text: null,
    value_numeric: Number(tco2e.toFixed(4)),
    unit: 'tCO2e',
    source,
    review_status: 'draft' as ReviewStatus,
    last_modified_by: user,
  };
}

export function aggregateEmissionsByScope(activities: Array<{ scope_category: ScopeCategory; calculated_tco2e: number | null }>): {
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
} {
  let scope1 = 0, scope2 = 0, scope3 = 0;
  for (const a of activities) {
    const val = a.calculated_tco2e || 0;
    if (a.scope_category === 'scope1') scope1 += val;
    else if (a.scope_category === 'scope2') scope2 += val;
    else scope3 += val;
  }
  return { scope1, scope2, scope3, total: scope1 + scope2 + scope3 };
}
