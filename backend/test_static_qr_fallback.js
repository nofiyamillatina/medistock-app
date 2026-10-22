import 'dotenv/config';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import prisma from './src/config/database.js';

const port = 52003;
const apiUrl = `http://127.0.0.1:${port}/api`;
const orderIds = [];
const userIds = [];
const output = [];
let medicineId;
let backend;

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, options);
  return { response, data: await response.json() };
}

function headers(token, json = false) {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`
  };
}

async function waitForApi() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (backend.exitCode !== null) throw new Error(`QR payment backend exited during startup:\n${output.join('')}`);
    try {
      const response = await fetch(`${apiUrl}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`QR payment backend did not become ready:\n${output.join('')}`);
}

async function registerCustomer(email) {
  const registration = await request('/auth/customer/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!' })
  });
  assert.equal(registration.response.status, 201, 'create customer for QR payment order');
  userIds.push(registration.data.user.id);
  return registration.data;
}

async function createOrder(token, medicineName, quantity) {
  const result = await request('/orders', {
    method: 'POST',
    headers: headers(token, true),
    body: JSON.stringify({
      customerName: 'Pelanggan QR Statis',
      phone: '081299990000',
      address: 'Jalan Sementara 1',
      deliveryType: 'Pengantaran',
      items: [{ medicineId, name: medicineName, qty: quantity, price: 1 }]
    })
  });
  assert.equal(result.response.status, 201, `create order: ${JSON.stringify(result.data)}`);
  orderIds.push(result.data.data.id);
  return result.data.data;
}

