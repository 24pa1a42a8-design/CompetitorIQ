import { Router } from 'express';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  retainHandler,
  recallHandler,
  reflectHandler,
  statusHandler,
  getOperationsHandler,
  retainBodySchema,
  recallBodySchema,
  reflectBodySchema
} from '../controllers/hindsightController.js';

const router = Router();

router.get('/status', statusHandler);
router.get('/operations', getOperationsHandler);
router.post('/retain', validate({ body: retainBodySchema }), retainHandler);
router.post('/recall', validate({ body: recallBodySchema }), recallHandler);
router.post('/reflect', validate({ body: reflectBodySchema }), reflectHandler);

export default router;
