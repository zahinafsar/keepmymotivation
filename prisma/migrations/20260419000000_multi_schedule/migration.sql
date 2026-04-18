-- CreateTable Schedule
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Schedule_userId_idx" ON "Schedule"("userId");

ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill from Goal.sendHour. dayOfWeek/dayOfMonth = deploy NOW() in UTC per plan kind.
INSERT INTO "Schedule" ("id", "userId", "hour", "dayOfWeek", "dayOfMonth", "createdAt")
SELECT
  'sch_' || replace(gen_random_uuid()::text, '-', ''),
  g."userId",
  g."sendHour",
  CASE WHEN s."plan" = 'BOOST' THEN EXTRACT(DOW FROM NOW() AT TIME ZONE 'UTC')::int ELSE NULL END,
  CASE WHEN s."plan" = 'SPARK' THEN EXTRACT(DAY FROM NOW() AT TIME ZONE 'UTC')::int ELSE NULL END,
  NOW()
FROM "Goal" g
LEFT JOIN "Subscription" s ON s."userId" = g."userId";

-- AlterTable Goal (drop sendHour after backfill)
ALTER TABLE "Goal" DROP COLUMN "sendHour";

-- AlterTable EmailLog (add scheduleId)
ALTER TABLE "EmailLog" ADD COLUMN "scheduleId" TEXT;

CREATE INDEX "EmailLog_scheduleId_sentAt_idx" ON "EmailLog"("scheduleId", "sentAt");

ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_scheduleId_fkey"
  FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
