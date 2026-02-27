import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../server/db";
import { results } from "../shared/schema.ts";
import { normalizeResultData } from "../shared/results.ts";

async function main() {
  const rows = await db.select().from(results);
  if (!rows.length) {
    console.log("No results found to normalize.");
    return;
  }

  for (const row of rows) {
    const normalizedData = normalizeResultData({
      data: row.data as Record<string, any>,
      fallbackYear: row.year,
    });

    await db.update(results).set({ data: normalizedData }).where(eq(results.id, row.id));
  }

  console.log(`Normalized ${rows.length} result record(s).`);
}

main().catch((error) => {
  console.error("Failed to normalize results", error);
  process.exit(1);
});
