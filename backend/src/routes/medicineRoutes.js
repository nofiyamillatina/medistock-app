import express from 'express';
import { getMedicines, updateInventory } from '../controllers/medicineController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getMedicines);
router.put('/inventory', authenticateToken, updateInventory);

export default router;
