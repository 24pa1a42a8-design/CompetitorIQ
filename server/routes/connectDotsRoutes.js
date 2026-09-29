import { Router } from 'express';
import { connectDotsController } from '../controllers/connectDotsController.js';

const router = Router();

router.get('/', connectDotsController.getPatterns);
router.get('/patterns', connectDotsController.getPatterns);
router.get('/:id', connectDotsController.getPatternById);
router.post('/analyze', connectDotsController.analyze);

export default router;
