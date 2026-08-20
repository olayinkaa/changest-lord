/*
  Warnings:

  - The values [COMPLETED] on the enum `OnboardingStep` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OnboardingStep_new" AS ENUM ('PHONE_VALIDATED', 'PROFILE_COMPLETED', 'BUSINESSS_PROFILE_COMPLETED', 'LIVENESS_PASSED', 'PIN_COMPLETED');
ALTER TABLE "public"."users" ALTER COLUMN "onboardingStep" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "onboardingStep" TYPE "OnboardingStep_new" USING ("onboardingStep"::text::"OnboardingStep_new");
ALTER TYPE "OnboardingStep" RENAME TO "OnboardingStep_old";
ALTER TYPE "OnboardingStep_new" RENAME TO "OnboardingStep";
DROP TYPE "public"."OnboardingStep_old";
ALTER TABLE "users" ALTER COLUMN "onboardingStep" SET DEFAULT 'PHONE_VALIDATED';
COMMIT;
