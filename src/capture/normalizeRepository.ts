import { desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { pdpNormalizations, type PdpNormalization } from "../db/schema";
import { getPdp } from "../brands/repository";
import { normalizeHtml } from "./normalize";
import { getFetchById, getLatestFetchRow } from "./repository";

export type NormalizePdpResult =
  | { normalization: PdpNormalization }
  | { error: "pdp_not_found" | "fetch_not_found" | "no_html" };

export async function normalizePdp(
  pdpId: string,
  options: { fetchId?: string } = {},
): Promise<NormalizePdpResult> {
  const pdp = await getPdp(pdpId);
  if (!pdp) {
    return { error: "pdp_not_found" };
  }

  const fetchRow = options.fetchId
    ? await getFetchById(options.fetchId)
    : await getLatestFetchRow(pdpId);

  if (!fetchRow || fetchRow.pdpId !== pdpId) {
    return { error: "fetch_not_found" };
  }

  if (!fetchRow.rawHtml) {
    return { error: "no_html" };
  }

  const normalized = normalizeHtml(fetchRow.rawHtml);

  const [row] = await getDb()
    .insert(pdpNormalizations)
    .values({
      pdpId,
      fetchId: fetchRow.id,
      title: normalized.title,
      content: normalized.content,
      jsonLd: normalized.jsonLd,
      signals: normalized.signals,
      textLength: normalized.stats.textLength,
      truncated: normalized.stats.truncated,
    })
    .returning();

  return { normalization: row };
}

export async function getLatestNormalization(
  pdpId: string,
): Promise<PdpNormalization | undefined> {
  const [row] = await getDb()
    .select()
    .from(pdpNormalizations)
    .where(eq(pdpNormalizations.pdpId, pdpId))
    .orderBy(desc(pdpNormalizations.createdAt))
    .limit(1);
  return row;
}

export async function getNormalizationById(id: string): Promise<PdpNormalization | undefined> {
  const [row] = await getDb().select().from(pdpNormalizations).where(eq(pdpNormalizations.id, id)).limit(1);
  return row;
}
