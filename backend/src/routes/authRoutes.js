import express from 'express';
import { loginPharmacy, loginCustomer, registerCustomer, verifyAuth } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginPharmacy);
router.post('/customer/login', loginCustomer);
router.post('/customer/register', registerCustomer);
router.get('/verify', authenticateToken, verifyAuth);

export default router;
