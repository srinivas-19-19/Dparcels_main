import express from 'express';
import http from 'http';
import orderRoutes from './orders.routes';
import prisma from '../../utils/prisma';
import { generateAccessToken } from '../../utils/jwt';

async function runOrderDetailsIntegrationTests() {
  console.log('\n==================================================');
  console.log('🧪 DPARCELS PHASE 9: ORDER DETAILS & REVIEW SUITE');
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
  const customerEmail = `p9_cust_${timestamp}@example.com`;
  const riderEmail    = `p9_rider_${timestamp}@example.com`;
  const otherEmail    = `p9_other_${timestamp}@example.com`;

  let customerUser: any = null;
  let riderUser: any    = null;
  let otherUser: any    = null;

  let customerToken: string = '';
  let riderToken: string    = '';
  let otherToken: string    = '';

  let orderId: string       = '';
  let trackingId: string    = '';

  try {
    // ──────────────────────────────────────────────────
    // SETUP: Create users and a fully-delivered order
    // ──────────────────────────────────────────────────
    console.log('\n📦 [SETUP] Creating test users\n');

    // Customer
    customerUser = await prisma.user.create({
      data: {
        email: customerEmail,
        password: 'hashed_pw',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: { firstName: 'P9Cust', lastName: 'Test', phone: '9000000009' },
        },
      },
      include: { customerProfile: true },
    });
    customerToken = generateAccessToken({ userId: customerUser.id, role: 'CUSTOMER' });

    // Rider
    riderUser = await prisma.user.create({
      data: {
        email: riderEmail,
        password: 'hashed_pw',
        role: 'RIDER',
        status: 'ACTIVE',
        riderProfile: {
          create: {
            firstName: 'P9Rider', lastName: 'Test', phone: '9000000010',
            vehicleType: 'Bike', vehicleNumber: 'TS09P9',
            isApproved: true, isOnline: true,
          },
        },
      },
      include: { riderProfile: true },
    });
    riderToken = generateAccessToken({ userId: riderUser.id, role: 'RIDER' });

    // Other customer (cross-tenant test)
    otherUser = await prisma.user.create({
      data: {
        email: otherEmail,
        password: 'hashed_pw',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: { firstName: 'OtherCust', lastName: 'Test', phone: '9000000011' },
        },
      },
      include: { customerProfile: true },
    });
    otherToken = generateAccessToken({ userId: otherUser.id, role: 'CUSTOMER' });

    // Create a delivered order directly in DB (bypass distance API)
    const order = await prisma.order.create({
      data: {
        trackingId: `DPARC-P9${timestamp % 100000}`,
        customerProfileId: customerUser.customerProfile!.id,
        riderProfileId: riderUser.riderProfile!.id,
        pickupAddress: '123 Baker Street, Hyderabad',
        pickupLat: 17.44,
        pickupLng: 78.34,
        dropAddress: '456 Main Road, Hyderabad',
        dropLat: 17.45,
        dropLng: 78.36,
        distanceKm: 2.5,
        estimatedTimeMins: 15,
        serviceType: 'FOOD',
        packageCategory: 'Food',
        storeName: 'Test Biryani House',
        items: ['Chicken Biryani', 'Raita'],
        instructions: 'Ring the bell',
        status: 'DELIVERED',
        basePrice: 39,
        distancePrice: 0,
        totalAmount: 39,
      },
    });
    orderId = order.id;
    trackingId = order.trackingId!;

    // Create some order events
    await prisma.orderEvent.createMany({
      data: [
        { orderId, newStatus: 'ASSIGNING', actorId: customerUser.id, actorRole: 'CUSTOMER', description: 'Order placed' },
        { orderId, newStatus: 'ACCEPTED',  actorId: riderUser.id,    actorRole: 'RIDER',    description: 'Rider accepted' },
        { orderId, newStatus: 'DELIVERED', actorId: riderUser.id,    actorRole: 'RIDER',    description: 'Package delivered' },
      ],
    });

    // Create payment record
    await prisma.payment.create({
      data: { orderId, amount: 39, currency: 'INR', status: 'PAID', paymentMethod: 'CASH' },
    });

    // ──────────────────────────────────────────────────
    // TESTS
    // ──────────────────────────────────────────────────

    // ── GET /my-orders ─────────────────────────────────
    console.log('\n📋 [1] GET /my-orders — List all orders\n');
    {
      const res = await fetch(`${baseUrl}/api/v1/orders/my-orders`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const body = await res.json();
      assert(res.status === 200, 'GET /my-orders returns 200');
      assert(Array.isArray(body.data), 'Response data is an array');
      assert(body.data.length >= 1, 'At least 1 order returned');
      const found = body.data.find((o: any) => o.id === orderId);
      assert(!!found, 'Created order is in the list');
      assert(found.status === 'DELIVERED', 'Order status is DELIVERED');
    }

    // ── GET /my-orders/:id — By UUID ──────────────────
    console.log('\n🔍 [2] GET /my-orders/:id — Order details by UUID\n');
    {
      const res = await fetch(`${baseUrl}/api/v1/orders/my-orders/${orderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const body = await res.json();
      assert(res.status === 200, 'GET /my-orders/:id returns 200');
      assert(body.data?.id === orderId, 'Correct order returned by UUID');
      assert(body.data?.trackingId === trackingId, 'Tracking ID present');
      assert(body.data?.status === 'DELIVERED', 'Status is DELIVERED');
      assert(Array.isArray(body.data?.events), 'Events array included');
      assert(body.data?.events.length === 3, 'All 3 events returned');
      assert(body.data?.payment?.status === 'PAID', 'Payment status is PAID');
      assert(body.data?.rider?.firstName === 'P9Rider', 'Rider info included');
      assert(body.data?.rider?.paymentQrUrl !== undefined, 'Rider paymentQrUrl field present');
      assert(body.data?.storeName === 'Test Biryani House', 'Store name returned');
      assert(Array.isArray(body.data?.items), 'Items array returned');
    }

    // ── GET /my-orders/:id — By trackingId ────────────
    console.log('\n🔍 [3] GET /my-orders/:id — Order details by trackingId\n');
    {
      const res = await fetch(`${baseUrl}/api/v1/orders/my-orders/${trackingId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const body = await res.json();
      assert(res.status === 200, 'GET /my-orders/:trackingId returns 200');
      assert(body.data?.id === orderId, 'Correct order returned by trackingId');
    }

    // ── Cross-tenant isolation ─────────────────────────
    console.log('\n🔒 [4] Cross-tenant isolation\n');
    {
      const res = await fetch(`${baseUrl}/api/v1/orders/my-orders/${orderId}`, {
        headers: { Authorization: `Bearer ${otherToken}` },
      });
      const body = await res.json();
      assert(res.status === 404 || res.status === 403 || !body.success, 'Other customer cannot access order');
    }

    // ── Unauthenticated access ─────────────────────────
    console.log('\n🔐 [5] Unauthenticated access denied\n');
    {
      const res = await fetch(`${baseUrl}/api/v1/orders/my-orders/${orderId}`);
      assert(res.status === 401, 'No token returns 401');
    }

    // ── POST /rate — Submit review ────────────────────
    console.log('\n⭐ [6] POST /:id/rate — Submit review for delivered order\n');
    {
      const res = await fetch(`${baseUrl}/api/v1/orders/${orderId}/rate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 5, feedback: 'Excellent service! Very fast delivery.' }),
      });
      const body = await res.json();
      assert(res.status === 201, 'Review submission returns 201');
      assert(body.success === true, 'Review response success=true');
      assert(body.data?.rating === 5, 'Rating value is 5');
      assert(body.data?.orderId === orderId, 'Review linked to correct order');
      assert(body.data?.feedback === 'Excellent service! Very fast delivery.', 'Feedback stored');
    }

    // ── POST /rate — Verify persisted in DB ───────────
    console.log('\n📊 [7] Verify review is persisted in database\n');
    {
      const review = await prisma.review.findUnique({ where: { orderId } });
      assert(review !== null, 'Review persisted in Review table');
      assert(review!.rating === 5, 'Correct rating persisted');
      assert(review!.feedback === 'Excellent service! Very fast delivery.', 'Feedback persisted');
      assert(review!.customerId === customerUser.customerProfile!.id, 'Correct customerId stored');
      assert(review!.riderId === riderUser.riderProfile!.id, 'Correct riderId stored');
    }

    // ── Verify rider rating updated ────────────────────
    console.log('\n🏆 [8] Verify rider average rating updated\n');
    {
      const updatedRider = await prisma.riderProfile.findUnique({ where: { id: riderUser.riderProfile!.id } });
      assert(updatedRider !== null, 'Rider profile retrieved');
      assert(updatedRider!.rating === 5.0, `Rider rating updated to 5.0 (got ${updatedRider!.rating})`);
    }

    // ── Double review prevention ───────────────────────
    console.log('\n🚫 [9] Prevent duplicate review submission\n');
    {
      const res = await fetch(`${baseUrl}/api/v1/orders/${orderId}/rate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 3 }),
      });
      const body = await res.json();
      assert(res.status === 400, 'Duplicate review returns 400');
      assert(body.success === false, 'Duplicate review returns success=false');
      assert(
        body.message?.toLowerCase().includes('already') || body.message?.toLowerCase().includes('reviewed'),
        `Error message mentions already reviewed: "${body.message}"`
      );
    }

    // ── Invalid rating validation ──────────────────────
    console.log('\n❌ [10] Invalid rating values rejected\n');
    {
      // Create a second delivered order for validation tests (no review yet)
      const order2 = await prisma.order.create({
        data: {
          trackingId: `DPARC-P9V${timestamp % 100000}`,
          customerProfileId: customerUser.customerProfile!.id,
          riderProfileId: riderUser.riderProfile!.id,
          pickupAddress: 'Test St', pickupLat: 17.4, pickupLng: 78.3,
          dropAddress: 'Drop St', dropLat: 17.5, dropLng: 78.4,
          distanceKm: 3, estimatedTimeMins: 20, serviceType: 'STANDARD',
          status: 'DELIVERED', basePrice: 39, distancePrice: 0, totalAmount: 39,
        },
      });

      const res0 = await fetch(`${baseUrl}/api/v1/orders/${order2.id}/rate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 0 }),
      });
      assert(res0.status === 400, 'Rating 0 rejected with 400');

      const res6 = await fetch(`${baseUrl}/api/v1/orders/${order2.id}/rate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 6 }),
      });
      assert(res6.status === 400, 'Rating 6 rejected with 400');

      await prisma.order.delete({ where: { id: order2.id } });
    }

    // ── Rate non-delivered order ───────────────────────
    console.log('\n🚫 [11] Cannot rate non-delivered order\n');
    {
      const pendingOrder = await prisma.order.create({
        data: {
          trackingId: `DPARC-P9P${timestamp % 100000}`,
          customerProfileId: customerUser.customerProfile!.id,
          pickupAddress: 'Test', pickupLat: 17.4, pickupLng: 78.3,
          dropAddress: 'Drop', dropLat: 17.5, dropLng: 78.4,
          distanceKm: 2, estimatedTimeMins: 10, serviceType: 'STANDARD',
          status: 'ASSIGNING', basePrice: 39, distancePrice: 0, totalAmount: 39,
        },
      });

      const res = await fetch(`${baseUrl}/api/v1/orders/${pendingOrder.id}/rate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 4 }),
      });
      const body = await res.json();
      assert(res.status === 400, 'Cannot rate non-delivered order');
      assert(body.message?.toLowerCase().includes('delivered'), `Error mentions delivered: "${body.message}"`);

      await prisma.order.delete({ where: { id: pendingOrder.id } });
    }

    // ── Review without feedback (optional field) ───────
    console.log('\n⭐ [12] Rating without feedback (feedback is optional)\n');
    {
      const order3 = await prisma.order.create({
        data: {
          trackingId: `DPARC-P9F${timestamp % 100000}`,
          customerProfileId: customerUser.customerProfile!.id,
          riderProfileId: riderUser.riderProfile!.id,
          pickupAddress: 'Test', pickupLat: 17.4, pickupLng: 78.3,
          dropAddress: 'Drop', dropLat: 17.5, dropLng: 78.4,
          distanceKm: 2, estimatedTimeMins: 10, serviceType: 'STANDARD',
          status: 'DELIVERED', basePrice: 39, distancePrice: 0, totalAmount: 39,
        },
      });

      const res = await fetch(`${baseUrl}/api/v1/orders/${order3.id}/rate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 4 }),
      });
      const body = await res.json();
      assert(res.status === 201, 'Rating without feedback returns 201');
      assert(body.data?.feedback === null, 'Feedback is null when not provided');

      // Clean up this review before cleanup
      await prisma.review.delete({ where: { orderId: order3.id } });
      await prisma.order.delete({ where: { id: order3.id } });
    }

    // ── Orders list returns events and rider ───────────
    console.log('\n📋 [13] GET /my-orders — Verify rider & payment in list\n');
    {
      const res = await fetch(`${baseUrl}/api/v1/orders/my-orders`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const body = await res.json();
      const found = body.data?.find((o: any) => o.id === orderId);
      assert(!!found, 'Delivered order found in list');
      assert(found.rider?.firstName === 'P9Rider', 'Rider name in list response');
      assert(found.payment?.status === 'PAID', 'Payment status in list response');
    }

    // ── Rider cannot access customer endpoint ──────────
    console.log('\n🔒 [14] Rider cannot access /my-orders\n');
    {
      const res = await fetch(`${baseUrl}/api/v1/orders/my-orders`, {
        headers: { Authorization: `Bearer ${riderToken}` },
      });
      assert(res.status === 403, 'Rider gets 403 on customer endpoint');
    }

    // ──────────────────────────────────────────────────
    // SUMMARY
    // ──────────────────────────────────────────────────
    console.log(`\n${'='.repeat(50)}`);
    console.log(`\n✅ ${passedCount} / ${totalCount} tests passed\n`);
    if (passedCount < totalCount) {
      throw new Error(`${totalCount - passedCount} test(s) failed`);
    }

  } catch (err: any) {
    console.error('\n💥 Test suite failed:', err.message);
    process.exit(1);
  } finally {
    // ── Teardown ──
    console.log('\n🧹 [TEARDOWN] Cleaning up test data…\n');
    try {
      // Delete reviews first
      await prisma.review.deleteMany({ where: { customerId: customerUser?.customerProfile?.id } });
      // Delete payments
      await prisma.payment.deleteMany({ where: { orderId: { in: [orderId].filter(Boolean) } } });
      // Delete order events
      await prisma.orderEvent.deleteMany({ where: { orderId } });
      // Delete orders
      await prisma.order.deleteMany({
        where: { customerProfileId: customerUser?.customerProfile?.id },
      });
      // Delete users
      if (customerUser) await prisma.user.delete({ where: { id: customerUser.id } });
      if (riderUser)    await prisma.user.delete({ where: { id: riderUser.id } });
      if (otherUser)    await prisma.user.delete({ where: { id: otherUser.id } });
    } catch (cleanupErr: any) {
      console.warn('[TEARDOWN] Cleanup warning:', cleanupErr.message);
    }

    server.close();
    await prisma.$disconnect();
    console.log('✅ Teardown complete.\n');
  }
}

runOrderDetailsIntegrationTests();
