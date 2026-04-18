-- DropIndex
DROP INDEX "Subscription_stripeCustomerId_key";

-- DropIndex
DROP INDEX "Subscription_stripeSubscriptionId_key";

-- RenameColumn
ALTER TABLE "Subscription" RENAME COLUMN "stripeCustomerId" TO "lsCustomerId";

-- RenameColumn
ALTER TABLE "Subscription" RENAME COLUMN "stripeSubscriptionId" TO "lsSubscriptionId";

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_lsCustomerId_key" ON "Subscription"("lsCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_lsSubscriptionId_key" ON "Subscription"("lsSubscriptionId");
