import express from 'express';
import { loginPharmacy, verifyAuth } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginPharmacy);
router.get('/verify', authenticateToken, verifyAuth);

export default router;
