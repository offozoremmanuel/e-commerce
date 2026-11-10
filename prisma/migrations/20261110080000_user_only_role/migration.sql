-- Replace the legacy role enum and promote all existing accounts to USER.
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

CREATE TYPE "user_role_new" AS ENUM ('USER');

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "user_role_new"
  USING ('USER'::"user_role_new");

DROP TYPE "user_role";
ALTER TYPE "user_role_new" RENAME TO "user_role";

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
