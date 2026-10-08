import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = Router();

router.post('/token', authLimiter, authController.issueToken);
router.post('/login', authLimiter, authController.issueToken);

export default router;
