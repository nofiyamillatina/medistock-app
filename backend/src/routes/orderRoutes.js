import express from 'express';
import { getOrders, getCustomerOrders, getCustomerPaymentStatus, createOrder, confirmPayment, verifyCustomerPayment, updateOrderStatus, trackOrder, completeDeliveryOrder, submitOrderReview } from '../controllers/orderController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('pharmacy_staff'), getOrders);
router.get('/customer/history', authenticateToken, requireRole('customer'), getCustomerOrders);
router.get('/:id/payment-status', authenticateToken, requireRole('customer'), getCustomerPaymentStatus);
router.get('/:id/tracking', trackOrder);
router.post('/:id/customer-complete', authenticateToken, requireRole('customer'), completeDeliveryOrder);
router.post('/:id/review', authenticateToken, requireRole('customer'), submitOrderReview);
router.post('/:id/confirm-payment', authenticateToken, requireRole('customer'), confirmPayment);
router.post('/:id/verify-payment', authenticateToken, requireRole('pharmacy_staff'), verifyCustomerPayment);
router.post('/', authenticateToken, requireRole('customer'), createOrder);
router.patch('/:id/status', authenticateToken, requireRole('pharmacy_staff'), updateOrderStatus);

export default router;
