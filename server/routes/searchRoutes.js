import { Router } from 'express';
import { handleGlobalSearch } from '../controllers/searchController.js';

const router = Router();

router.get('/', handleGlobalSearch);

export default router;
