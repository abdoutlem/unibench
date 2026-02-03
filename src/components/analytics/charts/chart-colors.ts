// McKinsey-inspired muted palette — extended to 8 colors
export const CHART_COLORS = [
  "hsl(210, 55%, 40%)",   // deep blue
  "hsl(152, 38%, 38%)",   // sage green
  "hsl(20, 55%, 52%)",    // terracotta
  "hsl(270, 35%, 48%)",   // muted purple
  "hsl(35, 50%, 48%)",    // amber gold
  "hsl(190, 45%, 40%)",   // teal
  "hsl(340, 40%, 48%)",   // rose
  "hsl(60, 30%, 42%)",    // olive
] as const;

export function getColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function getSeriesColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => getColor(i));
}
