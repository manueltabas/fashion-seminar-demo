import "dotenv/config";
import { isProviderError } from "../src/providers/errors";
import { createProvider } from "../src/providers/factory";

const model = process.env.SMOKE_MODEL ?? "gemini-3.6-flash";

async function main(): Promise<void> {
  const provider = createProvider("google");
  const response = await provider.generate({
    model,
    temperature: 0,
    json: true,
    messages: [
      { role: "system", content: "Return JSON only." },
      { role: "user", content: 'Return exactly {"ok": true} as JSON.' },
    ],
  });
  console.log("provider:", provider.name, "| model:", model);
  console.log("text:", response.text);
  console.log("usage:", response.usage);
}

main().catch((error: unknown) => {
  if (isProviderError(error)) {
    console.error(
      `ProviderError[${error.code}] provider=${error.provider} http=${
        error.status ?? "-"
      } retryable=${error.retryable}: ${error.message}`,
    );
  } else {
    console.error(error);
  }
  process.exit(1);
});
