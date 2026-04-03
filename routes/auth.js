import express from 'express';
import {
  showLogin,
  showRegister,
  login,
  register,
  logout
} from '../controllers/authController.js';
import { requireGuest } from '../middlewares/guestMiddleware.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/login', requireGuest, showLogin);
router.post('/login', requireGuest, login);

router.get('/register', requireGuest, showRegister);
router.post('/register', requireGuest, register);

router.post('/logout', requireAuth, logout);

export default router;