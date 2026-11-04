/** The duration row of "Время и сумма": 15-minute steps around the visit's own length. Pure. */
const STEP = 15;
const BEFORE = 4;
const AFTER = 8;

export function durationOptions(current: number): number[] {
  const nearest = Math.round(current / STEP) * STEP;
  const options = new Set<number>([current]);
  for (let i = -BEFORE; i <= AFTER; i += 1) {
    const value = nearest + i * STEP;
    if (value >= STEP) options.add(value);
  }
  return [...options].sort((a, b) => a - b);
}
