-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM (
    'PROJECT_ACTIVITY',
    'TEAM_ACTIVITY',
    'UPCOMING_LAUNCH'
);

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);

-- CreateEnum
CREATE TYPE "NotificationAudienceScope" AS ENUM (
    'ALL_USERS'
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'DRAFT',
    "audienceScope" "NotificationAudienceScope" NOT NULL DEFAULT 'ALL_USERS',
    "defaultLocale" VARCHAR(16) NOT NULL,
    "localeContent" JSONB NOT NULL,
    "createdByWallet" VARCHAR(64),
    "updatedByWallet" VARCHAR(64),
    "publishedAt" TIMESTAMP(3),
    "publishedByWallet" VARCHAR(64),
    "archivedAt" TIMESTAMP(3),
    "archivedByWallet" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRead" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_status_category_idx" ON "Notification"("status", "category");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_publishedAt_idx" ON "Notification"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRead_notificationId_userId_key" ON "NotificationRead"("notificationId", "userId");

-- CreateIndex
CREATE INDEX "NotificationRead_userId_readAt_idx" ON "NotificationRead"("userId", "readAt");

-- CreateIndex
CREATE INDEX "NotificationRead_notificationId_idx" ON "NotificationRead"("notificationId");

-- AddForeignKey
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_notificationId_fkey"
FOREIGN KEY ("notificationId") REFERENCES "Notification"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
