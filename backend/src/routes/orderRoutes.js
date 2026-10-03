import express from 'express';
import { getOrders, createOrder, confirmPayment, updateOrderStatus } from '../controllers/orderController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getOrders);
router.post('/', createOrder);
router.post('/:id/confirm-payment', confirmPayment);
router.patch('/:id/status', authenticateToken, requireRole('pharmacy_staff'), updateOrderStatus);

export default router;

