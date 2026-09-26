import express from 'express';
import { getPharmacyInfo, toggleStoreStatus } from '../controllers/pharmacyController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/info', getPharmacyInfo);
router.put('/status', authenticateToken, toggleStoreStatus);

export default router;
