import type { Finding } from "./types";

export type FindingSummary = { pass: number; partial: number; fail: number };

export function summarize(findings: Finding[]): FindingSummary {
  return findings.reduce<FindingSummary>(
    (acc, finding) => {
      acc[finding.status] += 1;
      return acc;
    },
    { pass: 0, partial: 0, fail: 0 },
  );
}
