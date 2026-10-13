import express from 'express';
import { getOrders, createOrder, confirmPayment, updateOrderStatus, trackOrder, completeDeliveryOrder } from '../controllers/orderController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getOrders);
router.get('/:id/tracking', trackOrder);
router.post('/:id/customer-complete', completeDeliveryOrder);
router.post('/', createOrder);
router.post('/:id/confirm-payment', confirmPayment);
router.patch('/:id/status', authenticateToken, requireRole('pharmacy_staff'), updateOrderStatus);

export default router;

