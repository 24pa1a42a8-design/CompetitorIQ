import { Router } from 'express';
import { competitiveComparisonController } from '../controllers/competitiveComparisonController.js';

const router = Router();

router.get('/', competitiveComparisonController.compare);

export default router;
