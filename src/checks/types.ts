import type { PdpSignals } from "../capture/normalize";

export type Dimension = "d1" | "d2" | "d3" | "d4";

export type CheckStatus = "pass" | "partial" | "fail";

export type CheckType = "deterministic" | "model";

export type Finding = {
  checkId: string;
  dimension: Dimension;
  type: CheckType;
  status: CheckStatus;
  weight: number;
  evidence: string;
  details?: Record<string, unknown>;
};

export type CheckContext = {
  url?: string;
  html?: string;
  jsonLd: unknown[];
  normalized?: {
    title?: string;
    content: string;
    signals: PdpSignals;
  };
  fetch?: {
    statusCode?: number;
    blocked?: boolean;
  };
  robots?: {
    present: boolean;
    allowed: boolean;
    blockedBots: string[];
  };
};

export type CheckOutcome = {
  status: CheckStatus;
  evidence: string;
  details?: Record<string, unknown>;
};

export type CheckDefinition = {
  id: string;
  dimension: Dimension;
  weight: number;
  run: (context: CheckContext) => CheckOutcome;
};

export function runChecks(
  definitions: CheckDefinition[],
  context: CheckContext,
): Finding[] {
  return definitions.map((definition) => {
    const outcome = definition.run(context);
    return {
      checkId: definition.id,
      dimension: definition.dimension,
      type: "deterministic",
      status: outcome.status,
      weight: definition.weight,
      evidence: outcome.evidence,
      details: outcome.details,
    };
  });
}
