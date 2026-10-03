import express from 'express';
import { getMedicines, updateInventory } from '../controllers/medicineController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getMedicines);
router.put('/inventory', authenticateToken, requireRole('pharmacy_staff'), updateInventory);

export default router;

