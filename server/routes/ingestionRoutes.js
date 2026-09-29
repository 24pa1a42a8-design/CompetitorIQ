import { Router } from 'express';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  handleIngestItem,
  handleBatchIngest,
  handleGetIngestedEvents,
  ingestItemBodySchema,
  batchIngestBodySchema
} from '../controllers/ingestionController.js';

const router = Router();

router.post('/ingest', validate({ body: ingestItemBodySchema }), handleIngestItem);
router.post('/batch', validate({ body: batchIngestBodySchema }), handleBatchIngest);
router.get('/events', handleGetIngestedEvents);

export default router;
