import { desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { robotsReports, type RobotsReport } from "../db/schema";
import { getPdp } from "../brands/repository";
import { checkAgentAccess, type FetchRobotsOptions } from "./robots";

export type RobotsCaptureResult =
  | { report: RobotsReport }
  | { error: "pdp_not_found" };

export async function captureRobots(
  pdpId: string,
  options: FetchRobotsOptions = {},
): Promise<RobotsCaptureResult> {
  const pdp = await getPdp(pdpId);
  if (!pdp) {
    return { error: "pdp_not_found" };
  }

  const access = await checkAgentAccess(pdp.url, options);

  const [row] = await getDb()
    .insert(robotsReports)
    .values({
      pdpId,
      robotsUrl: access.robotsUrl,
      statusCode: access.statusCode,
      present: access.present,
      allowed: access.allowed,
      blockedBots: access.blockedBots,
      bots: access.bots,
      error: access.error,
      fetchedAt: access.fetchedAt,
    })
    .returning();

  return { report: row };
}

export async function getLatestRobotsReport(
  pdpId: string,
): Promise<RobotsReport | undefined> {
  const [row] = await getDb()
    .select()
    .from(robotsReports)
    .where(eq(robotsReports.pdpId, pdpId))
    .orderBy(desc(robotsReports.fetchedAt))
    .limit(1);
  return row;
}
