-- LOT 1 (MFA) : challenge MFA à usage unique lié au login attempt.
-- Table additive, non destructive : aucune colonne/table existante modifiée.
CREATE TABLE IF NOT EXISTS "business_manager"."mfa_challenge" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "deviceId" TEXT,
  "ipHash" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "consumedReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "mfa_challenge_tokenHash_key"
  ON "business_manager"."mfa_challenge"("tokenHash");
CREATE INDEX IF NOT EXISTS "mfa_challenge_userId_status_idx"
  ON "business_manager"."mfa_challenge"("userId", "status");
CREATE INDEX IF NOT EXISTS "mfa_challenge_expiresAt_idx"
  ON "business_manager"."mfa_challenge"("expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mfa_challenge_userId_fkey'
  ) THEN
    ALTER TABLE "business_manager"."mfa_challenge"
      ADD CONSTRAINT "mfa_challenge_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "business_manager"."iam_user"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
