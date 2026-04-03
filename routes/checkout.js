import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { createCheckoutSession } from '../controllers/checkoutController.js';

const router = express.Router();

router.get('/', requireAuth, createCheckoutSession);

export default router;