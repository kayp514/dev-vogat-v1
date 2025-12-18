-- CreateTable: Create workspace-independent contacts table
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(50) NOT NULL,
    "contactId" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'accepted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint to prevent duplicate contact relationships
CREATE UNIQUE INDEX "contacts_userId_contactId_key" ON "contacts"("userId", "contactId");

-- CreateIndex: Index on userId for fast lookups
CREATE INDEX "contacts_userId_idx" ON "contacts"("userId");

-- CreateIndex: Index on contactId for fast lookups
CREATE INDEX "contacts_contactId_idx" ON "contacts"("contactId");

-- CreateIndex: Index on status for filtering
CREATE INDEX "contacts_status_idx" ON "contacts"("status");

-- AddForeignKey: Link to users table (userId)
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Link to users table (contactId)
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
