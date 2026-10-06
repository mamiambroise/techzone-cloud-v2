-- Additive revision fingerprint: old reports require revalidation.
ALTER TABLE "bm_quality_reports" ADD COLUMN "inputHash" TEXT;
