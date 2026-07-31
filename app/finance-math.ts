export function calculateAnnualizedIrr(cashFlows: number[]): number | null {
  if (
    cashFlows.length < 2 ||
    !cashFlows.some((value) => value > 0) ||
    !cashFlows.some((value) => value < 0)
  ) {
    return null;
  }

  const netPresentValue = (monthlyRate: number) =>
    cashFlows.reduce(
      (total, cashFlow, index) => total + cashFlow / Math.pow(1 + monthlyRate, index),
      0,
    );

  let lower = -0.999999;
  let upper = 1;
  let lowerValue = netPresentValue(lower);
  let upperValue = netPresentValue(upper);

  while (lowerValue * upperValue > 0 && upper < 128) {
    upper *= 2;
    upperValue = netPresentValue(upper);
  }

  if (lowerValue * upperValue > 0) return null;

  let midpoint = 0;
  for (let iteration = 0; iteration < 100; iteration += 1) {
    midpoint = (lower + upper) / 2;
    const midpointValue = netPresentValue(midpoint);
    if (Math.abs(midpointValue) < 0.000001) break;
    if (lowerValue * midpointValue <= 0) {
      upper = midpoint;
    } else {
      lower = midpoint;
      lowerValue = midpointValue;
    }
  }

  return (Math.pow(1 + midpoint, 12) - 1) * 100;
}
