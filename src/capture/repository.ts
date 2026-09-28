import { desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { pdpFetches, type PdpFetch } from "../db/schema";
import { getPdp } from "../brands/repository";
import { fetchPdpPage, type FetchPageOptions } from "./fetch";

export type FetchMetadata = Omit<PdpFetch, "rawHtml">;

function toMetadata(row: PdpFetch): FetchMetadata {
  const { rawHtml: _rawHtml, ...metadata } = row;
  void _rawHtml;
  return metadata;
}

export async function capturePdp(
  pdpId: string,
  options: FetchPageOptions = {},
): Promise<
  { fetch: FetchMetadata; blocked: boolean } | { error: "pdp_not_found" }
> {
  const pdp = await getPdp(pdpId);
  if (!pdp) {
    return { error: "pdp_not_found" };
  }

  const result = await fetchPdpPage(pdp.url, options);

  const [row] = await getDb()
    .insert(pdpFetches)
    .values({
      pdpId,
      url: result.url,
      finalUrl: result.finalUrl,
      statusCode: result.statusCode,
      ok: result.ok,
      blocked: result.blocked,
      blockReason: result.blockReason,
      contentType: result.contentType,
      byteSize: result.byteSize,
      htmlLength: result.htmlLength,
      rawHtml: result.rawHtml,
      error: result.error,
      fetchedAt: result.fetchedAt,
    })
    .returning();

  return { fetch: toMetadata(row), blocked: result.blocked };
}

export async function listFetches(pdpId: string): Promise<FetchMetadata[]> {
  const rows = await getDb()
    .select()
    .from(pdpFetches)
    .where(eq(pdpFetches.pdpId, pdpId))
    .orderBy(desc(pdpFetches.fetchedAt));
  return rows.map(toMetadata);
}

export async function getLatestFetch(
  pdpId: string,
): Promise<FetchMetadata | undefined> {
  const [row] = await getDb()
    .select()
    .from(pdpFetches)
    .where(eq(pdpFetches.pdpId, pdpId))
    .orderBy(desc(pdpFetches.fetchedAt))
    .limit(1);
  return row ? toMetadata(row) : undefined;
}

export async function getLatestFetchRow(
  pdpId: string,
): Promise<PdpFetch | undefined> {
  const [row] = await getDb()
    .select()
    .from(pdpFetches)
    .where(eq(pdpFetches.pdpId, pdpId))
    .orderBy(desc(pdpFetches.fetchedAt))
    .limit(1);
  return row;
}

export async function getFetchById(id: string): Promise<PdpFetch | undefined> {
  const [row] = await getDb()
    .select()
    .from(pdpFetches)
    .where(eq(pdpFetches.id, id))
    .limit(1);
  return row;
}
