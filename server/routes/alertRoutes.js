import { Router } from 'express';
import { alertController } from '../controllers/alertController.js';

const router = Router();

router.get('/', alertController.getAlerts);
router.get('/:id', alertController.getAlertById);
router.patch('/:id', alertController.updateAlertStatus);
router.post('/evaluate', alertController.evaluateAlerts);

export default router;
