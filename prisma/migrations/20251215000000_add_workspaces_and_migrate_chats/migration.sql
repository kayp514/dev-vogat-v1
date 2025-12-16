-- Step 1: Create workspaces table
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "ownerId" VARCHAR(50) NOT NULL,
    "tenantId" VARCHAR(50) NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'personal',
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create workspace_members table
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" VARCHAR(50) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" VARCHAR(50),

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create indexes for workspaces
CREATE INDEX "workspaces_ownerId_idx" ON "workspaces"("ownerId");
CREATE INDEX "workspaces_tenantId_idx" ON "workspaces"("tenantId");
CREATE INDEX "workspaces_type_idx" ON "workspaces"("type");

-- Step 4: Create indexes for workspace_members
CREATE INDEX "workspace_members_workspaceId_idx" ON "workspace_members"("workspaceId");
CREATE INDEX "workspace_members_userId_idx" ON "workspace_members"("userId");
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

-- Step 5: Add foreign keys to workspaces
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Add foreign keys to workspace_members
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Create a personal workspace for each existing user
INSERT INTO "workspaces" ("id", "createdAt", "updatedAt", "name", "ownerId", "tenantId", "type")
SELECT 
    'ws_' || "uid",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    COALESCE("name", 'Personal Workspace'),
    "uid",
    "tenantId",
    'personal'
FROM "users";

-- Step 8: Add each user as owner of their workspace
INSERT INTO "workspace_members" ("id", "workspaceId", "userId", "role", "joinedAt")
SELECT 
    'wm_' || "uid",
    'ws_' || "uid",
    "uid",
    'owner',
    CURRENT_TIMESTAMP
FROM "users";

-- Step 9: Add workspaceId column to chats table (nullable first)
ALTER TABLE "chats" ADD COLUMN "workspaceId" TEXT;

-- Step 10: Migrate existing chats to use sender's workspace
UPDATE "chats" 
SET "workspaceId" = 'ws_' || "senderId";

-- Step 11: Make workspaceId NOT NULL now that data is migrated
ALTER TABLE "chats" ALTER COLUMN "workspaceId" SET NOT NULL;

-- Step 12: Drop the old unique constraint on chats
DROP INDEX IF EXISTS "chats_senderId_recipientId_key";

-- Step 13: Drop the old tenantId foreign key
ALTER TABLE "chats" DROP CONSTRAINT IF EXISTS "chats_tenantId_fkey";

-- Step 14: Drop the old tenantId index
DROP INDEX IF EXISTS "chats_tenantId_idx";

-- Step 15: Drop the tenantId column from chats
ALTER TABLE "chats" DROP COLUMN "tenantId";

-- Step 16: Create new unique constraint with workspaceId
CREATE UNIQUE INDEX "chats_senderId_recipientId_workspaceId_key" ON "chats"("senderId", "recipientId", "workspaceId");

-- Step 17: Create index on workspaceId
CREATE INDEX "chats_workspaceId_idx" ON "chats"("workspaceId");

-- Step 18: Add foreign key for workspaceId
ALTER TABLE "chats" ADD CONSTRAINT "chats_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
