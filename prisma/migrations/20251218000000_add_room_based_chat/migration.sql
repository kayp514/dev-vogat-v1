-- AlterTable: Add roomId for 1-on-1 chat rooms (email-based)
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "roomId" VARCHAR(255);

-- AlterTable: Add type to distinguish direct vs workspace chats
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "type" VARCHAR(20) NOT NULL DEFAULT 'direct';

-- Update existing chats: Set type to 'workspace' for all existing workspace-based chats
UPDATE "chats" SET "type" = 'workspace' WHERE "workspaceId" IS NOT NULL;

-- CreateIndex: Index on roomId for fast lookups
CREATE INDEX IF NOT EXISTS "chats_roomId_idx" ON "chats"("roomId");

-- CreateIndex: Index on type for filtering
CREATE INDEX IF NOT EXISTS "chats_type_idx" ON "chats"("type");

-- CreateIndex: Unique constraint on roomId to prevent duplicate direct chats
CREATE UNIQUE INDEX IF NOT EXISTS "unique_room" ON "chats"("roomId") WHERE "roomId" IS NOT NULL;

-- AlterTable: Make workspaceId nullable for 1-on-1 chats (do this after updating existing records)
ALTER TABLE "chats" ALTER COLUMN "workspaceId" DROP NOT NULL;
