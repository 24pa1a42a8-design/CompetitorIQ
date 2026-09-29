import { Router } from 'express';
import { monitoringController } from '../controllers/monitoringController.js';

const router = Router();

router.get('/status', monitoringController.getStatus);
router.post('/run', monitoringController.runAll);
router.post('/run/:sourceId', monitoringController.runSingle);
router.post('/toggle', monitoringController.toggle);

export default router;
