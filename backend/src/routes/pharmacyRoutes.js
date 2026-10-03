import express from 'express';
import { getPharmacyInfo, toggleStoreStatus } from '../controllers/pharmacyController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/info', getPharmacyInfo);
router.put('/status', authenticateToken, requireRole('pharmacy_staff'), toggleStoreStatus);

export default router;

