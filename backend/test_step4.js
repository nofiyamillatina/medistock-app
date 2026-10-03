import jwt from 'jsonwebtoken';


const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'medistock_super_secret_key_2026';

async function runTests() {
  console.log('=== RUNNING STEP 4 INTEGRATION TESTS ===\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, extraInfo = '') {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${testName} ${extraInfo}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${testName} ${extraInfo}`);
    }
  }

  // 1. Valid Login
  const validLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'apotek@medistock.id', password: 'password123' })
  });
  const validLoginData = await validLoginRes.json();
  assert(
    validLoginRes.status === 200 && validLoginData.success === true && !!validLoginData.token,
    'Login dengan credential valid',
    `Status: ${validLoginRes.status}`
  );
  const pharmacyToken = validLoginData.token;

  // 2. Invalid Password Login
  const invalidLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'apotek@medistock.id', password: 'wrongpassword' })
  });
  assert(
    invalidLoginRes.status === 401,
    'Login dengan password salah (HTTP 401)',
    `Status: ${invalidLoginRes.status}`
  );

  // 3. Sensitive Endpoint without Token
  const noTokenRes = await fetch(`${BASE_URL}/pharmacy/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isOpen: true })
  });
  assert(
    noTokenRes.status === 401,
    'Request endpoint sensitif tanpa JWT (HTTP 401)',
    `Status: ${noTokenRes.status}`
  );

  // 4. Sensitive Endpoint with Valid pharmacy_staff Token
  const validTokenRes = await fetch(`${BASE_URL}/pharmacy/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pharmacyToken}`
    },
    body: JSON.stringify({ isOpen: true })
  });
  assert(
    validTokenRes.status === 200,
    'Request endpoint sensitif dengan JWT pharmacy_staff (HTTP 200)',
    `Status: ${validTokenRes.status}`
  );

  // 5. Sensitive Endpoint with Customer Role (Role Mismatch)
  const customerToken = jwt.sign(
    { id: 'CUST-1', role: 'customer', email: 'customer@test.com' },
    JWT_SECRET
  );
  const wrongRoleRes = await fetch(`${BASE_URL}/pharmacy/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({ isOpen: true })
  });
  assert(
    wrongRoleRes.status === 403,
    'Request endpoint sensitif dengan role customer (HTTP 403)',
    `Status: ${wrongRoleRes.status}`
  );

  // 6. GET /api/medicines
  const getMedsRes = await fetch(`${BASE_URL}/medicines`);
  assert(
    getMedsRes.status === 200,
    'GET /api/medicines (HTTP 200)',
    `Status: ${getMedsRes.status}`
  );

  // 7. GET /api/pharmacy/info
  const getInfoRes = await fetch(`${BASE_URL}/pharmacy/info`);
  assert(
    getInfoRes.status === 200,
    'GET /api/pharmacy/info (HTTP 200)',
    `Status: ${getInfoRes.status}`
  );

  // 8. GET /api/orders
  const getOrdersRes = await fetch(`${BASE_URL}/orders`);
  assert(
    getOrdersRes.status === 200,
    'GET /api/orders (HTTP 200)',
    `Status: ${getOrdersRes.status}`
  );

  // 9. Customer Create Order
  const createOrderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Test Customer',
      phone: '081299990000',
      address: 'Jl. Test No. 1',
      deliveryType: 'Pengantaran',
      items: [{ name: 'Paracetamol 500mg', qty: 1, price: 12500 }],
      subtotal: 12500,
      serviceFee: 3000,
      totalAmount: 15500
    })
  });
  assert(
    createOrderRes.status === 201,
    'Customer dapat membuat order (HTTP 201)',
    `Status: ${createOrderRes.status}`
  );

  console.log(`\nRESULTS: ${passed}/${total} tests passed.`);
  if (passed === total) {
    console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED!');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
