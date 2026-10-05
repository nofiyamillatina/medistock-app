import express from 'express';
import { createMedicine, deleteMedicine, getMedicines, updateInventory } from '../controllers/medicineController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getMedicines);
router.post('/', authenticateToken, requireRole('pharmacy_staff'), createMedicine);
router.put('/inventory', authenticateToken, requireRole('pharmacy_staff'), updateInventory);
router.delete('/:id', authenticateToken, requireRole('pharmacy_staff'), deleteMedicine);

export default router;

