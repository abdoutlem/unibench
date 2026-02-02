import { MetricValue, InstitutionMetricSeries, ConfidenceLevel } from "@/types";
import { institutions } from "./institutions";
import { metricDefinitions } from "./metrics";

// Generate realistic time series data for 10+ years
function generateTimeSeriesValue(
  baseValue: number,
  year: number,
  baseYear: number,
  growthRate: number,
  volatility: number
): number {
  const yearsFromBase = year - baseYear;
  const trendValue = baseValue * Math.pow(1 + growthRate, yearsFromBase);
  const randomFactor = 1 + (Math.random() - 0.5) * volatility;
  return Math.round(trendValue * randomFactor);
}

// Base values and growth rates for different institution types
const institutionBaseValues: Record<string, Record<string, { base: number; growth: number; volatility: number }>> = {
  "inst-001": { // SUNY Buffalo
    "metric-total-revenue": { base: 1800000000, growth: 0.03, volatility: 0.04 },
    "metric-tuition-revenue": { base: 420000000, growth: 0.025, volatility: 0.03 },
    "metric-research-expenditure": { base: 380000000, growth: 0.04, volatility: 0.06 },
    "metric-endowment": { base: 850000000, growth: 0.07, volatility: 0.15 },
    "metric-total-enrollment": { base: 32000, growth: 0.01, volatility: 0.02 },
    "metric-undergrad-enrollment": { base: 22000, growth: 0.01, volatility: 0.02 },
    "metric-grad-enrollment": { base: 10000, growth: 0.015, volatility: 0.03 },
    "metric-retention-rate": { base: 87, growth: 0.003, volatility: 0.02 },
    "metric-6yr-grad-rate": { base: 75, growth: 0.005, volatility: 0.02 },
    "metric-4yr-grad-rate": { base: 58, growth: 0.008, volatility: 0.03 },
    "metric-faculty-count": { base: 1650, growth: 0.01, volatility: 0.02 },
    "metric-student-faculty-ratio": { base: 14, growth: -0.005, volatility: 0.03 },
    "metric-deferred-maintenance": { base: 450000000, growth: 0.05, volatility: 0.08 },
    "metric-auxiliary-margin": { base: 12, growth: -0.02, volatility: 0.15 },
  },
  "inst-002": { // UT Austin
    "metric-total-revenue": { base: 3500000000, growth: 0.035, volatility: 0.04 },
    "metric-tuition-revenue": { base: 850000000, growth: 0.03, volatility: 0.03 },
    "metric-research-expenditure": { base: 720000000, growth: 0.045, volatility: 0.05 },
    "metric-endowment": { base: 3200000000, growth: 0.08, volatility: 0.12 },
    "metric-total-enrollment": { base: 51000, growth: 0.012, volatility: 0.02 },
    "metric-undergrad-enrollment": { base: 40000, growth: 0.01, volatility: 0.02 },
    "metric-grad-enrollment": { base: 11000, growth: 0.02, volatility: 0.03 },
    "metric-retention-rate": { base: 95, growth: 0.002, volatility: 0.01 },
    "metric-6yr-grad-rate": { base: 87, growth: 0.004, volatility: 0.015 },
    "metric-4yr-grad-rate": { base: 70, growth: 0.006, volatility: 0.02 },
    "metric-faculty-count": { base: 3100, growth: 0.015, volatility: 0.02 },
    "metric-student-faculty-ratio": { base: 17, growth: -0.003, volatility: 0.02 },
    "metric-deferred-maintenance": { base: 680000000, growth: 0.04, volatility: 0.07 },
    "metric-auxiliary-margin": { base: 15, growth: 0.01, volatility: 0.12 },
  },
  "inst-003": { // U of M
    "metric-total-revenue": { base: 4200000000, growth: 0.04, volatility: 0.03 },
    "metric-tuition-revenue": { base: 1100000000, growth: 0.035, volatility: 0.03 },
    "metric-research-expenditure": { base: 1600000000, growth: 0.05, volatility: 0.04 },
    "metric-endowment": { base: 12500000000, growth: 0.09, volatility: 0.10 },
    "metric-total-enrollment": { base: 47000, growth: 0.008, volatility: 0.015 },
    "metric-undergrad-enrollment": { base: 32000, growth: 0.006, volatility: 0.015 },
    "metric-grad-enrollment": { base: 15000, growth: 0.012, volatility: 0.02 },
    "metric-retention-rate": { base: 97, growth: 0.001, volatility: 0.008 },
    "metric-6yr-grad-rate": { base: 92, growth: 0.003, volatility: 0.01 },
    "metric-4yr-grad-rate": { base: 79, growth: 0.005, volatility: 0.015 },
    "metric-faculty-count": { base: 3400, growth: 0.01, volatility: 0.015 },
    "metric-student-faculty-ratio": { base: 12, growth: -0.005, volatility: 0.02 },
    "metric-deferred-maintenance": { base: 520000000, growth: 0.03, volatility: 0.06 },
    "metric-auxiliary-margin": { base: 18, growth: 0.02, volatility: 0.10 },
  },
  "inst-004": { // UC Berkeley
    "metric-total-revenue": { base: 3800000000, growth: 0.035, volatility: 0.04 },
    "metric-tuition-revenue": { base: 750000000, growth: 0.04, volatility: 0.035 },
    "metric-research-expenditure": { base: 1100000000, growth: 0.04, volatility: 0.05 },
    "metric-endowment": { base: 5800000000, growth: 0.085, volatility: 0.12 },
    "metric-total-enrollment": { base: 43000, growth: 0.01, volatility: 0.02 },
    "metric-undergrad-enrollment": { base: 31000, growth: 0.008, volatility: 0.02 },
    "metric-grad-enrollment": { base: 12000, growth: 0.015, volatility: 0.025 },
    "metric-retention-rate": { base: 97, growth: 0.001, volatility: 0.008 },
    "metric-6yr-grad-rate": { base: 93, growth: 0.002, volatility: 0.01 },
    "metric-4yr-grad-rate": { base: 76, growth: 0.006, volatility: 0.018 },
    "metric-faculty-count": { base: 1800, growth: 0.008, volatility: 0.02 },
    "metric-student-faculty-ratio": { base: 18, growth: 0.002, volatility: 0.03 },
    "metric-deferred-maintenance": { base: 890000000, growth: 0.06, volatility: 0.08 },
    "metric-auxiliary-margin": { base: 10, growth: -0.01, volatility: 0.18 },
  },
  "inst-005": { // Ohio State
    "metric-total-revenue": { base: 4100000000, growth: 0.038, volatility: 0.035 },
    "metric-tuition-revenue": { base: 980000000, growth: 0.032, volatility: 0.03 },
    "metric-research-expenditure": { base: 1050000000, growth: 0.045, volatility: 0.05 },
    "metric-endowment": { base: 5200000000, growth: 0.08, volatility: 0.11 },
    "metric-total-enrollment": { base: 61000, growth: 0.01, volatility: 0.015 },
    "metric-undergrad-enrollment": { base: 47000, growth: 0.008, volatility: 0.015 },
    "metric-grad-enrollment": { base: 14000, growth: 0.015, volatility: 0.025 },
    "metric-retention-rate": { base: 94, growth: 0.002, volatility: 0.012 },
    "metric-6yr-grad-rate": { base: 85, growth: 0.004, volatility: 0.015 },
    "metric-4yr-grad-rate": { base: 62, growth: 0.007, volatility: 0.025 },
    "metric-faculty-count": { base: 3600, growth: 0.012, volatility: 0.018 },
    "metric-student-faculty-ratio": { base: 15, growth: -0.002, volatility: 0.025 },
    "metric-deferred-maintenance": { base: 750000000, growth: 0.045, volatility: 0.07 },
    "metric-auxiliary-margin": { base: 14, growth: 0.005, volatility: 0.12 },
  },
};

