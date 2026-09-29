-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'DEVELOPMENT', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ANALYST', 'VIEWER');

-- CreateEnum
CREATE TYPE "CompetitorStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OFFICIAL_WEBSITE', 'PRODUCT_PAGE', 'PRICING_PAGE', 'BLOG', 'PRESS_RELEASE', 'CAREERS', 'RSS', 'PUBLIC_ANNOUNCEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PRICING', 'PRODUCT', 'FEATURE', 'MESSAGING', 'HIRING', 'FUNDING', 'PARTNERSHIP', 'LEADERSHIP', 'EXPANSION', 'ANNOUNCEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ImportanceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('PRIMARY_SOURCE', 'SECONDARY_SOURCE', 'EXTRACTED_TEXT', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductSignalType" AS ENUM ('NEW_PRODUCT', 'NEW_FEATURE', 'PRODUCT_UPDATE', 'PRODUCT_DEPRECATION', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('PRICE_CHANGE', 'NEW_PRODUCT', 'NEW_FEATURE', 'HIRING_SPIKE', 'MESSAGING_CHANGE', 'FUNDING', 'PARTNERSHIP', 'COMPETITOR_ACTIVITY_SPIKE', 'IMPORTANT_PATTERN');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('UNREAD', 'READ', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('STRATEGIC', 'CONNECT_DOTS', 'COMPARISON', 'EXECUTIVE', 'TIMELINE', 'OTHER');

-- CreateEnum
CREATE TYPE "AgentMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MemoryStage" AS ENUM ('RETAIN', 'RECALL', 'REFLECT');

-- CreateEnum
CREATE TYPE "MemoryStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planTier" "PlanTier" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ANALYST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "industry" TEXT,
    "location" TEXT,
    "foundedYear" INTEGER,
    "logo" TEXT,
    "status" "CompetitorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL DEFAULT 'OTHER',
    "publisher" TEXT,
    "title" TEXT,
    "publishedAt" TIMESTAMP(3),
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "sourceId" TEXT,
    "eventType" "EventType" NOT NULL DEFAULT 'ANNOUNCEMENT',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importance" "ImportanceLevel" NOT NULL DEFAULT 'MEDIUM',
    "confidence" DOUBLE PRECISION,
    "contentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventEvidence" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sourceId" TEXT,
    "excerpt" TEXT NOT NULL,
    "evidenceType" "EvidenceType" NOT NULL DEFAULT 'PRIMARY_SOURCE',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingSignal" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "competitorId" TEXT NOT NULL,
    "previousPrice" DECIMAL(12,2),
    "newPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingPeriod" TEXT,
    "tierName" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSignal" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "competitorId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "featureName" TEXT,
    "signalType" "ProductSignalType" NOT NULL DEFAULT 'NEW_FEATURE',
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessagingSignal" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "competitorId" TEXT NOT NULL,
    "messageTheme" TEXT NOT NULL,
    "previousMessaging" TEXT,
    "newMessaging" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessagingSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiringSignal" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "competitorId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "location" TEXT,
    "detectedCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiringSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingSignal" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "competitorId" TEXT NOT NULL,
    "fundingType" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "announcedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundingSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "competitorId" TEXT,
    "eventId" TEXT,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'UNREAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "competitorId" TEXT,
    "type" "AnalysisType" NOT NULL DEFAULT 'STRATEGIC',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "facts" JSONB,
    "observations" JSONB,
    "inferences" JSONB,
    "unknowns" JSONB,
    "confidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentConversation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "AgentMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryOperation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "competitorId" TEXT,
    "eventId" TEXT,
    "requestId" TEXT,
    "stage" "MemoryStage" NOT NULL,
    "status" "MemoryStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "query" TEXT,
    "memoryCount" INTEGER,
    "errorCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "targetEntity" TEXT NOT NULL,
    "targetId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "Competitor_organizationId_idx" ON "Competitor"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_organizationId_slug_key" ON "Competitor"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "Source_organizationId_idx" ON "Source"("organizationId");

-- CreateIndex
CREATE INDEX "Source_contentHash_idx" ON "Source"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "Source_organizationId_url_key" ON "Source"("organizationId", "url");

-- CreateIndex
CREATE INDEX "CompetitorEvent_organizationId_idx" ON "CompetitorEvent"("organizationId");

-- CreateIndex
CREATE INDEX "CompetitorEvent_competitorId_idx" ON "CompetitorEvent"("competitorId");

-- CreateIndex
CREATE INDEX "CompetitorEvent_eventType_idx" ON "CompetitorEvent"("eventType");

-- CreateIndex
CREATE INDEX "CompetitorEvent_eventDate_idx" ON "CompetitorEvent"("eventDate");

-- CreateIndex
CREATE INDEX "CompetitorEvent_detectedAt_idx" ON "CompetitorEvent"("detectedAt");

-- CreateIndex
CREATE INDEX "CompetitorEvent_sourceId_idx" ON "CompetitorEvent"("sourceId");

-- CreateIndex
CREATE INDEX "EventEvidence_eventId_idx" ON "EventEvidence"("eventId");

-- CreateIndex
CREATE INDEX "EventEvidence_sourceId_idx" ON "EventEvidence"("sourceId");

-- CreateIndex
CREATE INDEX "PricingSignal_competitorId_idx" ON "PricingSignal"("competitorId");

-- CreateIndex
CREATE INDEX "PricingSignal_eventId_idx" ON "PricingSignal"("eventId");

-- CreateIndex
CREATE INDEX "ProductSignal_competitorId_idx" ON "ProductSignal"("competitorId");

-- CreateIndex
CREATE INDEX "ProductSignal_eventId_idx" ON "ProductSignal"("eventId");

-- CreateIndex
CREATE INDEX "MessagingSignal_competitorId_idx" ON "MessagingSignal"("competitorId");

-- CreateIndex
CREATE INDEX "MessagingSignal_eventId_idx" ON "MessagingSignal"("eventId");

-- CreateIndex
CREATE INDEX "HiringSignal_competitorId_idx" ON "HiringSignal"("competitorId");

-- CreateIndex
CREATE INDEX "HiringSignal_eventId_idx" ON "HiringSignal"("eventId");

-- CreateIndex
CREATE INDEX "FundingSignal_competitorId_idx" ON "FundingSignal"("competitorId");

-- CreateIndex
CREATE INDEX "FundingSignal_eventId_idx" ON "FundingSignal"("eventId");

-- CreateIndex
CREATE INDEX "Alert_organizationId_idx" ON "Alert"("organizationId");

-- CreateIndex
CREATE INDEX "Alert_competitorId_idx" ON "Alert"("competitorId");

-- CreateIndex
CREATE INDEX "Alert_status_idx" ON "Alert"("status");

-- CreateIndex
CREATE INDEX "Analysis_organizationId_idx" ON "Analysis"("organizationId");

-- CreateIndex
CREATE INDEX "Analysis_competitorId_idx" ON "Analysis"("competitorId");

-- CreateIndex
CREATE INDEX "AgentConversation_organizationId_idx" ON "AgentConversation"("organizationId");

-- CreateIndex
CREATE INDEX "AgentConversation_userId_idx" ON "AgentConversation"("userId");

-- CreateIndex
CREATE INDEX "AgentMessage_conversationId_idx" ON "AgentMessage"("conversationId");

-- CreateIndex
CREATE INDEX "MemoryOperation_organizationId_idx" ON "MemoryOperation"("organizationId");

-- CreateIndex
CREATE INDEX "MemoryOperation_competitorId_idx" ON "MemoryOperation"("competitorId");

-- CreateIndex
CREATE INDEX "MemoryOperation_stage_idx" ON "MemoryOperation"("stage");

-- CreateIndex
CREATE INDEX "MemoryOperation_status_idx" ON "MemoryOperation"("status");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorEvent" ADD CONSTRAINT "CompetitorEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorEvent" ADD CONSTRAINT "CompetitorEvent_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorEvent" ADD CONSTRAINT "CompetitorEvent_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEvidence" ADD CONSTRAINT "EventEvidence_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CompetitorEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEvidence" ADD CONSTRAINT "EventEvidence_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingSignal" ADD CONSTRAINT "PricingSignal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CompetitorEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingSignal" ADD CONSTRAINT "PricingSignal_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSignal" ADD CONSTRAINT "ProductSignal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CompetitorEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSignal" ADD CONSTRAINT "ProductSignal_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessagingSignal" ADD CONSTRAINT "MessagingSignal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CompetitorEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessagingSignal" ADD CONSTRAINT "MessagingSignal_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringSignal" ADD CONSTRAINT "HiringSignal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CompetitorEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringSignal" ADD CONSTRAINT "HiringSignal_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingSignal" ADD CONSTRAINT "FundingSignal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CompetitorEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingSignal" ADD CONSTRAINT "FundingSignal_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CompetitorEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentConversation" ADD CONSTRAINT "AgentConversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentConversation" ADD CONSTRAINT "AgentConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AgentConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryOperation" ADD CONSTRAINT "MemoryOperation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryOperation" ADD CONSTRAINT "MemoryOperation_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryOperation" ADD CONSTRAINT "MemoryOperation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CompetitorEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
