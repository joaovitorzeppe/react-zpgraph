/** Shared sample data for demos. */

export const dayMs = 86_400_000;

export const makeSeries = (opts?: {
  points?: number;
  series?: number;
  seed?: number;
}): Array<[Date, ...number[]]> => {
  const points = opts?.points ?? 90;
  const series = opts?.series ?? 2;
  const seed = opts?.seed ?? 1;
  const start = Date.UTC(2024, 0, 1);
  const data: Array<[Date, ...number[]]> = [];

  for (let i = 0; i < points; i++) {
    const row: [Date, ...number[]] = [new Date(start + i * dayMs)];
    for (let s = 0; s < series; s++) {
      const phase = (s + 1) * 0.7 + seed * 0.13;
      const base = 18 + s * 7 + seed;
      const wave = Math.sin(i / (6 + s) + phase) * (6 + s * 2);
      const noise = ((i * (s + 3) * seed) % 7) - 3;
      row.push(base + wave + noise);
    }
    data.push(row);
  }
  return data;
};

export const makeDualAxis = (
  points = 80,
): Array<[Date, number, number, number]> => {
  const start = Date.UTC(2024, 2, 1);
  const data: Array<[Date, number, number, number]> = [];
  for (let i = 0; i < points; i++) {
    data.push([
      new Date(start + i * dayMs),
      20 + Math.sin(i / 9) * 8,
      1e5 * (1.2 + Math.sin(i / 11) * 0.4),
      18 + Math.cos(i / 7) * 5,
    ]);
  }
  return data;
};
