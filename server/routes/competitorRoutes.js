import { Router } from 'express';
import competitorController from '../controllers/competitorController.js';

const router = Router();

router.get('/', competitorController.getAll);
router.get('/:id', competitorController.getById);

export default router;
