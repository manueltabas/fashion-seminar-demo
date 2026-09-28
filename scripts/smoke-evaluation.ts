import "dotenv/config";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../src/db/client";
import { pdpNormalizations, pdps } from "../src/db/schema";
import { evaluateWithModel } from "../src/evaluation/run";
import { isProviderError } from "../src/providers/errors";
import { createProvider } from "../src/providers/factory";

async function main(): Promise<void> {
  const db = getDb();
  const [normalization] = await db
    .select()
    .from(pdpNormalizations)
    .orderBy(desc(pdpNormalizations.createdAt))
    .limit(1);

  if (!normalization) {
    console.error("No normalization rows found. Run fetch + normalize first.");
    process.exit(1);
  }

  const [pdp] = await db
    .select()
    .from(pdps)
    .where(eq(pdps.id, normalization.pdpId))
    .limit(1);

  const model = process.env.SMOKE_MODEL ?? "gemini-3.6-flash";
  const provider = createProvider("google");

  const result = await evaluateWithModel({
    provider,
    model,
    maxTokens: 4096,
    content: {
      url: pdp?.url,
      title: normalization.title ?? undefined,
      truncated: normalization.truncated,
      jsonLd: normalization.jsonLd,
      content: normalization.content,
    },
  });

  if (result.status === "completed") {
    console.log(
      `model=${model} status=completed attempts=${result.attempts} usage=${JSON.stringify(
        result.usage,
      )}`,
    );
    for (const check of result.output.checks) {
      console.log(
        `  ${check.status.padEnd(7)} ${check.checkId.padEnd(38)} ${check.evidence.slice(0, 70)}`,
      );
    }
    console.log(`brand_perception: ${result.output.brandPerception}`);
  } else {
    console.log(
      `model=${model} status=failed attempts=${result.attempts} error=${result.error}`,
    );
    console.log(`errors=${JSON.stringify(result.errors)}`);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  if (isProviderError(error)) {
    console.error(`ProviderError[${error.code}]: ${error.message}`);
  } else {
    console.error(error);
  }
  process.exit(1);
});
