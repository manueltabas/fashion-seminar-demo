import { and, asc, desc, eq, lte } from "drizzle-orm";
import { getDb } from "../db/client";
import { jobs, type Job } from "../db/schema";
import { getJobHandler } from "./registry";

export type EnqueueJobInput = {
  type: string;
  payload?: Record<string, unknown>;
  runAt?: Date;
  maxAttempts?: number;
};

export async function enqueueJob(input: EnqueueJobInput): Promise<Job> {
  const [job] = await getDb()
    .insert(jobs)
    .values({
      type: input.type,
      payload: input.payload ?? {},
      runAt: input.runAt ?? new Date(),
      maxAttempts: input.maxAttempts ?? 3,
    })
    .returning();
  return job;
}

export async function getJob(id: string): Promise<Job | undefined> {
  const [job] = await getDb()
    .select()
    .from(jobs)
    .where(eq(jobs.id, id))
    .limit(1);
  return job;
}

export async function listJobs(limit = 20): Promise<Job[]> {
  return getDb().select().from(jobs).orderBy(desc(jobs.createdAt)).limit(limit);
}

function retryDelayMs(attempts: number): number {
  return Math.min(2 ** attempts, 60) * 1000;
}

export async function drainOnce(): Promise<{ processed: number }> {
  const db = getDb();

  const claimed = await db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(jobs)
      .where(and(eq(jobs.status, "pending"), lte(jobs.runAt, new Date())))
      .orderBy(asc(jobs.runAt))
      .limit(1)
      .for("update", { skipLocked: true });

    if (!job) {
      return null;
    }

    const [updated] = await tx
      .update(jobs)
      .set({
        status: "processing",
        attempts: job.attempts + 1,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id))
      .returning();

    return updated;
  });

  if (!claimed) {
    return { processed: 0 };
  }

  await runClaimedJob(claimed);
  return { processed: 1 };
}

async function runClaimedJob(job: Job): Promise<void> {
  const db = getDb();
  const handler = getJobHandler(job.type);

  try {
    if (!handler) {
      throw new Error(`No handler registered for job type "${job.type}"`);
    }
    const result = await handler(job.payload, {
      id: job.id,
      attempts: job.attempts,
    });
    await db
      .update(jobs)
      .set({
        status: "completed",
        result: result ?? null,
        lastError: null,
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const willRetry = job.attempts < job.maxAttempts;
    await db
      .update(jobs)
      .set({
        status: willRetry ? "pending" : "failed",
        lastError: message,
        runAt: willRetry
          ? new Date(Date.now() + retryDelayMs(job.attempts))
          : job.runAt,
        finishedAt: willRetry ? null : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id));
  }
}