// Generate benchmark institution values based on peer group averages
function generateBenchmarkBaseValues(institutionId: string): Record<string, { base: number; growth: number; volatility: number }> {
  // Use slightly different values for benchmark institutions
  const multiplier = 0.9 + Math.random() * 0.2; // 90-110% of baseline
  return {
    "metric-tuition-revenue": { base: 650000000 * multiplier, growth: 0.03, volatility: 0.04 },
    "metric-research-expenditure": { base: 600000000 * multiplier, growth: 0.04, volatility: 0.06 },
    "metric-total-enrollment": { base: 45000 * multiplier, growth: 0.01, volatility: 0.02 },
    "metric-undergrad-enrollment": { base: 35000 * multiplier, growth: 0.01, volatility: 0.02 },
    "metric-grad-enrollment": { base: 10000 * multiplier, growth: 0.015, volatility: 0.03 },
    "metric-retention-rate": { base: 90, growth: 0.003, volatility: 0.02 },
    "metric-6yr-grad-rate": { base: 82, growth: 0.004, volatility: 0.02 },
    "metric-4yr-grad-rate": { base: 65, growth: 0.006, volatility: 0.025 },
    "metric-faculty-count": { base: 2500 * multiplier, growth: 0.01, volatility: 0.02 },
    "metric-student-faculty-ratio": { base: 16, growth: -0.003, volatility: 0.03 },
  };
}

