import type {
  ModelMessage,
  ModelProvider,
  ModelResponse,
  ModelUsage,
} from "../providers/types";
import { isProviderError } from "../providers/errors";
import {
  ASSIGNED_CHECK_IDS,
  buildRepairPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  type UserPromptInput,
} from "./prompt";
import { estimateCostUsd } from "./pricing";
import { validateModelOutput, type ModelOutput } from "./validate";

export type EvaluateWithModelInput = {
  provider: ModelProvider;
  model: string;
  content: UserPromptInput;
  temperature?: number;
  maxTokens?: number;
};

export type ModelEvaluationResult =
  | {
      status: "completed";
      output: ModelOutput;
      usage?: ModelUsage;
      attempts: number;
    }
  | {
      status: "failed";
      error: string;
      errors: string[];
      attempts: number;
    };

const MAX_ATTEMPTS = 2;
const MAX_PROVIDER_ATTEMPTS = 3;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(
  provider: ModelProvider,
  request: Parameters<ModelProvider["generate"]>[0],
): Promise<ModelResponse> {
  const base = Number(process.env.PROVIDER_RETRY_BASE_MS ?? 600);
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_PROVIDER_ATTEMPTS; attempt += 1) {
    try {
      return await provider.generate(request);
    } catch (error) {
      lastError = error;
      const retryable = isProviderError(error) && error.retryable;
      if (retryable && attempt < MAX_PROVIDER_ATTEMPTS) {
        await delay(base * attempt);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function evaluateWithModel(
  input: EvaluateWithModelInput,
): Promise<ModelEvaluationResult> {
  const baseMessages: ModelMessage[] = [
    { role: "system", content: buildSystemPrompt(Boolean(input.content.shopperRequest)) },
    { role: "user", content: buildUserPrompt(input.content) },
  ];

  let lastErrors: string[] = [];
  let previousResponse = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const messages: ModelMessage[] =
      attempt === 1
        ? baseMessages
        : [
            ...baseMessages,
            { role: "assistant", content: previousResponse },
            {
              role: "user",
              content: buildRepairPrompt(lastErrors, previousResponse),
            },
          ];

    let text: string;
    let usage: ModelUsage | undefined;
    try {
      const startedAt = Date.now();
      const response = await generateWithRetry(input.provider, {
        model: input.model,
        messages,
        temperature: input.temperature ?? 0,
        maxTokens: input.maxTokens,
        json: true,
      });
      const latencyMs = Date.now() - startedAt;
      text = response.text;
      usage = {
        ...response.usage,
        latencyMs,
        estimatedCostUsd:
          estimateCostUsd(input.model, response.usage ?? {}) ?? undefined,
      };
    } catch (error) {
      return {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        errors: [],
        attempts: attempt,
      };
    }

    previousResponse = text;
    const validation = validateModelOutput(text, ASSIGNED_CHECK_IDS, {
      requireShopperAssessment: Boolean(input.content.shopperRequest),
      source: input.content,
    });
    if (validation.ok) {
      return {
        status: "completed",
        output: validation.value,
        usage,
        attempts: attempt,
      };
    }
    lastErrors = validation.errors;
  }

  return {
    status: "failed",
    error: "model did not return valid JSON after repair",
    errors: lastErrors,
    attempts: MAX_ATTEMPTS,
  };
}
