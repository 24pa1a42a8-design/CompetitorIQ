import { Router } from 'express';
import { getHealthStatus, getReadinessStatus, getOllamaStatus } from '../controllers/healthController.js';

const router = Router();

router.get('/', getHealthStatus);
router.get('/ready', getReadinessStatus);
router.get('/ollama', getOllamaStatus);

export default router;
