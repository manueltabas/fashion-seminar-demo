import { getPdp } from "../brands/repository";
import { getLatestNormalization } from "../capture/normalizeRepository";
import { getLatestFetchRow } from "../capture/repository";
import {
  captureRobots,
  getLatestRobotsReport,
} from "../capture/robotsRepository";
import { runD1 } from "./d1";
import { runD2Findings } from "./d2";
import { runD3Findings } from "./d3";
import { runD4Findings } from "./d4";
import type { CheckContext, Finding } from "./types";

export type RunChecksResult =
  | { findings: Finding[] }
  | { error: "pdp_not_found" | "no_normalization" };

async function buildContext(
  pdpId: string,
  options: { withRobots?: boolean } = {},
): Promise<
  { context: CheckContext } | { error: "pdp_not_found" | "no_normalization" }
> {
  const pdp = await getPdp(pdpId);
  if (!pdp) {
    return { error: "pdp_not_found" };
  }

  const normalization = await getLatestNormalization(pdpId);
  if (!normalization) {
    return { error: "no_normalization" };
  }

  const fetchRow = await getLatestFetchRow(pdpId);

  let robots = await getLatestRobotsReport(pdpId);
  if (!robots && options.withRobots) {
    const captured = await captureRobots(pdpId);
    if ("report" in captured) {
      robots = captured.report;
    }
  }

  return {
    context: {
      url: pdp.url,
      html: fetchRow?.rawHtml ?? undefined,
      jsonLd: normalization.jsonLd,
      normalized: {
        title: normalization.title ?? undefined,
        content: normalization.content,
        signals: normalization.signals,
      },
      fetch: fetchRow
        ? {
            statusCode: fetchRow.statusCode ?? undefined,
            blocked: fetchRow.blocked,
          }
        : undefined,
      robots: robots
        ? {
            present: robots.present,
            allowed: robots.allowed,
            blockedBots: robots.blockedBots,
          }
        : undefined,
    },
  };
}

export async function runD1ForPdp(
  pdpId: string,
): Promise<RunChecksResult> {
  const built = await buildContext(pdpId);
  if ("error" in built) {
    return built;
  }
  return { findings: runD1(built.context) };
}

export async function runD2ForPdp(
  pdpId: string,
): Promise<RunChecksResult> {
  const built = await buildContext(pdpId);
  if ("error" in built) {
    return built;
  }
  return { findings: runD2Findings(built.context) };
}

export async function runD3ForPdp(
  pdpId: string,
): Promise<RunChecksResult> {
  const built = await buildContext(pdpId);
  if ("error" in built) {
    return built;
  }
  return { findings: runD3Findings(built.context) };
}

export async function runD4ForPdp(
  pdpId: string,
): Promise<RunChecksResult> {
  const built = await buildContext(pdpId, { withRobots: true });
  if ("error" in built) {
    return built;
  }
  return { findings: runD4Findings(built.context) };
}
