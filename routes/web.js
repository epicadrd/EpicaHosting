import express from 'express';
import { home, success, cancel } from '../controllers/homeController.js';

const router = express.Router();

router.get('/', home);
router.get('/success', success);
router.get('/cancel', cancel);

export default router;