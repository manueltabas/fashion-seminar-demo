import { getPdp } from "../brands/repository";
import { classifyPage, type DetectionResult } from "./classify";
import { normalizeHtml, type PdpSignals } from "./normalize";
import { getLatestFetchRow } from "./repository";

export type ClassifyPdpResult =
  | { result: DetectionResult }
  | { error: "pdp_not_found" | "fetch_not_found" };

const EMPTY_SIGNALS: PdpSignals = {
  priceTexts: [],
  availabilityTexts: [],
  ctaTexts: [],
};

export async function classifyPdp(
  pdpId: string,
): Promise<ClassifyPdpResult> {
  const pdp = await getPdp(pdpId);
  if (!pdp) {
    return { error: "pdp_not_found" };
  }

  const fetchRow = await getLatestFetchRow(pdpId);
  if (!fetchRow) {
    return { error: "fetch_not_found" };
  }

  if (!fetchRow.rawHtml) {
    return {
      result: classifyPage({
        url: pdp.url,
        statusCode: fetchRow.statusCode ?? undefined,
        blocked: fetchRow.blocked,
        content: "",
        jsonLd: [],
        signals: EMPTY_SIGNALS,
      }),
    };
  }

  const normalized = normalizeHtml(fetchRow.rawHtml);
  return {
    result: classifyPage({
      url: pdp.url,
      statusCode: fetchRow.statusCode ?? undefined,
      blocked: fetchRow.blocked,
      title: normalized.title,
      content: normalized.content,
      jsonLd: normalized.jsonLd,
      signals: normalized.signals,
    }),
  };
}
