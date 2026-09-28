import "dotenv/config";
import { drainOnce } from "../src/jobs/queue";

const intervalMs = Number(process.env.WORKER_INTERVAL_MS ?? 1000);

async function runBatch(): Promise<number> {
  let total = 0;
  for (;;) {
    const { processed } = await drainOnce();
    if (processed === 0) {
      return total;
    }
    total += processed;
  }
}

async function main(): Promise<void> {
  console.log(`[worker] started; polling every ${intervalMs}ms`);
  const initial = await runBatch();
  if (initial > 0) {
    console.log(`[worker] processed ${initial} job(s) on startup`);
  }
  setInterval(() => {
    runBatch()
      .then((count) => {
        if (count > 0) {
          console.log(`[worker] processed ${count} job(s)`);
        }
      })
      .catch((error) => {
        console.error("[worker] drain error", error);
      });
  }, intervalMs);
}

main().catch((error) => {
  console.error("[worker] fatal", error);
  process.exit(1);
});
