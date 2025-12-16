-- AlterTable
ALTER TABLE "users" ADD COLUMN "originalEmail" VARCHAR(255),
ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_deleted_idx" ON "users"("deleted");
