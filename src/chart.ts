export type RenderChartOptions = {
  length?: number;
};

export function renderChart(
  value: number,
  { length = 50 }: RenderChartOptions = {}
) {
  const filledChars = Math.round(value * length);
  const emptyChars = length - filledChars;
  return "█".repeat(filledChars) + " ".repeat(emptyChars);
}
