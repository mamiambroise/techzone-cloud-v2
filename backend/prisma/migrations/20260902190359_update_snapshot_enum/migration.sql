-- AlterEnum
ALTER TYPE "SnapshotHistoryAction" ADD VALUE 'CHANGED';

-- AddForeignKey
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
