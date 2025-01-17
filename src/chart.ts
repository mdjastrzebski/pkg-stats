export type RenderChartOptions = {
  length?: number;
  maxLength?: number;
};

export function renderChart(value: number, { length = 50, maxLength }: RenderChartOptions = {}) {
  const finalLength = maxLength ? Math.floor(length * (value / maxLength)) : length; // Calculate length based on maxLength
  const filledChars = Math.round(value * finalLength);
  const emptyChars = finalLength - filledChars;

  return '█'.repeat(filledChars) + ' '.repeat(emptyChars);
}
