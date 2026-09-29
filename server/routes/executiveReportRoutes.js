import { Router } from 'express';
import { executiveReportController } from '../controllers/executiveReportController.js';

const router = Router();

router.get('/', executiveReportController.getReports);
router.get('/:id', executiveReportController.getReportById);
router.post('/generate', executiveReportController.generate);

export default router;
