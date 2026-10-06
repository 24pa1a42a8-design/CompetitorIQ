import { Router } from 'express';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  handleIngestItem,
  handleBatchIngest,
  handleGetIngestedEvents,
  handleGetEventById,
  handleRefreshOfficialSources,
  handleRefreshCompetitorSources,
  ingestItemBodySchema,
  batchIngestBodySchema
} from '../controllers/ingestionController.js';

const router = Router();

router.post('/ingest', validate({ body: ingestItemBodySchema }), handleIngestItem);
router.post('/batch', validate({ body: batchIngestBodySchema }), handleBatchIngest);
router.get('/events', handleGetIngestedEvents);
router.get('/events/:id', handleGetEventById);
router.post('/refresh', handleRefreshOfficialSources);
router.post('/trigger', handleRefreshOfficialSources);
router.post('/competitor/:slug', handleRefreshCompetitorSources);

export default router;

