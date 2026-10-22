import express from 'express';
import { getOrders, getCustomerOrders, createOrder, confirmPayment, updateOrderStatus, trackOrder, completeDeliveryOrder } from '../controllers/orderController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('pharmacy_staff'), getOrders);
router.get('/customer/history', authenticateToken, requireRole('customer'), getCustomerOrders);
router.get('/:id/tracking', trackOrder);
router.post('/:id/customer-complete', authenticateToken, requireRole('customer'), completeDeliveryOrder);
router.post('/', authenticateToken, requireRole('customer'), createOrder);
router.post('/:id/confirm-payment', authenticateToken, requireRole('customer'), confirmPayment);
router.patch('/:id/status', authenticateToken, requireRole('pharmacy_staff'), updateOrderStatus);

export default router;
