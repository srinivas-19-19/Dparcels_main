import express from 'express';
import http from 'http';
import addressRoutes from './addresses.routes';
import mapRoutes from '../maps/maps.routes';
import prisma from '../../utils/prisma';
import { generateAccessToken } from '../../utils/jwt';

async function runAddressAndMapsIntegrationTests() {
  console.log('\n==================================================');
  console.log('🧪 DPARCELS PHASE 4: SAVED ADDRESSES + MAPS SUITE');
  console.log('==================================================\n');

  const app = express();
  app.use(express.json());
  app.use('/api/v1/addresses', addressRoutes);
  app.use('/api/v1/maps', mapRoutes);

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
  const testCustomerEmailA = `phase4_customer_a_${timestamp}@example.com`;
  const testCustomerEmailB = `phase4_customer_b_${timestamp}@example.com`;
  let userA: any = null;
  let userB: any = null;
  let tokenA: string = '';
  let tokenB: string = '';

  let addressA1Id: string = '';
  let addressA2Id: string = '';
  let addressB1Id: string = '';

  try {
    // ----------------------------------------------------
    // SETUP: Create two test customers in PostgreSQL
    // ----------------------------------------------------
    userA = await prisma.user.create({
      data: {
        email: testCustomerEmailA,
        password: 'HashedPassword123!',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            firstName: 'Arjun',
            lastName: 'Reddy',
            phone: '9988776655',
          },
        },
      },
      include: { customerProfile: true },
    });

    userB = await prisma.user.create({
      data: {
        email: testCustomerEmailB,
        password: 'HashedPassword456!',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            firstName: 'Pooja',
            lastName: 'Hegde',
            phone: '9988776644',
          },
        },
      },
      include: { customerProfile: true },
    });

    tokenA = generateAccessToken({ userId: userA.id, role: userA.role });
    tokenB = generateAccessToken({ userId: userB.id, role: userB.role });

    console.log('--- 1. Authentication & Guard Checks ---');

    // Test 1: Unauthenticated request to GET /api/v1/addresses fails with 401
    const unauthRes = await fetch(`${baseUrl}/api/v1/addresses`);
    assert(unauthRes.status === 401, 'GET /api/v1/addresses without token rejected with 401');

    // Test 2: Unauthenticated request to POST /api/v1/addresses fails with 401
    const unauthPostRes = await fetch(`${baseUrl}/api/v1/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Home', streetAddress: 'Test St' }),
    });
    assert(unauthPostRes.status === 401, 'POST /api/v1/addresses without token rejected with 401');

    // Test 3: Authenticated request returns empty array for new user
    const listInitialRes = await fetch(`${baseUrl}/api/v1/addresses`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listInitialData = await listInitialRes.json();
    assert(listInitialRes.status === 200, 'GET /api/v1/addresses returns 200');
    assert(Array.isArray(listInitialData.data) && listInitialData.data.length === 0, 'New customer has 0 saved addresses');

    console.log('\n--- 2. Validation Checks ---');

    // Test 4: Missing streetAddress rejected
    const valRes1 = await fetch(`${baseUrl}/api/v1/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        label: 'Home',
        latitude: 17.4156,
        longitude: 78.4357,
      }),
    });
    assert(valRes1.status === 400, 'Address creation without streetAddress rejected with 400');

    // Test 5: Invalid latitude / longitude rejected
    const valRes2 = await fetch(`${baseUrl}/api/v1/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        label: 'Home',
        streetAddress: 'Road No 12, Banjara Hills',
        latitude: 120.5, // Out of -90..90 range
        longitude: 78.4357,
      }),
    });
    assert(valRes2.status === 400, 'Address creation with latitude > 90 rejected with 400');

    console.log('\n--- 3. Address Creation & Default Management ---');

    // Test 6: Create Address 1 (Home) for Customer A with isDefault: true
    const createA1Res = await fetch(`${baseUrl}/api/v1/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        label: 'Home',
        streetAddress: 'Flat 402, Banjara Hills Road 12',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500034',
        country: 'India',
        latitude: 17.4156,
        longitude: 78.4357,
        isDefault: true,
      }),
    });
    const createA1Data = await createA1Res.json();
    assert(createA1Res.status === 201, 'Address 1 created with 201');
    assert(createA1Data.data.label === 'Home', 'Address 1 label matches');
    assert(createA1Data.data.isDefault === true, 'Address 1 is marked as default');
    addressA1Id = createA1Data.data.id;

    // Test 7: Create Address 2 (Work) for Customer A with isDefault: true (should unset Address 1 default)
    const createA2Res = await fetch(`${baseUrl}/api/v1/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        label: 'Work',
        streetAddress: 'Cyber Towers, Hitech City',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
        country: 'India',
        latitude: 17.4435,
        longitude: 78.3772,
        isDefault: true,
      }),
    });
    const createA2Data = await createA2Res.json();
    assert(createA2Res.status === 201, 'Address 2 created with 201');
    assert(createA2Data.data.label === 'Work', 'Address 2 label matches');
    assert(createA2Data.data.isDefault === true, 'Address 2 is marked as default');
    addressA2Id = createA2Data.data.id;

    // Test 8: List addresses for Customer A -> Address 2 is default, Address 1 is not default
    const listAAfterRes = await fetch(`${baseUrl}/api/v1/addresses`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listAAfterData = await listAAfterRes.json();
    assert(listAAfterData.data.length === 2, 'Customer A now has 2 saved addresses');

    const addr1 = listAAfterData.data.find((a: any) => a.id === addressA1Id);
    const addr2 = listAAfterData.data.find((a: any) => a.id === addressA2Id);
    assert(addr2.isDefault === true, 'Address 2 (Work) remains default');
    assert(addr1.isDefault === false, 'Address 1 (Home) default was automatically unset');

    console.log('\n--- 4. Address Details, Update & Default Toggle ---');

    // Test 9: Get Address by ID
    const getA1Res = await fetch(`${baseUrl}/api/v1/addresses/${addressA1Id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getA1Data = await getA1Res.json();
    assert(getA1Res.status === 200, 'GET /api/v1/addresses/:id returns 200');
    assert(getA1Data.data.streetAddress === 'Flat 402, Banjara Hills Road 12', 'Address details match');

    // Test 10: Non-existent ID returns 404
    const get404Res = await fetch(`${baseUrl}/api/v1/addresses/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(get404Res.status === 404, 'Non-existent address ID returns 404');

    // Test 11: Update Address 1 (streetAddress & postalCode)
    const updateA1Res = await fetch(`${baseUrl}/api/v1/addresses/${addressA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        streetAddress: 'Villa 14, Lotus Pond, Banjara Hills',
        postalCode: '500096',
      }),
    });
    const updateA1Data = await updateA1Res.json();
    assert(updateA1Res.status === 200, 'PATCH /api/v1/addresses/:id returns 200');
    assert(updateA1Data.data.streetAddress === 'Villa 14, Lotus Pond, Banjara Hills', 'streetAddress updated');
    assert(updateA1Data.data.postalCode === '500096', 'postalCode updated');

    // Test 12: Set Address 1 as primary default via dedicated endpoint
    const setDefaultRes = await fetch(`${baseUrl}/api/v1/addresses/${addressA1Id}/default`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const setDefaultData = await setDefaultRes.json();
    assert(setDefaultRes.status === 200, 'PATCH /api/v1/addresses/:id/default returns 200');
    assert(setDefaultData.data.isDefault === true, 'Address 1 is now default');

    // Verify Address 2 is no longer default
    const checkA2Res = await fetch(`${baseUrl}/api/v1/addresses/${addressA2Id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkA2Data = await checkA2Res.json();
    assert(checkA2Data.data.isDefault === false, 'Address 2 is no longer default');

    console.log('\n--- 5. Strict Multi-Tenant Isolation ---');

    // Setup: Customer B creates an address
    const createBRes = await fetch(`${baseUrl}/api/v1/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        label: 'Work',
        streetAddress: 'Inorbit Mall Area, Madhapur',
        city: 'Hyderabad',
        state: 'Telangana',
        latitude: 17.4335,
        longitude: 78.3868,
      }),
    });
    const createBData = await createBRes.json();
    assert(createBRes.status === 201, 'Customer B creates address successfully');
    addressB1Id = createBData.data.id;

    // Test 13: Customer A cannot view Customer B's address
    const tenantGetRes = await fetch(`${baseUrl}/api/v1/addresses/${addressB1Id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(tenantGetRes.status === 404, 'Customer A receives 404 trying to access Customer B address');

    // Test 14: Customer A cannot update Customer B's address
    const tenantUpdateRes = await fetch(`${baseUrl}/api/v1/addresses/${addressB1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ streetAddress: 'Hacked Address' }),
    });
    assert(tenantUpdateRes.status === 404, 'Customer A receives 404 trying to update Customer B address');

    // Test 15: Customer A cannot set Customer B's address as default
    const tenantDefaultRes = await fetch(`${baseUrl}/api/v1/addresses/${addressB1Id}/default`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(tenantDefaultRes.status === 404, 'Customer A receives 404 trying to setDefault on Customer B address');

    // Test 16: Customer A cannot delete Customer B's address
    const tenantDeleteRes = await fetch(`${baseUrl}/api/v1/addresses/${addressB1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(tenantDeleteRes.status === 404, 'Customer A receives 404 trying to delete Customer B address');

    // Test 17: Verify Customer B's address was NOT modified or deleted
    const verifyBRes = await fetch(`${baseUrl}/api/v1/addresses/${addressB1Id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const verifyBData = await verifyBRes.json();
    assert(verifyBRes.status === 200, 'Customer B address remains intact');
    assert(verifyBData.data.streetAddress === 'Inorbit Mall Area, Madhapur', 'Customer B streetAddress unchanged');

    console.log('\n--- 6. Address Deletion ---');

    // Test 18: Customer A deletes Address 2 (Work)
    const deleteA2Res = await fetch(`${baseUrl}/api/v1/addresses/${addressA2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(deleteA2Res.status === 200, 'DELETE /api/v1/addresses/:id returns 200');

    // Test 19: List addresses for Customer A has 1 remaining
    const listFinalRes = await fetch(`${baseUrl}/api/v1/addresses`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listFinalData = await listFinalRes.json();
    assert(listFinalData.data.length === 1, 'Customer A now has 1 address remaining');
    assert(listFinalData.data[0].id === addressA1Id, 'Remaining address is Address 1');

    console.log('\n--- 7. Backend Maps Foundation Endpoints ---');

    // Test 20: GET /api/v1/maps/autocomplete?input=Banjara
    const autoRes = await fetch(`${baseUrl}/api/v1/maps/autocomplete?input=Banjara`);
    const autoData = await autoRes.json();
    assert(autoRes.status === 200, 'GET /api/v1/maps/autocomplete returns 200');
    assert(autoData.success === true, 'Autocomplete response success is true');
    assert(Array.isArray(autoData.data) && autoData.data.length > 0, 'Autocomplete returns suggestion array');
    assert(Boolean(autoData.data[0].placeId), 'Autocomplete suggestion has placeId');
    assert(Boolean(autoData.data[0].description), 'Autocomplete suggestion has description');

    // Test 21: Autocomplete without input parameter returns empty array gracefully
    const autoEmptyRes = await fetch(`${baseUrl}/api/v1/maps/autocomplete`);
    const autoEmptyData = await autoEmptyRes.json();
    assert(autoEmptyRes.status === 200 && Array.isArray(autoEmptyData.data) && autoEmptyData.data.length === 0, 'Autocomplete without input gracefully returns empty array');

    // Test 22: GET /api/v1/maps/place-details?placeId=...
    const firstPlaceId = autoData.data[0].placeId;
    const detailsRes = await fetch(`${baseUrl}/api/v1/maps/place-details?placeId=${encodeURIComponent(firstPlaceId)}`);
    const detailsData = await detailsRes.json();
    assert(detailsRes.status === 200, 'GET /api/v1/maps/place-details returns 200');
    assert(detailsData.success === true, 'Place details success is true');
    assert(typeof detailsData.data.lat === 'number', 'Place details has numeric lat');
    assert(typeof detailsData.data.lng === 'number', 'Place details has numeric lng');
    assert(Boolean(detailsData.data.formattedAddress), 'Place details has formattedAddress');

    // Test 23: GET /api/v1/maps/geocode?address=Hitech+City
    const geoRes = await fetch(`${baseUrl}/api/v1/maps/geocode?address=Hitech+City`);
    const geoData = await geoRes.json();
    assert(geoRes.status === 200, 'GET /api/v1/maps/geocode returns 200');
    assert(typeof geoData.data.lat === 'number', 'Geocode has numeric lat');
    assert(typeof geoData.data.lng === 'number', 'Geocode has numeric lng');

    // Test 24: GET /api/v1/maps/reverse-geocode?lat=17.4156&lng=78.4357
    const revRes = await fetch(`${baseUrl}/api/v1/maps/reverse-geocode?lat=17.4156&lng=78.4357`);
    const revData = await revRes.json();
    assert(revRes.status === 200, 'GET /api/v1/maps/reverse-geocode returns 200');
    assert(revData.success === true, 'Reverse geocode success is true');
    assert(Boolean(revData.data.formattedAddress), 'Reverse geocode returned formattedAddress');

    // Test 25: GET /api/v1/maps/distance between Banjara Hills & Hitech City
    const distRes = await fetch(
      `${baseUrl}/api/v1/maps/distance?originLat=17.4156&originLng=78.4357&destLat=17.4435&destLng=78.3772`
    );
    const distData = await distRes.json();
    assert(distRes.status === 200, 'GET /api/v1/maps/distance returns 200');
    assert(distData.success === true, 'Distance calculation success is true');
    assert(typeof distData.data.distanceKm === 'number' && distData.data.distanceKm > 0, 'distanceKm is positive number');
    assert(typeof distData.data.durationMinutes === 'number' && distData.data.durationMinutes > 0, 'durationMinutes is positive number');
    assert(Boolean(distData.data.distanceText), 'distanceText is present');
    assert(Boolean(distData.data.durationText), 'durationText is present');

  } finally {
    // ----------------------------------------------------
    // CLEANUP: Clean up test data and close server
    // ----------------------------------------------------
    console.log('\n--- Cleanup ---');
    try {
      if (userA?.id) {
        await prisma.address.deleteMany({ where: { customer: { userId: userA.id } } });
        await prisma.customerProfile.deleteMany({ where: { userId: userA.id } });
        await prisma.user.delete({ where: { id: userA.id } });
      }
      if (userB?.id) {
        await prisma.address.deleteMany({ where: { customer: { userId: userB.id } } });
        await prisma.customerProfile.deleteMany({ where: { userId: userB.id } });
        await prisma.user.delete({ where: { id: userB.id } });
      }
    } catch (cleanErr) {
      console.warn('Cleanup warning:', cleanErr);
    }

    server.close();
    await prisma.$disconnect();
  }

  console.log('\n==================================================');
  console.log(`🎉 ALL ${passedCount}/${totalCount} INTEGRATION TESTS PASSED!`);
  console.log('==================================================\n');
}

runAddressAndMapsIntegrationTests().catch((err) => {
  console.error('\n❌ INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
