import { asc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { modelProfiles, type ModelProfile } from "../db/schema";
import { DEFAULT_MODEL_PROFILES, parseExtraProfiles } from "./catalog";

export async function seedModelProfiles(): Promise<{
  inserted: number;
  total: number;
}> {
  const db = getDb();
  const seeds = [
    ...DEFAULT_MODEL_PROFILES,
    ...parseExtraProfiles(process.env.MODEL_PROFILES),
  ];

  let inserted = 0;
  for (const seed of seeds) {
    const result = await db
      .insert(modelProfiles)
      .values({
        key: seed.key,
        provider: seed.provider,
        model: seed.model,
        label: seed.label,
        credentialRef: seed.credentialRef,
        sortOrder: seed.sortOrder ?? 0,
        enabled: Boolean(process.env[seed.credentialRef]),
      })
      .onConflictDoNothing({ target: modelProfiles.key })
      .returning({ id: modelProfiles.id });
    inserted += result.length;
  }

  const all = await listModelProfiles();
  return { inserted, total: all.length };
}

export async function listModelProfiles(
  options: { enabledOnly?: boolean } = {},
): Promise<ModelProfile[]> {
  return getDb()
    .select()
    .from(modelProfiles)
    .where(options.enabledOnly ? eq(modelProfiles.enabled, true) : undefined)
    .orderBy(asc(modelProfiles.sortOrder), asc(modelProfiles.label));
}

export async function setModelProfileEnabled(
  id: string,
  enabled: boolean,
): Promise<ModelProfile | undefined> {
  const [profile] = await getDb()
    .update(modelProfiles)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(modelProfiles.id, id))
    .returning();
  return profile;
}

export async function getModelProfile(
  id: string,
): Promise<ModelProfile | undefined> {
  const [profile] = await getDb()
    .select()
    .from(modelProfiles)
    .where(eq(modelProfiles.id, id))
    .limit(1);
  return profile;
}
