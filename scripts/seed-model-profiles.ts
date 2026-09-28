import "dotenv/config";
import { seedModelProfiles } from "../src/models/repository";

async function main(): Promise<void> {
  const result = await seedModelProfiles();
  console.log(
    `[seed] model profiles: inserted ${result.inserted}, total ${result.total}`,
  );
}

main().catch((error: unknown) => {
  console.error("[seed] failed", error);
  process.exit(1);
});
