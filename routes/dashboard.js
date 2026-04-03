import express from 'express';
import { index, plansView , billingView} from '../controllers/dashboardController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', requireAuth, index);
router.get('/dashboard/plans', requireAuth, plansView);
router.get('/dashboard/billing', requireAuth, billingView);


export default router;