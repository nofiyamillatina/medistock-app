import express from 'express';
import { createPharmacyWithStaff, deleteEmptyPlatformPharmacy, getPharmacyInfo, getPharmacies, getPharmaciesForPlatformAdmin, getPlatformPharmacyDetail, resetPlatformStaffPassword, setPlatformPharmacyActive, toggleStoreStatus, updatePlatformPharmacy, updatePlatformStaff } from '../controllers/pharmacyController.js';
import { authenticateToken, optionalAuthenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/list', getPharmacies);
router.get('/admin', authenticateToken, requireRole('platform_admin'), getPharmaciesForPlatformAdmin);
router.post('/admin', authenticateToken, requireRole('platform_admin'), createPharmacyWithStaff);
router.get('/admin/:id', authenticateToken, requireRole('platform_admin'), getPlatformPharmacyDetail);
router.patch('/admin/:id', authenticateToken, requireRole('platform_admin'), updatePlatformPharmacy);
router.patch('/admin/:id/status', authenticateToken, requireRole('platform_admin'), setPlatformPharmacyActive);
router.patch('/admin/:id/staff/:staffId', authenticateToken, requireRole('platform_admin'), updatePlatformStaff);
router.post('/admin/:id/staff/:staffId/reset-password', authenticateToken, requireRole('platform_admin'), resetPlatformStaffPassword);
router.delete('/admin/:id', authenticateToken, requireRole('platform_admin'), deleteEmptyPlatformPharmacy);
router.get('/info', optionalAuthenticateToken, getPharmacyInfo);
router.put('/status', authenticateToken, requireRole('pharmacy_staff'), toggleStoreStatus);

export default router;

