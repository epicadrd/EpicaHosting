import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { selectPlan } from '../controllers/planController.js';

const router = express.Router();

router.post('/select', requireAuth, selectPlan);

export default router;