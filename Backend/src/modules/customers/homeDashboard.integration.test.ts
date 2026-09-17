import express from 'express';
import http from 'http';
import customerRoutes from './customers.routes';
import notificationRoutes from '../notifications/notifications.routes';
import prisma from '../../utils/prisma';
import { generateAccessToken } from '../../utils/jwt';

async function runHomeDashboardIntegrationTests() {
  console.log('\n==================================================');
  console.log('🧪 DPARCELS PHASE 5: HOME DASHBOARD & NOTIFICATIONS SUITE');
  console.log('==================================================\n');

  const app = express();
  app.use(express.json());
  app.use('/api/v1/customers', customerRoutes);
  app.use('/api/v1/notifications', notificationRoutes);

  // Global test error handler
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal error in test app',
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
  const emailA = `dash_cust_a_${timestamp}@example.com`;
  const emailB = `dash_cust_b_${timestamp}@example.com`;
  const riderEmail = `dash_rider_${timestamp}@example.com`;

  let userA: any = null;
  let userB: any = null;
  let riderUser: any = null;

  let tokenA: string = '';
  let tokenB: string = '';

  let orderAId: string = '';
  let orderBId: string = '';
  let notif1Id: string = '';
  let notif2Id: string = '';

  try {
    // ----------------------------------------------------
    // PRE-CLEANUP: Clean any lingering test records
    // ----------------------------------------------------
    try {
      await prisma.notification.deleteMany({ where: { user: { email: { startsWith: 'dash_' } } } });
      await prisma.order.deleteMany({ where: { trackingId: { startsWith: 'TRK-DASH-' } } });
      await prisma.address.deleteMany({ where: { customer: { user: { email: { startsWith: 'dash_' } } } } });
      await prisma.customerProfile.deleteMany({ where: { user: { email: { startsWith: 'dash_' } } } });
      await prisma.riderProfile.deleteMany({ where: { user: { email: { startsWith: 'dash_' } } } });
      await prisma.user.deleteMany({ where: { email: { startsWith: 'dash_' } } });
    } catch {
      // ignore
    }

    // ----------------------------------------------------
    // SETUP: Users, Profiles & Rider in PostgreSQL
    // ----------------------------------------------------
    userA = await prisma.user.create({
      data: {
        email: emailA,
        password: 'HashedPassword123!',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            firstName: 'Kavya',
            lastName: 'Maron',
            phone: '9888111222',
            preferredLanguage: 'en',
            theme: 'dark',
          },
        },
      },
      include: { customerProfile: true },
    });

    userB = await prisma.user.create({
      data: {
        email: emailB,
        password: 'HashedPassword456!',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            firstName: 'Rohit',
            lastName: 'Sharma',
            phone: '9777333444',
            preferredLanguage: 'hi',
            theme: 'light',
          },
        },
      },
      include: { customerProfile: true },
    });

    riderUser = await prisma.user.create({
      data: {
        email: riderEmail,
        password: 'RiderPassword123!',
        role: 'RIDER',
        status: 'ACTIVE',
        riderProfile: {
          create: {
            firstName: 'Vikram',
            lastName: 'Singh',
            phone: '9666555444',
            vehicleType: 'Motorcycle',
            vehicleNumber: 'TS 09 XY 8899',
            isOnline: true,
            isApproved: true,
            rating: 4.9,
          },
        },
      },
      include: { riderProfile: true },
    });

    tokenA = generateAccessToken({ userId: userA.id, role: userA.role });
    tokenB = generateAccessToken({ userId: userB.id, role: userB.role });

    console.log('--- 1. Authentication & Security Controls ---');

    // Test 1: Unauthenticated request to /customers/home-dashboard rejected with 401
    const unauthRes = await fetch(`${baseUrl}/api/v1/customers/home-dashboard`);
    assert(unauthRes.status === 401, 'GET /customers/home-dashboard without token rejected with 401');

    // Test 2: Invalid JWT rejected with 401
    const invalidJwtRes = await fetch(`${baseUrl}/api/v1/customers/home-dashboard`, {
      headers: { Authorization: 'Bearer invalid.token.signature' },
    });
    assert(invalidJwtRes.status === 401, 'GET /customers/home-dashboard with invalid token rejected with 401');

    console.log('\n--- 2. Initial Home Dashboard Aggregation ---');

    // Test 3: Authenticated Customer A fetches home dashboard
    const initialRes = await fetch(`${baseUrl}/api/v1/customers/home-dashboard`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const initialData = await initialRes.json();
    assert(initialRes.status === 200, 'GET /customers/home-dashboard returns 200');
    assert(initialData.success === true, 'Response success is true');

    // Test 4: Customer greeting & profile fields
    assert(initialData.data.customer.firstName === 'Kavya', 'customer.firstName matches');
    assert(initialData.data.customer.lastName === 'Maron', 'customer.lastName matches');
    assert(initialData.data.customer.email === emailA, 'customer.email matches');
    assert(initialData.data.customer.rating === 5.0, 'customer.rating is initialized');

    // Test 5: Initial order & address stats
    assert(initialData.data.activeOrder === null, 'activeOrder is null when no orders exist');
    assert(initialData.data.defaultAddress === null, 'defaultAddress is null when no addresses saved');
    assert(initialData.data.stats.totalOrders === 0, 'stats.totalOrders is 0');
    assert(initialData.data.stats.activeOrdersCount === 0, 'stats.activeOrdersCount is 0');
    assert(initialData.data.stats.unreadNotificationsCount === 0, 'stats.unreadNotificationsCount is 0');

    // Test 6: Banners & coupons feeds
    assert(Array.isArray(initialData.data.banners), 'banners is an array');
    assert(Array.isArray(initialData.data.coupons) && initialData.data.coupons.length > 0, 'coupons has promotional offers');
    assert(Boolean(initialData.data.coupons[0].code), 'coupon has promotional code');

    console.log('\n--- 3. Default Address Dashboard Integration ---');

    // Setup: Create default address for Customer A
    await prisma.address.create({
      data: {
        customerProfileId: userA.customerProfile.id,
        label: 'Home',
        streetAddress: 'Apartment 5B, Road No 10, Banjara Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500034',
        country: 'India',
        latitude: 17.4156,
        longitude: 78.4357,
        isDefault: true,
      },
    });

    // Test 7: Dashboard returns defaultAddress
    const withAddrRes = await fetch(`${baseUrl}/api/v1/customers/home-dashboard`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const withAddrData = await withAddrRes.json();
    assert(withAddrData.data.defaultAddress !== null, 'defaultAddress is populated');
    assert(withAddrData.data.defaultAddress.label === 'Home', 'defaultAddress.label matches Home');
    assert(withAddrData.data.defaultAddress.isDefault === true, 'defaultAddress.isDefault is true');
    assert(withAddrData.data.defaultAddress.city === 'Hyderabad', 'defaultAddress.city matches');

    console.log('\n--- 4. Active Live Order Tracker Integration ---');

    // Setup: Create active order for Customer A
    const orderA = await prisma.order.create({
      data: {
        trackingId: `TRK-DASH-A-${timestamp}`,
        customerProfileId: userA.customerProfile.id,
        riderProfileId: riderUser.riderProfile.id,
        pickupAddress: 'Bawarchi Restaurant, RTC X Roads',
        pickupLat: 17.4042,
        pickupLng: 78.4983,
        dropAddress: 'Apartment 5B, Road No 10, Banjara Hills',
        dropLat: 17.4156,
        dropLng: 78.4357,
        distanceKm: 6.4,
        estimatedTimeMins: 22,
        serviceType: 'food',
        status: 'RIDER_ASSIGNED',
        basePrice: 50,
        distancePrice: 64,
        totalAmount: 114,
      },
      include: { rider: true },
    });
    orderAId = orderA.id;

    // Test 8: Dashboard now returns activeOrder with rider details
    const withOrderRes = await fetch(`${baseUrl}/api/v1/customers/home-dashboard`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const withOrderData = await withOrderRes.json();
    assert(withOrderRes.status === 200, `GET dashboard with order returns 200 (received ${withOrderRes.status}: ${withOrderData.message || ''})`);
    assert(Boolean(withOrderData.data?.activeOrder), 'activeOrder is populated');
    assert(withOrderData.data.activeOrder.trackingId === orderA.trackingId, 'trackingId matches');
    assert(withOrderData.data.activeOrder.status === 'RIDER_ASSIGNED', 'activeOrder.status is RIDER_ASSIGNED');
    assert(withOrderData.data.activeOrder.serviceType === 'food', 'serviceType matches food');
    assert(withOrderData.data.activeOrder.rider !== null, 'activeOrder.rider is populated');
    assert(withOrderData.data.activeOrder.rider.firstName === 'Vikram', 'rider.firstName matches');
    assert(withOrderData.data.activeOrder.rider.vehicleNumber === 'TS 09 XY 8899', 'rider.vehicleNumber matches');
    assert(withOrderData.data.stats.activeOrdersCount === 1, 'stats.activeOrdersCount is 1');
    assert(withOrderData.data.stats.totalOrders === 1, 'stats.totalOrders is 1');

    console.log('\n--- 5. Strict Multi-Tenant Isolation ---');

    // Setup: Customer B creates an order
    const orderB = await prisma.order.create({
      data: {
        trackingId: `TRK-DASH-B-${timestamp}`,
        customerProfileId: userB.customerProfile.id,
        pickupAddress: 'Apollo Pharmacy, Jubilee Hills',
        pickupLat: 17.4319,
        pickupLng: 78.4073,
        dropAddress: 'Madhapur Metro Station',
        dropLat: 17.4483,
        dropLng: 78.3915,
        distanceKm: 4.1,
        estimatedTimeMins: 15,
        serviceType: 'medicine',
        status: 'OUT_FOR_DELIVERY',
        basePrice: 60,
        distancePrice: 41,
        totalAmount: 101,
      },
    });
    orderBId = orderB.id;

    // Test 9: Customer A dashboard does NOT see Customer B order
    const checkCustARes = await fetch(`${baseUrl}/api/v1/customers/home-dashboard`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkCustAData = await checkCustARes.json();
    assert(checkCustARes.status === 200, 'Customer A dashboard request returns 200');
    assert(checkCustAData.data.activeOrder.trackingId === orderA.trackingId, 'Customer A only sees own active order');
    assert(checkCustAData.data.stats.totalOrders === 1, 'Customer A total orders count remains 1');

    // Test 10: Customer B dashboard sees Customer B order
    const checkCustBRes = await fetch(`${baseUrl}/api/v1/customers/home-dashboard`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const checkCustBData = await checkCustBRes.json();
    assert(checkCustBRes.status === 200, 'Customer B dashboard request returns 200');
    assert(checkCustBData.data.activeOrder.trackingId === orderB.trackingId, 'Customer B sees own active order');
    assert(checkCustBData.data.activeOrder.status === 'OUT_FOR_DELIVERY', 'Customer B status matches');

    console.log('\n--- 6. Notifications Center & Badge Actions ---');

    // Setup: Create 2 unread notifications for Customer A in PostgreSQL
    const notif1 = await prisma.notification.create({
      data: {
        userId: userA.id,
        title: 'Delivery Partner Assigned',
        body: 'Vikram is on the way to Bawarchi Restaurant.',
        type: 'ORDER',
        isRead: false,
      },
    });
    notif1Id = notif1.id;

    const notif2 = await prisma.notification.create({
      data: {
        userId: userA.id,
        title: 'Special Weekend Offer',
        body: 'Enjoy flat ₹50 OFF on all grocery deliveries today.',
        type: 'PROMO',
        isRead: false,
      },
    });
    notif2Id = notif2.id;

    // Test 11: Home Dashboard reflects 2 unread notifications
    const unreadDashRes = await fetch(`${baseUrl}/api/v1/customers/home-dashboard`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const unreadDashData = await unreadDashRes.json();
    assert(unreadDashRes.status === 200, 'GET dashboard for unread count returns 200');
    assert(unreadDashData.data.stats.unreadNotificationsCount === 2, 'Dashboard reports unreadNotificationsCount: 2');

    // Test 12: GET /api/v1/notifications returns customer notifications
    const getNotifsRes = await fetch(`${baseUrl}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getNotifsData = await getNotifsRes.json();
    assert(getNotifsRes.status === 200, 'GET /notifications returns 200');
    assert(Array.isArray(getNotifsData.data) && getNotifsData.data.length === 2, 'Returns 2 notifications');

    // Test 13: PATCH /api/v1/notifications/:id/read marks notification 1 as read
    const markOneRes = await fetch(`${baseUrl}/api/v1/notifications/${notif1Id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const markOneData = await markOneRes.json();
    assert(markOneRes.status === 200, 'PATCH /notifications/:id/read returns 200');
    assert(markOneData.data.isRead === true, 'Notification 1 isRead is true');

    // Test 14: Home dashboard unread count updates to 1
    const unread1Res = await fetch(`${baseUrl}/api/v1/customers/home-dashboard`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const unread1Data = await unread1Res.json();
    assert(unread1Res.status === 200, 'GET dashboard after 1 read returns 200');
    assert(unread1Data.data.stats.unreadNotificationsCount === 1, 'Dashboard unread count reduced to 1');

    // Test 15: PATCH /api/v1/notifications/read-all marks all notifications as read
    const markAllRes = await fetch(`${baseUrl}/api/v1/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(markAllRes.status === 200, 'PATCH /notifications/read-all returns 200');

    // Test 16: Home dashboard unread count becomes 0
    const unread0Res = await fetch(`${baseUrl}/api/v1/customers/home-dashboard`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const unread0Data = await unread0Res.json();
    assert(unread0Res.status === 200, 'GET dashboard after read-all returns 200');
    assert(unread0Data.data.stats.unreadNotificationsCount === 0, 'Dashboard unread count is 0');

    // Test 17: Multi-tenant notification isolation (Customer A cannot mark Customer B notification as read)
    const notifB = await prisma.notification.create({
      data: {
        userId: userB.id,
        title: 'Private Alert for Customer B',
        body: 'Secret body',
        isRead: false,
        type: 'SYSTEM',
      },
    });

    const hackNotifRes = await fetch(`${baseUrl}/api/v1/notifications/${notifB.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(hackNotifRes.status === 400, 'Customer A cannot mark Customer B notification as read (rejected)');

    await prisma.notification.delete({ where: { id: notifB.id } });

  } finally {
    // ----------------------------------------------------
    // CLEANUP: Clean up test orders, notifications, and users
    // ----------------------------------------------------
    console.log('\n--- Cleanup ---');
    try {
      if (orderAId) {
        await prisma.order.deleteMany({ where: { id: orderAId } });
      }
      if (orderBId) {
        await prisma.order.deleteMany({ where: { id: orderBId } });
      }
      if (userA?.id) {
        await prisma.notification.deleteMany({ where: { userId: userA.id } });
        await prisma.address.deleteMany({ where: { customer: { userId: userA.id } } });
        await prisma.customerProfile.deleteMany({ where: { userId: userA.id } });
        await prisma.user.delete({ where: { id: userA.id } });
      }
      if (userB?.id) {
        await prisma.notification.deleteMany({ where: { userId: userB.id } });
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
  console.log(`🎉 ALL ${passedCount}/${totalCount} HOME DASHBOARD TESTS PASSED!`);
  console.log('==================================================\n');
  process.exit(0);
}

runHomeDashboardIntegrationTests().catch((err) => {
  console.error('\n❌ INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
