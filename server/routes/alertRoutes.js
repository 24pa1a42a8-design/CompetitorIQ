import { Router } from 'express';
import { alertController } from '../controllers/alertController.js';

const router = Router();

router.get('/', alertController.getAlerts);
router.get('/unread-count', alertController.getUnreadCount);
router.patch('/read-all', alertController.markAllAsRead);
router.post('/evaluate', alertController.evaluateAlerts);
router.get('/:id', alertController.getAlertById);
router.patch('/:id/read', alertController.updateAlertStatus);
router.patch('/:id', alertController.updateAlertStatus);

export default router;