try {
  await prisma.$connect();
  const suffix = Date.now();
  medicineId = `STATIC-QR-TEST-${suffix}`;
  await prisma.medicines.create({
    data: { id: medicineId, name: 'Obat QR Statis', price: 2100, stock: 4, status: 'Tersedia' }
  });
  backend = spawn(process.execPath, ['src/server.js'], {
    cwd: fileURLToPath(new URL('.', import.meta.url)),
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      NODE_ENV: 'development',
      JWT_SECRET: process.env.JWT_SECRET || 'medistock_super_secret_key_2026'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  backend.stdout.on('data', (chunk) => output.push(chunk.toString()));
  backend.stderr.on('data', (chunk) => output.push(chunk.toString()));
  await waitForApi();

  const suffixEmail = `static-qr-${suffix}@example.com`;
  const customer = await registerCustomer(suffixEmail);
  const otherCustomer = await registerCustomer(`static-qr-other-${suffix}@example.com`);
  const pharmacyLogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'apotek@medistock.com', password: 'password123' })
  });
  assert.equal(pharmacyLogin.response.status, 200, 'login as pharmacy staff to verify payment');
  const pharmacyToken = pharmacyLogin.data.token;
  const order = await createOrder(customer.token, 'Obat QR Statis', 1);
  assert.equal(order.totalAmount, 5100, 'bill uses server-calculated amount');
  assert.equal(order.paymentStatus, 'Menunggu Pembayaran', 'new static QR order is unpaid');
  assert.equal((await prisma.medicines.findUnique({ where: { id: medicineId } })).stock, 4, 'stock is unchanged before customer confirmation');

  const unauthenticated = await request(`/orders/${order.id}/confirm-payment`, { method: 'POST' });
  assert.equal(unauthenticated.response.status, 401, 'payment confirmation requires authentication');
  const wrongOwner = await request(`/orders/${order.id}/confirm-payment`, {
    method: 'POST',
    headers: headers(otherCustomer.token)
  });
  assert.equal(wrongOwner.response.status, 404, 'another customer cannot confirm this order');

  const prematureConfirmation = await request(`/orders/${order.id}/confirm-payment`, {
    method: 'POST',
    headers: headers(customer.token)
  });
  assert.equal(prematureConfirmation.response.status, 409, 'customer cannot confirm payment before pharmacy verification');

  const prematurePharmacyStatus = await request(`/orders/${order.id}/payment-status`, {
    headers: headers(customer.token)
  });
  assert.equal(prematurePharmacyStatus.data.data.paymentStatus, 'Menunggu Pembayaran', 'customer status remains pending until manual verification');

  const customerCannotVerify = await request(`/orders/${order.id}/verify-payment`, {
    method: 'POST',
    headers: headers(customer.token)
  });
  assert.equal(customerCannotVerify.response.status, 403, 'only pharmacy staff can verify payments');

  const paymentVerification = await request(`/orders/${order.id}/verify-payment`, {
    method: 'POST',
    headers: headers(pharmacyToken)
  });
  assert.equal(paymentVerification.response.status, 200, `pharmacy can verify payment: ${JSON.stringify(paymentVerification.data)}`);
  assert.equal((await prisma.medicines.findUnique({ where: { id: medicineId } })).stock, 3, 'stock decreases after pharmacy verification');

  const customerPaymentStatus = await request(`/orders/${order.id}/payment-status`, {
    headers: headers(customer.token)
  });
  assert.equal(customerPaymentStatus.data.data.paymentStatus, 'Lunas (QRIS)', 'customer sees verified status for enabling button');

  const confirmation = await request(`/orders/${order.id}/confirm-payment`, {
    method: 'POST',
    headers: headers(customer.token)
  });
  assert.equal(confirmation.response.status, 200, `customer can acknowledge verified payment: ${JSON.stringify(confirmation.data)}`);
  const paidOrder = await prisma.orders.findUnique({ where: { id: order.id } });
  assert.equal(paidOrder.payment_status, 'Lunas (QRIS)', 'pharmacy verification is recorded');
  assert.equal(paidOrder.order_status, 'Menunggu Konfirmasi', 'pharmacy can now process the order');

  const repeatedConfirmation = await request(`/orders/${order.id}/confirm-payment`, {
    method: 'POST',
    headers: headers(customer.token)
  });
  assert.equal(repeatedConfirmation.response.status, 200, 'repeat confirmation is idempotent');
  assert.equal((await prisma.medicines.findUnique({ where: { id: medicineId } })).stock, 3, 'repeat confirmation does not decrease stock twice');

  const repeatedVerification = await request(`/orders/${order.id}/verify-payment`, {
    method: 'POST',
    headers: headers(pharmacyToken)
  });
  assert.equal(repeatedVerification.response.status, 200, 'repeated pharmacy verification is idempotent');
  assert.equal((await prisma.medicines.findUnique({ where: { id: medicineId } })).stock, 3, 'repeated pharmacy verification does not decrease stock twice');

  const unavailableStockOrder = await createOrder(customer.token, 'Obat QR Statis', 2);
  await prisma.medicines.update({ where: { id: medicineId }, data: { stock: 0, status: 'Habis' } });
  const insufficientStock = await request(`/orders/${unavailableStockOrder.id}/verify-payment`, {
    method: 'POST',
    headers: headers(pharmacyToken)
  });
  assert.equal(insufficientStock.response.status, 409, 'verification fails if stock is no longer available');
  assert.equal((await prisma.orders.findUnique({ where: { id: unavailableStockOrder.id } })).payment_status, 'Menunggu Pembayaran', 'failed confirmation leaves order unpaid');

  const history = await request('/orders/customer/history', { headers: headers(customer.token) });
  assert.equal(history.data.data.find((entry) => entry.id === order.id).paymentStatus, 'Lunas (QRIS)', 'order history records payment confirmation');

  console.log('Static QR payment test passed: pharmacy-only verification, customer payment status, acknowledgement, idempotence, stock validation, and history.');
} catch (error) {
  console.error(error);
  if (output.length) console.error(output.join(''));
  process.exitCode = 1;
} finally {
  if (backend && backend.exitCode === null) backend.kill();
  if (orderIds.length) await prisma.orders.deleteMany({ where: { id: { in: orderIds } } });
  if (userIds.length) await prisma.users.deleteMany({ where: { id: { in: userIds } } });
  if (medicineId) await prisma.medicines.deleteMany({ where: { id: medicineId } });
  await prisma.$disconnect();
}
