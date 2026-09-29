import { Router } from 'express';
import adapterController from '../controllers/adapterController.js';

const router = Router();

router.post('/trigger', adapterController.trigger);
router.get('/sources', adapterController.listSources);

export default router;
