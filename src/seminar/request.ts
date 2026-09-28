export const MAX_SHOPPER_REQUEST = 1000;

export const FASHION_EXAMPLES = [
  { label: "Running shoes", detail: "Budget · comfort · fit", request: "Find running shoes under €120 for a beginner running 5 km on roads, in EU size 39, with breathable materials and easy returns." },
  { label: "Rain jacket", detail: "Weather · use · price", request: "Find a waterproof jacket under €150 for cycling to work, with a hood, breathable fabric and room for a jumper." },
  { label: "Occasion outfit", detail: "Occasion · fabric · care", request: "Find a dress under €180 for an outdoor summer wedding, in size M, with a breathable fabric and clear care instructions." },
] as const;

export function parseShopperRequest(value: unknown):
  | { ok: true; value: string | null }
  | { ok: false; error: string } {
  if (value === undefined) return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, error: "Shopper request must be text." };
  if (value.length > MAX_SHOPPER_REQUEST) return { ok: false, error: "Keep the shopper request to 1,000 characters or fewer." };
  return { ok: true, value: value.trim() || null };
}
