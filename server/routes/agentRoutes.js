import { Router } from 'express';
import agentController from '../controllers/agentController.js';

const router = Router();

router.post('/query', agentController.query);
router.get('/conversations', agentController.getConversations);
router.get('/conversations/:id', agentController.getConversationMessages);
router.get('/conversations/:id/messages', agentController.getConversationMessages);

export default router;
