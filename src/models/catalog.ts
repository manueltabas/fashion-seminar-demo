import { providerNames, type ProviderName } from "../providers/types";

export type ModelProfileSeed = {
  key: string;
  provider: ProviderName;
  model: string;
  label: string;
  credentialRef: string;
  sortOrder?: number;
};

export const DEFAULT_MODEL_PROFILES: ModelProfileSeed[] = [
  {
    key: "google-gemini-3.1-flash-lite",
    provider: "google",
    model: "gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash Lite",
    credentialRef: "GEMINI_API_KEY",
    sortOrder: 1,
  },
  {
    key: "google-gemini-3.5-flash",
    provider: "google",
    model: "gemini-3.5-flash",
    label: "Gemini 3.5 Flash",
    credentialRef: "GEMINI_API_KEY",
    sortOrder: 5,
  },
  {
    key: "google-gemini-3.6-flash",
    provider: "google",
    model: "gemini-3.6-flash",
    label: "Gemini 3.6 Flash",
    credentialRef: "GEMINI_API_KEY",
    sortOrder: 10,
  },
  {
    key: "google-gemini-3.1-pro-preview",
    provider: "google",
    model: "gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro (Preview)",
    credentialRef: "GEMINI_API_KEY",
    sortOrder: 20,
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProviderName(value: unknown): value is ProviderName {
  return (
    typeof value === "string" &&
    (providerNames as readonly string[]).includes(value)
  );
}

export function parseExtraProfiles(value: string | undefined): ModelProfileSeed[] {
  if (!value) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const profiles: ModelProfileSeed[] = [];
  for (const entry of parsed) {
    if (!isRecord(entry)) {
      continue;
    }
    const { key, provider, model, label, credentialRef, sortOrder } = entry;
    if (
      typeof key !== "string" ||
      !isProviderName(provider) ||
      typeof model !== "string" ||
      typeof label !== "string" ||
      typeof credentialRef !== "string"
    ) {
      continue;
    }
    profiles.push({
      key,
      provider,
      model,
      label,
      credentialRef,
      sortOrder: typeof sortOrder === "number" ? sortOrder : undefined,
    });
  }

  return profiles;
}
