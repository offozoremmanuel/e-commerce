CREATE TYPE "email_otp_purpose" AS ENUM ('SIGNUP', 'PASSWORD_RESET');

ALTER TABLE "users"
  ADD COLUMN "email_verified_at" TIMESTAMPTZ(6);

UPDATE "users"
SET "email_verified_at" = CURRENT_TIMESTAMP;

CREATE TABLE "email_otps" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "purpose" "email_otp_purpose" NOT NULL,
  "code_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_otps_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "email_otps_user_id_purpose_key"
  ON "email_otps"("user_id", "purpose");

CREATE INDEX "email_otps_expires_at_idx" ON "email_otps"("expires_at");
