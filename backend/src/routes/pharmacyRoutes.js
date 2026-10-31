import express from 'express';
import { getPharmacyInfo, getPharmacies, toggleStoreStatus } from '../controllers/pharmacyController.js';
import { authenticateToken, optionalAuthenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/list', getPharmacies);
router.get('/info', optionalAuthenticateToken, getPharmacyInfo);
router.put('/status', authenticateToken, requireRole('pharmacy_staff'), toggleStoreStatus);

export default router;

