import express from 'express';
import { loginPharmacy, loginPlatformAdmin, loginCustomer, registerCustomer, verifyAuth } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { customerLoginRateLimit, customerRegisterRateLimit, pharmacyLoginRateLimit, platformAdminLoginRateLimit } from '../middleware/authRateLimitMiddleware.js';

const router = express.Router();

router.post('/login', pharmacyLoginRateLimit, loginPharmacy);
router.post('/platform-admin/login', platformAdminLoginRateLimit, loginPlatformAdmin);
router.post('/customer/login', customerLoginRateLimit, loginCustomer);
router.post('/customer/register', customerRegisterRateLimit, registerCustomer);
router.get('/verify', authenticateToken, verifyAuth);

export default router;
