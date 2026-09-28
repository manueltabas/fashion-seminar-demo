export type ScoreBandKey = "needs_work" | "fair" | "good" | "excellent";

export type ScoreBand = {
  key: ScoreBandKey;
  label: string;
  className: string;
};

const BANDS: Array<{ max: number; band: ScoreBand }> = [
  {
    max: 4,
    band: { key: "needs_work", label: "Needs work", className: "band-needs-work" },
  },
  { max: 7, band: { key: "fair", label: "Fair", className: "band-fair" } },
  { max: 9, band: { key: "good", label: "Good", className: "band-good" } },
  {
    max: Infinity,
    band: { key: "excellent", label: "Excellent", className: "band-excellent" },
  },
];

export function scoreBand(score: number | null | undefined): ScoreBand | null {
  if (typeof score !== "number") {
    return null;
  }
  return BANDS.find((entry) => score < entry.max)!.band;
}

export function overallScore(
  aggregate: Record<string, number | null>,
): number | null {
  const values = Object.values(aggregate).filter(
    (value): value is number => typeof value === "number",
  );
  if (values.length === 0) {
    return null;
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(mean * 10) / 10;
}
