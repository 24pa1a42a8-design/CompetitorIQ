import { Router } from 'express';
import { monitoringController } from '../controllers/monitoringController.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';

const router = Router();

router.get('/status', monitoringController.getStatus);
router.post('/run', adminMiddleware, monitoringController.runAll);
router.post('/run/:sourceId', adminMiddleware, monitoringController.runSingle);
router.post('/toggle', adminMiddleware, monitoringController.toggle);

export default router;
