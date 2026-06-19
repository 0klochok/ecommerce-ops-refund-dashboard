import { prisma } from "@/lib/db/prisma";

export async function getRecentImportBatches() {
  return prisma.importBatch.findMany({
    orderBy: {
      importedAt: "desc",
    },
    select: {
      completedAt: true,
      failureCount: true,
      fileName: true,
      id: true,
      importedAt: true,
      notes: true,
      rowCount: true,
      status: true,
      successCount: true,
    },
    take: 8,
  });
}

