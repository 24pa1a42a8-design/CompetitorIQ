import { normalizeIngestionItem } from '../ingestion/normalizer.js';
import { isDuplicateEvent, recordEventHash } from '../ingestion/deduplicator.js';
import { competitorRepository } from '../repositories/competitorRepository.js';
import { sourceRepository } from '../repositories/sourceRepository.js';
import { competitorEventRepository } from '../repositories/competitorEventRepository.js';
import { eventEvidenceRepository } from '../repositories/eventEvidenceRepository.js';
import { memoryOperationRepository } from '../repositories/memoryOperationRepository.js';
import { hindsightService } from '../hindsight/hindsightService.js';
import { alertService } from './alertService.js';
import { signalRepository } from '../repositories/signalRepository.js';
import { logger } from '../config/logger.js';

export const ingestionService = {
  async processItem(rawItem, options = {}) {
    const organizationId = options.organizationId || 'default-org';
    const normalized = normalizeIngestionItem(rawItem);

    logger.info(
      { organizationId, competitor: normalized.competitorName, eventType: normalized.eventType, title: normalized.title },
      'Beginning competitive intelligence ingestion pipeline'
    );

    // 1. Deduplication check
    const dupCheck = await isDuplicateEvent(normalized, { organizationId });
    if (dupCheck.isDuplicate) {
      logger.info(
        { contentHash: normalized.contentHash, reason: dupCheck.reason },
        'Event deduplicated; skipping ingestion'
      );
      return {
        success: true,
        isDuplicate: true,
        reason: dupCheck.reason,
        existingEvent: dupCheck.existingEvent || null
      };
    }

    let competitorRecord = null;
    let sourceRecord = null;
    let eventRecord = null;
    let evidenceRecord = null;
    let alertCreated = false;
    let alertData = null;

    // 2. PostgreSQL Persistence (if DB is configured)
    try {
      const prisma = (await import('../config/database.js')).getPrismaClient();
      if (prisma) {
        // Ensure Organization exists
        let org = await prisma.organization.findUnique({ where: { id: organizationId } });
        if (!org) {
          try {
            org = await prisma.organization.create({
              data: {
                id: organizationId,
                name: organizationId === 'default-org' ? 'Default Organization' : organizationId,
                planTier: 'FREE'
              }
            });
          } catch (e) {
            // Organization created concurrently
          }
        }
      }

      // Find or create competitor
      const slug = normalized.competitorId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      competitorRecord = await competitorRepository.findBySlug(organizationId, slug);
      if (!competitorRecord) {
        try {
          competitorRecord = await competitorRepository.create({
            organizationId,
            name: normalized.competitorName,
            slug,
            website: normalized.sourceUrl,
            status: 'ACTIVE'
          });
        } catch (e) {
          // Fallback if competitor exists or concurrent creation
        }
      }

      // Upsert Source
      sourceRecord = await sourceRepository.upsertSource({
        organizationId,
        url: normalized.sourceUrl,
        publisher: normalized.source,
        title: normalized.title,
        contentHash: normalized.contentHash,
        sourceType: 'PUBLIC_ANNOUNCEMENT'
      });

      // Create CompetitorEvent
      if (competitorRecord) {
        const fullDescription = normalized.imageUrl
          ? `[Image: ${normalized.imageUrl}]\n${normalized.description || normalized.summary}`
          : (normalized.description || normalized.summary);

        eventRecord = await competitorEventRepository.create({
          organizationId,
          competitorId: competitorRecord.id,
          sourceId: sourceRecord?.id || null,
          eventType: normalized.eventType,
          title: normalized.title,
          summary: normalized.summary,
          description: fullDescription,
          eventDate: normalized.eventDate,
          detectedAt: normalized.detectedAt,
          importance: normalized.importance,
          confidence: normalized.confidence,
          contentHash: normalized.contentHash
        });

        if (eventRecord) {
          // Create EventEvidence
          const evidenceExcerpt = normalized.imageUrl
            ? `[Image: ${normalized.imageUrl}]\n${normalized.evidenceExcerpt}`
            : normalized.evidenceExcerpt;

          evidenceRecord = await eventEvidenceRepository.create({
            eventId: eventRecord.id,
            sourceId: sourceRecord?.id || null,
            excerpt: evidenceExcerpt,
            evidenceType: 'PRIMARY_SOURCE'
          });

          // Persist Typed Signals when present or inferred from event type
          try {
            if (rawItem.pricingSignal || ['PRICING', 'PRICING_CHANGE'].includes(normalized.eventType)) {
              const sig = rawItem.pricingSignal || {};
              await signalRepository.createPricingSignal({
                eventId: eventRecord.id,
                competitorId: competitorRecord.id,
                previousPrice: sig.previousPrice,
                newPrice: sig.newPrice !== undefined ? sig.newPrice : 0,
                currency: sig.currency || 'USD',
                billingPeriod: sig.billingPeriod || 'MONTHLY',
                tierName: sig.tierName || 'Standard',
                effectiveDate: sig.effectiveDate || normalized.eventDate
              });
            }

            if (rawItem.productSignal || ['PRODUCT', 'FEATURE', 'PRODUCT_LAUNCH', 'FEATURE_RELEASE'].includes(normalized.eventType)) {
              const sig = rawItem.productSignal || {};
              await signalRepository.createProductSignal({
                eventId: eventRecord.id,
                competitorId: competitorRecord.id,
                productName: sig.productName || normalized.title,
                featureName: sig.featureName || null,
                signalType: sig.signalType || (normalized.eventType === 'PRODUCT' || normalized.eventType === 'PRODUCT_LAUNCH' ? 'NEW_PRODUCT' : 'NEW_FEATURE'),
                effectiveDate: sig.effectiveDate || normalized.eventDate
              });
            }

            if (rawItem.hiringSignal || ['HIRING', 'HIRING_SPIKE'].includes(normalized.eventType)) {
              const sig = rawItem.hiringSignal || {};
              await signalRepository.createHiringSignal({
                eventId: eventRecord.id,
                competitorId: competitorRecord.id,
                role: sig.role || normalized.title,
                department: sig.department || null,
                location: sig.location || null,
                detectedCount: sig.detectedCount || 1
              });
            }

            if (rawItem.messagingSignal || ['MESSAGING', 'MESSAGING_CHANGE'].includes(normalized.eventType)) {
              const sig = rawItem.messagingSignal || {};
              await signalRepository.createMessagingSignal({
                eventId: eventRecord.id,
                competitorId: competitorRecord.id,
                messageTheme: sig.messageTheme || normalized.title,
                previousMessaging: sig.previousMessaging || null,
                newMessaging: sig.newMessaging || normalized.summary
              });
            }

            if (rawItem.fundingSignal || ['FUNDING'].includes(normalized.eventType)) {
              const sig = rawItem.fundingSignal || {};
              await signalRepository.createFundingSignal({
                eventId: eventRecord.id,
                competitorId: competitorRecord.id,
                fundingType: sig.fundingType || 'INVESTMENT',
                amount: sig.amount || 0,
                currency: sig.currency || 'USD',
                announcedDate: sig.announcedDate || normalized.eventDate
              });
            }
          } catch (sigErr) {
            logger.warn({ err: sigErr.message }, 'Signal persistence warning (event saved safely)');
          }

          // 2b. Evaluate Alert Engine rules AFTER event & evidence are saved
          try {
            const alertRes = await alertService.evaluateAndCreateAlert({
              organizationId,
              eventRecord,
              normalized,
              competitorRecord
            });
            if (alertRes && alertRes.alertCreated) {
              alertCreated = true;
              alertData = alertRes.alert;
            }
          } catch (alertErr) {
            logger.warn({ err: alertErr.message }, 'Alert engine evaluation failed during ingestion (event saved safely)');
          }
        }
      }
    } catch (dbErr) {
      logger.warn({ err: dbErr.message }, 'Database persistence warning during ingestion (continuing safely)');
    }

    recordEventHash(normalized.contentHash);

    // 3. Hindsight Memory RETAIN Stage
    let hindsightRetained = false;
    let hindsightError = null;
    let memoryOp = null;

    try {
      memoryOp = await memoryOperationRepository.recordStart({
        stage: 'RETAIN',
        organizationId,
        competitorId: competitorRecord?.id || normalized.competitorId,
        eventId: eventRecord?.id || null,
        requestId: options.requestId || undefined,
        query: normalized.title
      });

      const retainPayload = {
        competitorId: normalized.competitorId,
        competitorName: normalized.competitorName,
        eventId: eventRecord?.id || normalized.contentHash,
        eventType: normalized.eventType,
        title: normalized.title,
        summary: normalized.summary,
        description: normalized.description,
        eventDate: normalized.eventDate.toISOString(),
        source: normalized.source,
        sourceUrl: normalized.sourceUrl,
        importance: normalized.importance,
        confidence: normalized.confidence
      };

      const retainResult = await hindsightService.retain(retainPayload);

      if (retainResult && retainResult.success) {
        hindsightRetained = true;
        if (memoryOp) {
          await memoryOperationRepository.recordCompletion(memoryOp.id, {
            status: 'COMPLETED',
            memoryCount: 1
          });
        }
      }
    } catch (hindsightErr) {
      hindsightError = hindsightErr.message || 'Hindsight retain failed';
      logger.warn(
        { err: hindsightError, competitor: normalized.competitorName },
        'Hindsight memory retain operation failed or uncredited; PostgreSQL event safely preserved'
      );

      if (memoryOp) {
        const errorCode = hindsightError.includes('credit') || hindsightError.includes('Credits')
          ? 'INSUFFICIENT_CREDITS'
          : (hindsightErr.code || 'HINDSIGHT_RETAIN_FAILED');

        await memoryOperationRepository.recordCompletion(memoryOp.id, {
          status: 'FAILED',
          errorCode,
          metadata: { errorDetails: hindsightError }
        });
      }
    }

    return {
      success: true,
      isDuplicate: false,
      eventId: eventRecord?.id || normalized.contentHash,
      competitorName: normalized.competitorName,
      eventType: normalized.eventType,
      title: normalized.title,
      summary: normalized.summary,
      sourceUrl: normalized.sourceUrl,
      imageUrl: normalized.imageUrl || null,
      confidence: normalized.confidence,
      databasePersisted: Boolean(eventRecord),
      hindsightRetained,
      hindsightError
    };
  },

  async processBatch(items = [], options = {}) {
    const results = [];
    for (const item of items) {
      const res = await this.processItem(item, options);
      results.push(res);
    }
    return {
      total: items.length,
      processed: results.length,
      retainedInHindsight: results.filter(r => r.hindsightRetained).length,
      duplicatesSkipped: results.filter(r => r.isDuplicate).length,
      results
    };
  },

  async ingestEvent(rawItem, options = {}) {
    return this.processItem(rawItem, options);
  }
};

export default ingestionService;
