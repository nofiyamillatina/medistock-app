import express from 'express';
import { createPharmacyWithStaff, getPharmacyInfo, getPharmacies, getPharmaciesForPlatformAdmin, toggleStoreStatus } from '../controllers/pharmacyController.js';
import { authenticateToken, optionalAuthenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/list', getPharmacies);
router.get('/admin', authenticateToken, requireRole('platform_admin'), getPharmaciesForPlatformAdmin);
router.post('/admin', authenticateToken, requireRole('platform_admin'), createPharmacyWithStaff);
router.get('/info', optionalAuthenticateToken, getPharmacyInfo);
router.put('/status', authenticateToken, requireRole('pharmacy_staff'), toggleStoreStatus);

export default router;

