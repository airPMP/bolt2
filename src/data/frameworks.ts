import type { ScopeCategory, ReviewStatus, ESGFramework } from '../types';

export interface FrameworkMapping {
  gri: string;
  brsr: string | null;
  sbti: string;
  csrd: string | null;
  cdp: string | null;
}

export function mapScopeToFramework(scope: ScopeCategory): FrameworkMapping {
  switch (scope) {
    case 'scope1':
      return { gri: 'GRI 305-1', brsr: 'BRSR Principle 6', sbti: 'Absolute Base Reduction', csrd: 'ESRS E1-6', cdp: 'C4.3' };
    case 'scope2':
      return { gri: 'GRI 305-2', brsr: 'BRSR Principle 6', sbti: 'Market/Location Based Target', csrd: 'ESRS E1-6', cdp: 'C4.3' };
    case 'scope3':
      return { gri: 'GRI 305-3', brsr: 'BRSR Principle 6', sbti: 'Value Chain Engagement', csrd: 'ESRS E1-6', cdp: 'C4.3' };
  }
}

export interface FrameworkIndicator {
  id: string;
  framework: ESGFramework;
  indicator: string;
  name: string;
  description: string;
}

export const FRAMEWORK_INDICATORS: FrameworkIndicator[] = [
  { id: 'gri-305-1', framework: 'GRI', indicator: 'GRI 305-1', name: 'Direct (Scope 1) GHG Emissions', description: 'Direct GHG emissions from sources owned or controlled by the organization' },
  { id: 'gri-305-2', framework: 'GRI', indicator: 'GRI 305-2', name: 'Energy Indirect (Scope 2) GHG Emissions', description: 'Indirect emissions from generation of purchased energy' },
  { id: 'gri-305-3', framework: 'GRI', indicator: 'GRI 305-3', name: 'Other Indirect (Scope 3) GHG Emissions', description: 'Other indirect emissions in the value chain' },
  { id: 'gri-305-4', framework: 'GRI', indicator: 'GRI 305-4', name: 'GHG Emissions Intensity', description: 'Emissions intensity per unit of revenue or production' },
  { id: 'gri-305-5', framework: 'GRI', indicator: 'GRI 305-5', name: 'Reduction of GHG Emissions', description: 'Reduction initiatives and achieved reductions' },
  { id: 'gri-302-1', framework: 'GRI', indicator: 'GRI 302-1', name: 'Energy Consumption Within Organization', description: 'Total energy consumption within the organization' },
  { id: 'gri-302-4', framework: 'GRI', indicator: 'GRI 302-4', name: 'Reduction of Energy Consumption', description: 'Reduction initiatives and achieved reductions' },
  { id: 'brsr-p6-1', framework: 'BRSR', indicator: 'BRSR Principle 6', name: 'Environmental Protection (GHG)', description: 'GHG emissions (Scope 1, 2, 3) in tCO2e' },
  { id: 'brsr-p6-2', framework: 'BRSR', indicator: 'BRSR Principle 6 (Energy)', name: 'Energy & Water Consumption', description: 'Total energy and water consumed' },
  { id: 'brsr-p2-1', framework: 'BRSR', indicator: 'BRSR Principle 2', name: 'Sustainable & Safe Products', description: 'Products that are sustainable and safe' },
  { id: 'cdp-c4-3', framework: 'CDP', indicator: 'C4.3', name: 'Scope 1+2+3 Emissions', description: 'Total emissions across all scopes' },
  { id: 'cdp-c4-3a', framework: 'CDP', indicator: 'C4.3a', name: 'Scope 1 Emissions Breakdown', description: 'Breakdown by source and gas' },
  { id: 'cdp-c4-3b', framework: 'CDP', indicator: 'C4.3b', name: 'Scope 2 Emissions Breakdown', description: 'Market-based and location-based' },
  { id: 'cdp-c4-3c', framework: 'CDP', indicator: 'C4.3c', name: 'Scope 3 Emissions Breakdown', description: 'By category in the value chain' },
  { id: 'esrs-e1-6', framework: 'CSRD', indicator: 'ESRS E1-6', name: 'Gross GHG Emissions', description: 'Scope 1, 2, and 3 emissions per ESRS E1' },
  { id: 'esrs-e1-7', framework: 'CSRD', indicator: 'ESRS E1-7', name: 'GHG Intensity', description: 'Emissions intensity ratios' },
  { id: 'esrs-e5-1', framework: 'CSRD', indicator: 'ESRS E5-1', name: 'Resource Use & Circular Economy', description: 'Resource inflows and outflows' },
];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  draft: 'Draft',
  pending_validation: 'Pending Validation',
  approved_auditor: 'Approved by Auditor',
  rejected: 'Rejected',
};

export const REVIEW_STATUS_COLORS: Record<ReviewStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_validation: 'bg-amber-100 text-amber-700',
  approved_auditor: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};
