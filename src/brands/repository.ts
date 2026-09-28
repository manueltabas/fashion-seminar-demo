import { and, asc, count, desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { brands, pdps, type Brand, type Pdp } from "../db/schema";
import { detectBrand } from "./detect";

export type AddPdpInput = {
  url: string;
  brandName?: string;
  title?: string;
  structuredData?: unknown;
};

export type AddPdpResult = {
  brand: Brand;
  pdp: Pdp;
  created: boolean;
};

export async function addPdpWithBrand(
  input: AddPdpInput,
): Promise<AddPdpResult> {
  const db = getDb();
  const detected = detectBrand(input);

  await db
    .insert(brands)
    .values({ key: detected.domain, name: detected.name })
    .onConflictDoNothing({ target: brands.key });

  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.key, detected.domain))
    .limit(1);

  const inserted = await db
    .insert(pdps)
    .values({
      brandId: brand.id,
      url: input.url,
      domain: detected.domain,
      title: input.title,
    })
    .onConflictDoNothing({ target: pdps.url })
    .returning();

  const pdp =
    inserted[0] ??
    (
      await db.select().from(pdps).where(eq(pdps.url, input.url)).limit(1)
    )[0];

  return { brand, pdp, created: inserted.length > 0 };
}

export async function listBrands(): Promise<
  Array<Brand & { pdpCount: number }>
> {
  const rows = await getDb()
    .select({
      id: brands.id,
      key: brands.key,
      name: brands.name,
      createdAt: brands.createdAt,
      updatedAt: brands.updatedAt,
      pdpCount: count(pdps.id),
    })
    .from(brands)
    .leftJoin(pdps, eq(pdps.brandId, brands.id))
    .groupBy(brands.id)
    .orderBy(asc(brands.name));

  return rows.map((row) => ({ ...row, pdpCount: Number(row.pdpCount) }));
}

export async function listPdps(): Promise<
  Array<Pdp & { brandName: string }>
> {
  const rows = await getDb()
    .select({
      id: pdps.id,
      brandId: pdps.brandId,
      url: pdps.url,
      domain: pdps.domain,
      title: pdps.title,
      createdAt: pdps.createdAt,
      updatedAt: pdps.updatedAt,
      brandName: brands.name,
    })
    .from(pdps)
    .innerJoin(brands, eq(pdps.brandId, brands.id))
    .orderBy(desc(pdps.createdAt));

  return rows;
}

export async function getBrand(id: string): Promise<Brand | undefined> {
  const [brand] = await getDb()
    .select()
    .from(brands)
    .where(eq(brands.id, id))
    .limit(1);
  return brand;
}

export async function getPdp(id: string): Promise<Pdp | undefined> {
  const [pdp] = await getDb()
    .select()
    .from(pdps)
    .where(eq(pdps.id, id))
    .limit(1);
  return pdp;
}

export async function renameBrand(
  id: string,
  name: string,
): Promise<Brand | undefined> {
  const [brand] = await getDb()
    .update(brands)
    .set({ name, updatedAt: new Date() })
    .where(eq(brands.id, id))
    .returning();
  return brand;
}

export class MergeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MergeError";
  }
}

export async function mergeBrands(
  sourceId: string,
  targetId: string,
): Promise<Brand | undefined> {
  if (sourceId === targetId) {
    throw new MergeError("cannot merge a brand into itself");
  }

  const db = getDb();
  const [source, target] = await Promise.all([
    getBrand(sourceId),
    getBrand(targetId),
  ]);
  if (!source || !target) {
    return undefined;
  }

  return db.transaction(async (tx) => {
    await tx
      .update(pdps)
      .set({ brandId: targetId, updatedAt: new Date() })
      .where(eq(pdps.brandId, sourceId));
    await tx.delete(brands).where(and(eq(brands.id, sourceId)));
    const [updated] = await tx
      .select()
      .from(brands)
      .where(eq(brands.id, targetId))
      .limit(1);
    return updated;
  });
}