// Generate all metric values
export function generateMetricValues(): MetricValue[] {
  const values: MetricValue[] = [];
  const baseYear = 2014;
  const currentYear = 2024;

  for (const institution of institutions) {
    const baseValues = institution.isPortfolio
      ? institutionBaseValues[institution.id]
      : generateBenchmarkBaseValues(institution.id);

    if (!baseValues) continue;

    for (const metric of metricDefinitions) {
      // Skip internal metrics for non-portfolio institutions
      if (metric.isInternal && !institution.isPortfolio) continue;

      const config = baseValues[metric.id];
      if (!config) continue;

      for (let year = baseYear; year <= currentYear; year++) {
        const value = generateTimeSeriesValue(
          config.base,
          year,
          baseYear,
          config.growth,
          config.volatility
        );

        // Determine confidence based on data source and recency
        let confidence: ConfidenceLevel = "high";
        if (year === currentYear) confidence = "medium";
        if (metric.dataSource === "manual-entry") confidence = "medium";
        if (metric.dataSource === "calculated") confidence = "medium";

        values.push({
          id: `mv-${institution.id}-${metric.id}-${year}`,
          institutionId: institution.id,
          metricId: metric.id,
          fiscalYear: year,
          value,
          source: metric.dataSource,
          confidence,
          validFrom: `${year}-07-01`,
          recordedAt: `${year + 1}-02-15`,
        });
      }
    }
  }

  return values;
}

// Pre-generated values for consistent mock data
export const metricValues = generateMetricValues();

// Helper functions
export function getMetricValuesByInstitution(institutionId: string): MetricValue[] {
  return metricValues.filter((v) => v.institutionId === institutionId);
}

export function getMetricValuesByMetric(metricId: string): MetricValue[] {
  return metricValues.filter((v) => v.metricId === metricId);
}

export function getMetricTimeSeries(
  institutionId: string,
  metricId: string
): InstitutionMetricSeries | null {
  const institution = institutions.find((i) => i.id === institutionId);
  if (!institution) return null;

  const values = metricValues
    .filter((v) => v.institutionId === institutionId && v.metricId === metricId)
    .sort((a, b) => a.fiscalYear - b.fiscalYear);

  return {
    institutionId,
    institutionName: institution.name,
    metricId,
    data: values.map((v) => ({
      fiscalYear: v.fiscalYear,
      value: v.value,
      confidence: v.confidence,
    })),
  };
}

export function getLatestMetricValue(
  institutionId: string,
  metricId: string
): MetricValue | null {
  const values = metricValues
    .filter((v) => v.institutionId === institutionId && v.metricId === metricId)
    .sort((a, b) => b.fiscalYear - a.fiscalYear);

  return values[0] || null;
}
