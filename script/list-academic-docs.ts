import "dotenv/config";
import { db } from "../server/db";
import { academicDocuments } from "../shared/schema";
import { desc } from "drizzle-orm";

async function main() {
  const docs = await db
    .select()
    .from(academicDocuments)
    .orderBy(desc(academicDocuments.uploadedAt));

  if (!docs.length) {
    console.log("No academic documents found in the database yet.");
    return;
  }

  console.log(`Found ${docs.length} academic document${docs.length === 1 ? "" : "s"}:`);
  console.table(
    docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      type: doc.docType,
      year: doc.academicYear,
      class: doc.classLevel ?? "—",
      subject: doc.subject ?? "—",
      status: doc.status,
      uploadedAt: doc.uploadedAt?.toISOString?.() ?? "",
      fileUrl: doc.fileUrl,
    })),
  );
}

main().catch((error) => {
  console.error("Failed to load academic documents", error);
  process.exit(1);
});
