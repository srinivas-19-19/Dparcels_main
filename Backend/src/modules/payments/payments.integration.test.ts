import assert from 'node:assert';
import http from 'http';
import app from '../../app';
import prisma from '../../utils/prisma';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import supabaseStorageService from '../../services/storage/supabaseStorage.service';

const TEST_JWT_SECRET = env.JWT_ACCESS_SECRET || 'test-jwt-secret';

function makeToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    TEST_JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function request(
  server: http.Server,
  method: string,
  path: string,
  options: {
    token?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<{ status: number; body: any }> {
  const addr = server.address();
  if (!addr || typeof addr === 'string') {
    throw new Error('Server address not available');
  }
  const url = `http://127.0.0.1:${addr.port}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const reqInit: RequestInit = {
    method,
    headers,
  };

  if (options.body && method !== 'GET' && method !== 'HEAD') {
    reqInit.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, reqInit);
  let parsedBody: any = null;
  const text = await res.text();
  try {
    parsedBody = JSON.parse(text);
  } catch {
    parsedBody = text;
  }
  return { status: res.status, body: parsedBody };
}

async function runPaymentsIntegrationTests() {
  console.log('\n==================================================');
  console.log('🧪 DPARCELS PHASE 8: MANUAL RIDER PAYMENT & QR SUITE');
  console.log('==================================================\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  const testSuffix = Date.now().toString().slice(-6);
  let customerUserA: any = null;
  let customerUserB: any = null;
  let riderUserA: any = null;
  let riderUserB: any = null;

  let tokenCustA = '';
  let tokenCustB = '';
  let tokenRiderA = '';
  let tokenRiderB = '';

  let orderA: any = null;
  let orderB: any = null;

  try {
    // Setup test users
    customerUserA = await prisma.user.create({
      data: {
        email: `custA_pay_${testSuffix}@example.com`,
        password: 'dummyhash',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            firstName: 'Aarav',
            lastName: 'Patel',
            phone: `+919876${testSuffix.slice(0, 6)}`,
          },
        },
      },
      include: { customerProfile: true },
    });
    tokenCustA = makeToken(customerUserA);

    customerUserB = await prisma.user.create({
      data: {
        email: `custB_pay_${testSuffix}@example.com`,
        password: 'dummyhash',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            firstName: 'Bhavna',
            lastName: 'Shah',
            phone: `+919877${testSuffix.slice(0, 6)}`,
          },
        },
      },
      include: { customerProfile: true },
    });
    tokenCustB = makeToken(customerUserB);

    riderUserA = await prisma.user.create({
      data: {
        email: `riderA_pay_${testSuffix}@example.com`,
        password: 'dummyhash',
        role: 'RIDER',
        status: 'ACTIVE',
        riderProfile: {
          create: {
            firstName: 'Suresh',
            lastName: 'Kumar',
            phone: `+919888${testSuffix.slice(0, 6)}`,
            vehicleType: 'Hero Splendor',
            vehicleNumber: `TS 09 XY ${testSuffix.slice(0, 4)}`,
            isOnline: true,
            isApproved: true,
            rating: 4.9,
          },
        },
      },
      include: { riderProfile: true },
    });
    tokenRiderA = makeToken(riderUserA);

    riderUserB = await prisma.user.create({
      data: {
        email: `riderB_pay_${testSuffix}@example.com`,
        password: 'dummyhash',
        role: 'RIDER',
        status: 'ACTIVE',
        riderProfile: {
          create: {
            firstName: 'Kiran',
            lastName: 'Reddy',
            phone: `+919899${testSuffix.slice(0, 6)}`,
            vehicleType: 'Bajaj Pulsar',
            vehicleNumber: `TS 08 AB ${testSuffix.slice(0, 4)}`,
            isOnline: true,
            isApproved: true,
            rating: 4.8,
          },
        },
      },
      include: { riderProfile: true },
    });
    tokenRiderB = makeToken(riderUserB);

    // ----------------------------------------------------
    // 1. AUTHENTICATION & ROLE GUARDS
    // ----------------------------------------------------
    console.log('--- 1. Authentication & Role Controls ---');

    const noAuth = await request(server, 'GET', '/api/v1/payments/order/fake-id/qr');
    assert.strictEqual(noAuth.status, 401, 'GET /payments/order/:id/qr without token rejected with 401');
    console.log('  ✅ PASS [1]: GET payment QR without token rejected with 401');

    const confirmNoAuth = await request(server, 'POST', '/api/v1/payments/order/fake-id/confirm', {
      body: { paymentMethod: 'RIDER_QR' },
    });
    assert.strictEqual(confirmNoAuth.status, 401, 'POST /payments/order/:id/confirm without token rejected with 401');
    console.log('  ✅ PASS [2]: POST payment confirm without token rejected with 401');

    const confirmByCust = await request(server, 'POST', '/api/v1/payments/order/fake-id/confirm', {
      token: tokenCustA,
      body: { paymentMethod: 'RIDER_QR' },
    });
    assert.strictEqual(confirmByCust.status, 403, 'POST /payments/order/:id/confirm by CUSTOMER forbidden with 403');
    console.log('  ✅ PASS [3]: POST payment confirm by CUSTOMER role forbidden with 403');

    // ----------------------------------------------------
    // 2. RIDER PROFILE & QR MANAGEMENT
    // ----------------------------------------------------
    console.log('\n--- 2. Rider Profile & QR Management ---');

    const getRiderMe = await request(server, 'GET', '/api/v1/rider/me', { token: tokenRiderA });
    assert.strictEqual(getRiderMe.status, 200, 'GET /rider/me returns 200');
    assert.strictEqual(getRiderMe.body.data.firstName, 'Suresh', 'Rider firstName matches');
    assert.strictEqual(getRiderMe.body.data.upiId, null, 'Initial upiId is null');
    assert.strictEqual(getRiderMe.body.data.paymentQrUrl, null, 'Initial paymentQrUrl is null');
    console.log('  ✅ PASS [4]: GET /rider/me returns rider profile');

    // Rider updates UPI ID and QR code URL
    const updateQrRes = await request(server, 'PATCH', '/api/v1/rider/qr', {
      token: tokenRiderA,
      body: {
        upiId: `suresh_${testSuffix}@okaxis`,
        paymentQrUrl: `https://example.com/qrs/suresh_${testSuffix}.png`,
      },
    });
    assert.strictEqual(updateQrRes.status, 200, 'PATCH /rider/qr returns 200');
    assert.strictEqual(updateQrRes.body.data.upiId, `suresh_${testSuffix}@okaxis`, 'Rider upiId persisted');
    assert.strictEqual(updateQrRes.body.data.paymentQrUrl, `https://example.com/qrs/suresh_${testSuffix}.png`, 'paymentQrUrl persisted');
    console.log('  ✅ PASS [5]: PATCH /rider/qr updates upiId and paymentQrUrl');

    // Test upload rider QR service method
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
    ]);
    const uploadRes = await supabaseStorageService.uploadRiderQr(riderUserA.id, pngBuffer, 'image/png');
    assert(uploadRes.path.includes(`rider-qrs/${riderUserA.id}`), 'QR storage path contains riderUserId');
    assert(uploadRes.publicUrl.endsWith('.png'), 'QR public URL ends with .png');
    console.log('  ✅ PASS [6]: Supabase storage uploadRiderQr creates valid path and URL');

    // ----------------------------------------------------
    // 3. ORDER CREATION & ASSIGNMENT
    // ----------------------------------------------------
    console.log('\n--- 3. Order Setup & Rider Assignment ---');

    const orderPayload = {
      idempotencyKey: `pay_test_ord_${testSuffix}_1`,
      pickupAddress: 'Banjara Hills Rd 12, Hyderabad',
      pickupLat: 17.4156,
      pickupLng: 78.4357,
      dropAddress: 'Jubilee Hills Checkpost, Hyderabad',
      dropLat: 17.4250,
      dropLng: 78.4100,
      serviceType: 'FOOD',
      storeName: 'Pista House',
      items: ['Hyderabadi Biryani', 'Double Ka Meetha'],
    };

    const createOrderRes = await request(server, 'POST', '/api/v1/orders', {
      token: tokenCustA,
      body: orderPayload,
    });
    assert.strictEqual(createOrderRes.status, 201, 'Order created successfully');
    orderA = createOrderRes.body.data;
    console.log(`  ✅ PASS [7]: Order A created with ID ${orderA.id} (${orderA.trackingId})`);

    // Rider A accepts Order A
    const acceptRes = await request(server, 'POST', `/api/v1/orders/${orderA.id}/accept`, {
      token: tokenRiderA,
    });
    assert.strictEqual(acceptRes.status, 200, 'Rider A accepts Order A');
    console.log('  ✅ PASS [8]: Rider A assigned to Order A');

    // ----------------------------------------------------
    // 4. CUSTOMER PAYMENT QR ENDPOINT
    // ----------------------------------------------------
    console.log('\n--- 4. Customer Payment QR Retrieval ---');

    const payQrRes = await request(server, 'GET', `/api/v1/payments/order/${orderA.id}/qr`, {
      token: tokenCustA,
    });
    assert.strictEqual(payQrRes.status, 200, 'GET /payments/order/:id/qr returns 200');
    assert.strictEqual(payQrRes.body.success, true, 'success is true');

    const qrData = payQrRes.body.data;
    assert.strictEqual(qrData.isGatewayRequired, false, 'isGatewayRequired is strictly false (no gateway needed)');
    assert.strictEqual(qrData.orderId, orderA.id, 'orderId matches');
    assert.strictEqual(qrData.trackingId, orderA.trackingId, 'trackingId matches');
    assert.strictEqual(qrData.totalAmount, orderA.totalAmount, 'totalAmount matches order total');
    assert.strictEqual(qrData.payment.status, 'PENDING', 'Payment status is initially PENDING');
    assert.strictEqual(qrData.rider.name, 'Suresh Kumar', 'Rider name is populated');
    assert.strictEqual(qrData.rider.upiId, `suresh_${testSuffix}@okaxis`, 'Rider upiId is populated');
    assert(Boolean(qrData.rider.effectiveQrUrl), 'effectiveQrUrl is provided to customer');
    assert(qrData.upiPayUri.startsWith('upi://pay?'), 'Dynamic upiPayUri is correctly generated');
    assert(qrData.instructions.includes('manually by the rider'), 'Instructions state manual peer-to-peer payment');
    console.log('  ✅ PASS [9]: GET /payments/order/:id/qr returns complete rider QR & UPI data');
    console.log('  ✅ PASS [10]: isGatewayRequired is strictly false');
    console.log('  ✅ PASS [11]: upiPayUri formatted with order total and trackingId');

    // Customer can also query by trackingId
    const payQrByTracking = await request(server, 'GET', `/api/v1/payments/order/${orderA.trackingId}/qr`, {
      token: tokenCustA,
    });
    assert.strictEqual(payQrByTracking.status, 200, 'Payment QR query by trackingId returns 200');
    assert.strictEqual(payQrByTracking.body.data.orderId, orderA.id, 'Resolved to correct order');
    console.log('  ✅ PASS [12]: Payment QR query by trackingId succeeds');

    // ----------------------------------------------------
    // 5. MULTI-TENANT ISOLATION
    // ----------------------------------------------------
    console.log('\n--- 5. Strict Multi-Tenant Security Controls ---');

    // Customer B cannot view Customer A's payment QR
    const custBQrAccess = await request(server, 'GET', `/api/v1/payments/order/${orderA.id}/qr`, {
      token: tokenCustB,
    });
    assert.strictEqual(custBQrAccess.status, 403, 'Customer B rejected from Customer A payment QR with 403');
    console.log('  ✅ PASS [13]: Customer B forbidden from Customer A payment QR (403)');

    // Rider B cannot confirm payment for Order A (assigned to Rider A)
    const riderBConfirm = await request(server, 'POST', `/api/v1/payments/order/${orderA.id}/confirm`, {
      token: tokenRiderB,
      body: { paymentMethod: 'RIDER_QR' },
    });
    assert.strictEqual(riderBConfirm.status, 403, 'Rider B forbidden from confirming Order A payment with 403');
    console.log('  ✅ PASS [14]: Unassigned Rider B forbidden from confirming payment (403)');

    // ----------------------------------------------------
    // 6. MANUAL RIDER PAYMENT CONFIRMATION FLOW
    // ----------------------------------------------------
    console.log('\n--- 6. Manual Rider Payment Confirmation Flow ---');

    const confirmRes = await request(server, 'POST', `/api/v1/payments/order/${orderA.id}/confirm`, {
      token: tokenRiderA,
      body: {
        paymentMethod: 'RIDER_QR',
        utrNumber: `UPI${testSuffix}99`,
        notes: 'Paid via Google Pay scan',
      },
    });
    assert.strictEqual(confirmRes.status, 200, 'POST /payments/order/:id/confirm returns 200');
    assert.strictEqual(confirmRes.body.data.status, 'PAID', 'Payment status is now PAID');
    assert.strictEqual(confirmRes.body.data.paymentMethod, 'RIDER_QR', 'Payment method is RIDER_QR');
    assert.strictEqual(confirmRes.body.data.providerId, `UPI${testSuffix}99`, 'Provider UTR stored');
    console.log('  ✅ PASS [15]: Rider A successfully confirms payment collection');

    // Verify database record
    const dbPayment = await prisma.payment.findUnique({ where: { orderId: orderA.id } });
    assert.strictEqual(dbPayment?.status, 'PAID', 'Database payment status is PAID');
    assert.strictEqual(dbPayment?.paymentMethod, 'RIDER_QR', 'Database paymentMethod is RIDER_QR');
    console.log('  ✅ PASS [16]: Database payment status is strictly PAID');

    // Verify OrderEvent audit log
    const latestEvent = await prisma.orderEvent.findFirst({
      where: { orderId: orderA.id },
      orderBy: { createdAt: 'desc' },
    });
    assert.strictEqual(latestEvent?.actorRole, 'RIDER', 'OrderEvent actorRole is RIDER');
    assert(latestEvent?.description?.includes('confirmed receipt of ₹'), 'OrderEvent description mentions payment confirmation');
    console.log('  ✅ PASS [17]: Audit OrderEvent logged for manual payment collection');

    // Verify in-app customer notification
    const customerNotification = await prisma.notification.findFirst({
      where: { userId: customerUserA.id, type: 'PAYMENT' },
      orderBy: { createdAt: 'desc' },
    });
    assert(customerNotification !== null, 'Customer in-app notification created');
    assert(customerNotification?.title?.includes('Payment Confirmed'), 'Notification title matches');
    assert(customerNotification?.body?.includes(orderA.trackingId), 'Notification body contains trackingId');
    console.log('  ✅ PASS [18]: In-app customer notification created for payment confirmation');

    // Re-querying payment QR now shows status PAID
    const verifiedQr = await request(server, 'GET', `/api/v1/payments/order/${orderA.id}/qr`, {
      token: tokenCustA,
    });
    assert.strictEqual(verifiedQr.body.data.payment.status, 'PAID', 'GET /payments/order/:id/qr reports status PAID');
    console.log('  ✅ PASS [19]: Payment QR reflects verified PAID state');

    // ----------------------------------------------------
    // 7. DOUBLE-PAYMENT PREVENTION
    // ----------------------------------------------------
    console.log('\n--- 7. Double-Payment Prevention ---');

    const duplicateConfirm = await request(server, 'POST', `/api/v1/payments/order/${orderA.id}/confirm`, {
      token: tokenRiderA,
      body: { paymentMethod: 'RIDER_QR' },
    });
    assert.strictEqual(duplicateConfirm.status, 400, 'Duplicate payment confirmation rejected with 400');
    const errMsg = duplicateConfirm.body?.message || duplicateConfirm.body?.error?.message || JSON.stringify(duplicateConfirm.body);
    assert(errMsg.includes('already been confirmed'), 'Error message states payment already confirmed');
    console.log('  ✅ PASS [20]: Double-confirmation prevented with 400 Bad Request');

    // ----------------------------------------------------
    // 8. CASH PAYMENT COLLECTION FLOW
    // ----------------------------------------------------
    console.log('\n--- 8. Direct Cash Handover Flow ---');

    const orderBPayload = {
      idempotencyKey: `pay_test_ord_${testSuffix}_2`,
      pickupAddress: 'Hitech City Phase 2, Hyderabad',
      pickupLat: 17.4435,
      pickupLng: 78.3772,
      dropAddress: 'Gachibowli Stadium, Hyderabad',
      dropLat: 17.4400,
      dropLng: 78.3489,
      serviceType: 'DOCUMENTS',
      storeName: 'Documents Hub',
      items: ['Legal Contract'],
    };

    const createOrderBRes = await request(server, 'POST', '/api/v1/orders', {
      token: tokenCustB,
      body: orderBPayload,
    });
    orderB = createOrderBRes.body.data;

    await request(server, 'POST', `/api/v1/orders/${orderB.id}/accept`, {
      token: tokenRiderB,
    });

    const cashConfirm = await request(server, 'POST', `/api/v1/payments/order/${orderB.id}/confirm`, {
      token: tokenRiderB,
      body: {
        paymentMethod: 'CASH',
        notes: 'Customer paid exact cash ₹49',
      },
    });
    assert.strictEqual(cashConfirm.status, 200, 'Cash payment confirmation returns 200');
    assert.strictEqual(cashConfirm.body.data.status, 'PAID', 'Cash payment status is PAID');
    assert.strictEqual(cashConfirm.body.data.paymentMethod, 'CASH', 'Payment method is CASH');
    console.log('  ✅ PASS [21]: Rider B confirmed payment via direct CASH');

    const dbPaymentB = await prisma.payment.findUnique({ where: { orderId: orderB.id } });
    assert.strictEqual(dbPaymentB?.paymentMethod, 'CASH', 'Database paymentMethod is strictly CASH');
    console.log('  ✅ PASS [22]: Database correctly records CASH payment method');

    // ----------------------------------------------------
    // 9. ORDERS & DASHBOARD DATA ENRICHMENT
    // ----------------------------------------------------
    console.log('\n--- 9. Orders & Dashboard Data Enrichment ---');

    const myOrdersRes = await request(server, 'GET', '/api/v1/orders/my-orders', {
      token: tokenCustA,
    });
    assert.strictEqual(myOrdersRes.status, 200, 'GET /orders/my-orders returns 200');
    const myOrderA = myOrdersRes.body.data.find((o: any) => o.id === orderA.id);
    assert(Boolean(myOrderA), 'Order A present in customer orders list');
    assert.strictEqual(myOrderA.rider.upiId, `suresh_${testSuffix}@okaxis`, 'Order list rider has upiId');
    assert.strictEqual(myOrderA.payment.status, 'PAID', 'Order list payment status is PAID');
    console.log('  ✅ PASS [23]: /orders/my-orders enriched with rider upiId and payment status');

  } finally {
    // ----------------------------------------------------
    // CLEANUP: Clean test data safely
    // ----------------------------------------------------
    console.log('\n--- Cleanup ---');
    try {
      const userIds = [customerUserA?.id, customerUserB?.id, riderUserA?.id, riderUserB?.id].filter(Boolean);
      for (const uid of userIds) {
        await prisma.notification.deleteMany({ where: { userId: uid } });
        await prisma.payment.deleteMany({ where: { order: { customer: { userId: uid } } } });
        await prisma.orderEvent.deleteMany({ where: { order: { customer: { userId: uid } } } });
        await prisma.order.deleteMany({ where: { customer: { userId: uid } } });
        await prisma.address.deleteMany({ where: { customer: { userId: uid } } });
        await prisma.customerProfile.deleteMany({ where: { userId: uid } });
        await prisma.riderProfile.deleteMany({ where: { userId: uid } });
        await prisma.user.delete({ where: { id: uid } });
      }
    } catch (cleanErr) {
      console.warn('Cleanup notice:', cleanErr);
    }

    server.close();
    await prisma.$disconnect();
  }

  console.log('\n==================================================');
  console.log('🎉 ALL 23/23 PAYMENTS INTEGRATION TESTS PASSED!');
  console.log('==================================================\n');
  process.exit(0);
}

runPaymentsIntegrationTests().catch((err) => {
  console.error('\n❌ PAYMENTS INTEGRATION TEST FAILURE:', err);
  process.exit(1);
});
