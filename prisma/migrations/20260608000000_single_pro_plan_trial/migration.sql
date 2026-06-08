-- Collapse to a single plan ("PRO") + add a 7-day trial lifecycle.

-- Plan: SPARK/BOOST/DRIVE -> PRO (existing rows all map to PRO)
ALTER TYPE "Plan" RENAME TO "Plan_old";
CREATE TYPE "Plan" AS ENUM ('PRO');
ALTER TABLE "Subscription" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "Subscription" ALTER COLUMN "plan" TYPE "Plan" USING ('PRO'::"Plan");
ALTER TABLE "EmailLog" ALTER COLUMN "plan" TYPE "Plan" USING ('PRO'::"Plan");
ALTER TABLE "Subscription" ALTER COLUMN "plan" SET DEFAULT 'PRO';
DROP TYPE "Plan_old";

-- SubStatus: add TRIALING, change default to TRIALING
ALTER TYPE "SubStatus" RENAME TO "SubStatus_old";
CREATE TYPE "SubStatus" AS ENUM ('TRIALING', 'ACTIVE', 'CANCELED', 'PAST_DUE');
ALTER TABLE "Subscription" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Subscription" ALTER COLUMN "status" TYPE "SubStatus" USING ("status"::text::"SubStatus");
ALTER TABLE "Subscription" ALTER COLUMN "status" SET DEFAULT 'TRIALING';
DROP TYPE "SubStatus_old";

-- Trial cutoff
ALTER TABLE "Subscription" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
