import { Router } from 'express';
import { strategicAnalysisController } from '../controllers/strategicAnalysisController.js';

const router = Router();

router.get('/', strategicAnalysisController.getAnalyses);
router.get('/:id', strategicAnalysisController.getAnalysisById);
router.post('/analyze', strategicAnalysisController.analyze);

export default router;
