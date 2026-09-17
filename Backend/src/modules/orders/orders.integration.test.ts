import express from 'express';
import http from 'http';
import orderRoutes from './orders.routes';
import prisma from '../../utils/prisma';
import { generateAccessToken } from '../../utils/jwt';

async function runOrdersIntegrationTests() {
  console.log('\n==================================================');
  console.log('🧪 DPARCELS PHASE 7: CREATE ORDER & LIFECYCLE SUITE');
  console.log('==================================================\n');

  const app = express();
  app.use(express.json());
  app.use('/api/v1/orders', orderRoutes);

  // Global test error handler
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal test error',
    });
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, description: string) {
    totalCount++;
    if (condition) {
      console.log(`  ✅ PASS [${totalCount}]: ${description}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL [${totalCount}]: ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    }
  }

  const timestamp = Date.now();
  const emailA = `order_cust_a_${timestamp}@example.com`;
  const emailB = `order_cust_b_${timestamp}@example.com`;
  const riderEmail = `order_rider_${timestamp}@example.com`;

  let userA: any = null;
  let userB: any = null;
  let riderUser: any = null;

  let tokenA: string = '';
  let tokenB: string = '';
  let riderToken: string = '';

  let createdOrderId: string = '';
  let createdTrackingId: string = '';

  try {
    // ----------------------------------------------------
    // PRE-CLEANUP: Clean any lingering test records
    // ----------------------------------------------------
    try {
      await prisma.notification.deleteMany({ where: { user: { email: { startsWith: 'order_' } } } });
      await prisma.payment.deleteMany({ where: { idempotencyKey: { startsWith: 'pay_ord_' } } });
      await prisma.orderEvent.deleteMany({ where: { order: { trackingId: { startsWith: 'DPARC-TEST-' } } } });
      await prisma.order.deleteMany({ where: { trackingId: { startsWith: 'DPARC-TEST-' } } });
      await prisma.address.deleteMany({ where: { customer: { user: { email: { startsWith: 'order_' } } } } });
      await prisma.customerProfile.deleteMany({ where: { user: { email: { startsWith: 'order_' } } } });
      await prisma.riderProfile.deleteMany({ where: { user: { email: { startsWith: 'order_' } } } });
      await prisma.user.deleteMany({ where: { email: { startsWith: 'order_' } } });
    } catch {
      // ignore
    }

    // ----------------------------------------------------
    // SETUP: Users & Profiles in PostgreSQL
    // ----------------------------------------------------
    userA = await prisma.user.create({
      data: {
        email: emailA,
        password: 'Password123!',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            firstName: 'Rahul',
            lastName: 'Verma',
            phone: '9888222333',
          },
        },
      },
      include: { customerProfile: true },
    });

    userB = await prisma.user.create({
      data: {
        email: emailB,
        password: 'Password123!',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            firstName: 'Sneha',
            lastName: 'Patel',
            phone: '9777444555',
          },
        },
      },
      include: { customerProfile: true },
    });

    riderUser = await prisma.user.create({
      data: {
        email: riderEmail,
        password: 'Password123!',
        role: 'RIDER',
        status: 'ACTIVE',
        riderProfile: {
          create: {
            firstName: 'Karan',
            lastName: 'Kumar',
            phone: '9666777888',
            vehicleType: 'Motorcycle',
            vehicleNumber: 'TS 08 AB 1234',
            isOnline: true,
            isApproved: true,
          },
        },
      },
      include: { riderProfile: true },
    });

    tokenA = generateAccessToken({ userId: userA.id, role: userA.role });
    tokenB = generateAccessToken({ userId: userB.id, role: userB.role });
    riderToken = generateAccessToken({ userId: riderUser.id, role: riderUser.role });

    // ----------------------------------------------------
    // 1. AUTHENTICATION & ROLE ACCESS CONTROLS
    // ----------------------------------------------------
    console.log('--- 1. Authentication & Security Controls ---');

    // Test 1: Missing JWT returns 401
    const noTokenRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickupAddress: 'Test' }),
    });
    assert(noTokenRes.status === 401, 'POST /orders without JWT rejected with 401');

    // Test 2: Invalid JWT returns 401
    const badTokenRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.token.payload',
      },
      body: JSON.stringify({ pickupAddress: 'Test' }),
    });
    assert(badTokenRes.status === 401, 'POST /orders with invalid JWT rejected with 401');

    // Test 3: RIDER role cannot create customer order (403)
    const riderCreateRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${riderToken}`,
      },
      body: JSON.stringify({
        idempotencyKey: `ord_rider_${timestamp}`,
        pickupAddress: 'Banjara Hills',
        pickupLat: 17.4156,
        pickupLng: 78.4357,
        dropAddress: 'Hitech City',
        dropLat: 17.4435,
        dropLng: 78.3772,
      }),
    });
    assert(riderCreateRes.status === 403, 'POST /orders by RIDER role forbidden with 403');

    // ----------------------------------------------------
    // 2. INPUT VALIDATION CONTROLS
    // ----------------------------------------------------
    console.log('\n--- 2. Input Validation Controls ---');

    // Test 4: Missing idempotencyKey rejected with 400
    const noIdempRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        pickupAddress: 'Banjara Hills',
        pickupLat: 17.4156,
        pickupLng: 78.4357,
        dropAddress: 'Hitech City',
        dropLat: 17.4435,
        dropLng: 78.3772,
      }),
    });
    assert(noIdempRes.status === 400, 'Missing idempotencyKey rejected with 400');

    // Test 5: Missing drop address rejected with 400
    const noDropRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        idempotencyKey: `ord_nodrop_${timestamp}`,
        pickupAddress: 'Banjara Hills',
        pickupLat: 17.4156,
        pickupLng: 78.4357,
      }),
    });
    assert(noDropRes.status === 400, 'Missing drop address rejected with 400');

    // Test 6: Invalid coordinates rejected with 400
    const badCoordsRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        idempotencyKey: `ord_badcoord_${timestamp}`,
        pickupAddress: 'Banjara Hills',
        pickupLat: 195, // out of range
        pickupLng: 78.4357,
        dropAddress: 'Hitech City',
        dropLat: 17.4435,
        dropLng: 78.3772,
      }),
    });
    assert(badCoordsRes.status === 400, 'Out-of-range coordinates rejected with 400');

    // ----------------------------------------------------
    // 3. ORDER CREATION & PRICING VERIFICATION
    // ----------------------------------------------------
    console.log('\n--- 3. Order Creation & Pricing Engine Integration ---');

    const uniqueIdempKey = `ord_success_${timestamp}`;
    const orderPayload = {
      idempotencyKey: uniqueIdempKey,
      pickupAddress: 'Bawarchi Restaurant, RTC X Roads',
      pickupLat: 17.4042,
      pickupLng: 78.4983,
      dropAddress: 'Apartment 4A, Road No 10, Banjara Hills',
      dropLat: 17.4156,
      dropLng: 78.4357,
      serviceType: 'FOOD',
      packageCategory: 'food',
      storeName: 'Bawarchi Restaurant',
      items: ['2 Mutton Biryani', '1 Butter Naan', '1 Thums Up'],
      instructions: 'Please ask restaurant for extra salan and ring the doorbell',
      totalAmount: 999, // Intentional spoofed amount from client; server MUST recalculate!
    };

    // Test 7: Valid order creation returns 201
    const createRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(orderPayload),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'POST /orders returns 201 Created');
    assert(createData.success === true, 'Response success is true');

    const ord = createData.data;
    createdOrderId = ord.id;
    createdTrackingId = ord.trackingId;

    // Test 8: Order metadata matches
    assert(typeof ord.trackingId === 'string' && ord.trackingId.startsWith('DPARC-'), 'trackingId has DPARC- prefix');
    assert(ord.status === 'ASSIGNING', 'Initial order status is ASSIGNING');
    assert(ord.serviceType === 'FOOD', 'serviceType matches FOOD');
    assert(ord.storeName === 'Bawarchi Restaurant', 'storeName matches Bawarchi Restaurant');
    assert(Array.isArray(ord.items) && ord.items.length === 3, 'items array persisted with 3 items');
    assert(ord.instructions.includes('extra salan'), 'instructions persisted');

    // Test 9: Server recalculated price securely via PricingService (Client spoof ignored)
    assert(ord.basePrice === 39, 'basePrice is strictly ₹39');
    assert(ord.totalAmount !== 999, 'Client spoofed totalAmount (999) was safely overwritten by server calculation');
    assert(ord.totalAmount === ord.basePrice + ord.distancePrice, 'totalAmount equals basePrice + distancePrice');
    assert(typeof ord.distanceKm === 'number' && ord.distanceKm > 0, 'distanceKm is positive number');

    // ----------------------------------------------------
    // 4. TRANSACTIONAL AUDITING: EVENTS, PAYMENT, NOTIFICATIONS
    // ----------------------------------------------------
    console.log('\n--- 4. Transactional Auditing & In-App Notifications ---');

    // Test 10: OrderEvent created in PostgreSQL
    const event = await prisma.orderEvent.findFirst({
      where: { orderId: createdOrderId },
    });
    assert(event !== null, 'OrderEvent was created in database');
    assert(event?.newStatus === 'ASSIGNING', 'OrderEvent newStatus is ASSIGNING');
    assert(event?.actorRole === 'CUSTOMER', 'OrderEvent actorRole is CUSTOMER');

    // Test 11: Payment record created with PENDING
    const payment = await prisma.payment.findFirst({
      where: { orderId: createdOrderId },
    });
    assert(payment !== null, 'Payment record was created in database');
    assert(payment?.status === 'PENDING', 'Payment status is PENDING');
    assert(payment?.amount === ord.totalAmount, 'Payment amount equals order totalAmount');

    // Test 12: In-app Notification created for customer
    const notification = await prisma.notification.findFirst({
      where: { userId: userA.id, type: 'ORDER' },
      orderBy: { createdAt: 'desc' },
    });
    assert(notification !== null, 'In-app notification created for customer');
    assert(notification?.title === 'Order Placed Successfully', 'Notification title matches');
    assert(notification?.body.includes(createdTrackingId), 'Notification body contains trackingId');

    // ----------------------------------------------------
    // 5. IDEMPOTENCY PROTECTION
    // ----------------------------------------------------
    console.log('\n--- 5. Idempotency Protection ---');

    // Test 13: Submitting identical idempotencyKey returns existing order without creating duplicate
    const idempRepeatRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(orderPayload),
    });
    const idempRepeatData = await idempRepeatRes.json();
    assert(idempRepeatRes.status === 201 || idempRepeatRes.status === 200, 'Idempotent request returns 200/201');
    assert(idempRepeatData.data.id === createdOrderId, 'Returned order ID matches original created order');
    assert(idempRepeatData.data.trackingId === createdTrackingId, 'Returned tracking ID matches original');

    // Test 14: Database order count for customer remains 1 (no duplicate order created)
    const custOrdersCount = await prisma.order.count({
      where: { customerProfileId: userA.customerProfile.id },
    });
    assert(custOrdersCount === 1, 'Customer order count remains strictly 1');

    // ----------------------------------------------------
    // 6. CUSTOMER ORDERS RETRIEVAL
    // ----------------------------------------------------
    console.log('\n--- 6. Orders Retrieval Endpoints ---');

    // Test 15: GET /api/v1/orders/my-orders returns customer orders list
    const myOrdersRes = await fetch(`${baseUrl}/api/v1/orders/my-orders`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const myOrdersData = await myOrdersRes.json();
    assert(myOrdersRes.status === 200, 'GET /orders/my-orders returns 200');
    assert(Array.isArray(myOrdersData.data) && myOrdersData.data.length === 1, 'Returns array with 1 order');
    assert(myOrdersData.data[0].id === createdOrderId, 'List item id matches created order');

    // Test 16: GET /api/v1/orders/my-orders/:id retrieves by UUID
    const getByIdRes = await fetch(`${baseUrl}/api/v1/orders/my-orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getByIdData = await getByIdRes.json();
    assert(getByIdRes.status === 200, 'GET /orders/my-orders/:id returns 200');
    assert(getByIdData.data.id === createdOrderId, 'Order details match by UUID');
    assert(Array.isArray(getByIdData.data.events) && getByIdData.data.events.length > 0, 'Includes events timeline');

    // Test 17: GET /api/v1/orders/my-orders/:trackingId retrieves by trackingId
    const getByTrackingRes = await fetch(`${baseUrl}/api/v1/orders/my-orders/${createdTrackingId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getByTrackingData = await getByTrackingRes.json();
    assert(getByTrackingRes.status === 200, 'GET /orders/my-orders/:trackingId returns 200');
    assert(getByTrackingData.data.trackingId === createdTrackingId, 'Order details match by trackingId');

    // ----------------------------------------------------
    // 7. STRICT MULTI-TENANT ISOLATION
    // ----------------------------------------------------
    console.log('\n--- 7. Strict Multi-Tenant Isolation ---');

    // Test 18: Customer B receives 404 when attempting to query Customer A's order
    const hackViewRes = await fetch(`${baseUrl}/api/v1/orders/my-orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(hackViewRes.status === 404, 'Customer B cannot access Customer A order (rejected with 404)');

    // Test 19: Customer B receives 400/404 when attempting to cancel Customer A's order
    const hackCancelRes = await fetch(`${baseUrl}/api/v1/orders/${createdOrderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ reason: 'Malicious cancel' }),
    });
    assert(
      hackCancelRes.status === 400 || hackCancelRes.status === 404,
      'Customer B cannot cancel Customer A order (rejected)'
    );

    // ----------------------------------------------------
    // 8. ORDER CANCELLATION FLOW
    // ----------------------------------------------------
    console.log('\n--- 8. Order Cancellation Flow ---');

    // Test 20: Customer A cancels their own active order
    const cancelRes = await fetch(`${baseUrl}/api/v1/orders/${createdOrderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ reason: 'Ordered wrong items' }),
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200, 'POST /orders/:id/cancel returns 200');
    assert(cancelData.data.status === 'CANCELLED', 'Order status is now CANCELLED');

    // Test 21: Database reflects CANCELLED status and records CANCELLED event
    const cancelledOrderDb = await prisma.order.findUnique({
      where: { id: createdOrderId },
      include: { events: { orderBy: { createdAt: 'desc' } } },
    });
    assert(cancelledOrderDb?.status === 'CANCELLED', 'Database order status is CANCELLED');
    assert(cancelledOrderDb?.events[0].newStatus === 'CANCELLED', 'Latest OrderEvent newStatus is CANCELLED');
    assert(cancelledOrderDb?.events[0].description === 'Ordered wrong items', 'OrderEvent description matches reason');

    // Test 22: In-app cancellation notification created
    const cancelNotif = await prisma.notification.findFirst({
      where: { userId: userA.id, title: 'Order Cancelled' },
    });
    assert(cancelNotif !== null, 'Cancellation notification saved to database');

    // Test 23: Cannot cancel already cancelled order
    const doubleCancelRes = await fetch(`${baseUrl}/api/v1/orders/${createdOrderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ reason: 'Cancel again' }),
    });
    assert(doubleCancelRes.status === 400, 'Attempting to cancel already CANCELLED order rejected with 400');

    // ----------------------------------------------------
    // 9. RIDER AVAILABLE ORDERS FEED
    // ----------------------------------------------------
    console.log('\n--- 9. Rider Available Orders Feed ---');

    // Test 24: Customer B creates an active order
    const orderBRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        idempotencyKey: `ord_b_${timestamp}`,
        pickupAddress: 'Apollo Pharmacy, Jubilee Hills',
        pickupLat: 17.4319,
        pickupLng: 78.4073,
        dropAddress: 'Madhapur Metro Station',
        dropLat: 17.4483,
        dropLng: 78.3915,
        serviceType: 'MEDICINE',
      }),
    });
    const orderBData = await orderBRes.json();
    assert(orderBRes.status === 201, 'Customer B order created with 201');

    // Test 25: Rider queries available orders
    const availRes = await fetch(`${baseUrl}/api/v1/orders/available`, {
      headers: { Authorization: `Bearer ${riderToken}` },
    });
    const availData = await availRes.json();
    assert(availRes.status === 200, 'GET /orders/available returns 200 for RIDER');
    assert(Array.isArray(availData.data), 'Available orders is an array');
    assert(
      availData.data.some((o: any) => o.id === orderBData.data.id),
      'Customer B active order is visible in rider available feed'
    );
    assert(
      !availData.data.some((o: any) => o.id === createdOrderId),
      'Customer A cancelled order is NOT present in rider available feed'
    );

  } finally {
    // ----------------------------------------------------
    // CLEANUP: Clean test data
    // ----------------------------------------------------
    console.log('\n--- Cleanup ---');
    try {
      if (userA?.id) {
        await prisma.notification.deleteMany({ where: { userId: userA.id } });
        await prisma.payment.deleteMany({ where: { order: { customer: { userId: userA.id } } } });
        await prisma.orderEvent.deleteMany({ where: { order: { customer: { userId: userA.id } } } });
        await prisma.order.deleteMany({ where: { customer: { userId: userA.id } } });
        await prisma.address.deleteMany({ where: { customer: { userId: userA.id } } });
        await prisma.customerProfile.deleteMany({ where: { userId: userA.id } });
        await prisma.user.delete({ where: { id: userA.id } });
      }
      if (userB?.id) {
        await prisma.notification.deleteMany({ where: { userId: userB.id } });
        await prisma.payment.deleteMany({ where: { order: { customer: { userId: userB.id } } } });
        await prisma.orderEvent.deleteMany({ where: { order: { customer: { userId: userB.id } } } });
        await prisma.order.deleteMany({ where: { customer: { userId: userB.id } } });
        await prisma.address.deleteMany({ where: { customer: { userId: userB.id } } });
        await prisma.customerProfile.deleteMany({ where: { userId: userB.id } });
        await prisma.user.delete({ where: { id: userB.id } });
      }
      if (riderUser?.id) {
        await prisma.riderProfile.deleteMany({ where: { userId: riderUser.id } });
        await prisma.user.delete({ where: { id: riderUser.id } });
      }
    } catch (cleanErr) {
      console.warn('Cleanup warning:', cleanErr);
    }

    server.close();
    await prisma.$disconnect();
  }

  console.log('\n==================================================');
  console.log(`🎉 ALL ${passedCount}/${totalCount} ORDERS INTEGRATION TESTS PASSED!`);
  console.log('==================================================\n');
}

runOrdersIntegrationTests().catch((err) => {
  console.error('\n❌ ORDERS INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
