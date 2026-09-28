import type { Dimension } from "@/checks/types";

/**
 * Customer-facing names and short explanations for the evaluation dimensions.
 * The canonical/technical terms live in docs/evaluation-contract.md; this copy
 * is what we show in the report so non-technical readers understand the scores.
 */
export const DIMENSION_COPY: Record<
  Dimension,
  { name: string; description: string }
> = {
  d1: {
    name: "Product data",
    description:
      "Can an AI read the key product facts: name, price, stock and identifiers?",
  },
  d2: {
    name: "Page content",
    description:
      "Is the important content readable as text, not only inside images, tabs or scripts?",
  },
  d3: {
    name: "Trust & policy",
    description:
      "Are shipping, returns, warranty, reviews and contact details clear?",
  },
  d4: {
    name: "Buying path",
    description:
      "Can an AI find the price, the stock and a clear way to buy?",
  },
};

const FALLBACK = { name: "Dimension", description: "" };

export function dimensionCopy(dimension: string): {
  name: string;
  description: string;
} {
  return DIMENSION_COPY[dimension as Dimension] ?? FALLBACK;
}
