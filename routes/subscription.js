import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  cancelSubscription,
  reactivateSubscription
} from '../controllers/subscriptionController.js';

const router = express.Router();

router.post('/cancel', requireAuth, cancelSubscription);
router.post('/reactivate', requireAuth, reactivateSubscription);

export default router;