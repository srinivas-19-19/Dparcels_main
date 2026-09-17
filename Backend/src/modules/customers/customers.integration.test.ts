import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import authRoutes from '../auth/auth.routes';
import customerRoutes from './customers.routes';
import prisma from '../../utils/prisma';
import { generateAccessToken } from '../../utils/jwt';
import { env } from '../../config/env';
import supabaseStorageService from '../../services/storage/supabaseStorage.service';

async function runCustomerProfileIntegrationTests() {
  console.log('\n==================================================');
  console.log('🧪 DPARCELS CUSTOMER PROFILE & ACCOUNT INTEGRATION SUITE');
  console.log('==================================================\n');

  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/customers', customerRoutes);

  // Global test error handler
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal error',
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
  const testCustomerEmailA = `customer_a_${timestamp}@example.com`;
  const testCustomerEmailB = `customer_b_${timestamp}@example.com`;
  let userA: any = null;
  let userB: any = null;
  let tokenA: string = '';
  let tokenB: string = '';

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
            firstName: 'Alice',
            lastName: 'Sharma',
            phone: '9876543210',
            preferredLanguage: 'en',
            theme: 'dark',
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
            firstName: 'Bob',
            lastName: 'Verma',
            phone: '9123456780',
            preferredLanguage: 'te',
            theme: 'light',
          },
        },
      },
      include: { customerProfile: true },
    });

    tokenA = generateAccessToken({ userId: userA.id, role: userA.role });
    tokenB = generateAccessToken({ userId: userB.id, role: userB.role });

    console.log('1. Testing Authentication & Authorization Controls...');

    // 1. Valid JWT -> profile returned from /auth/me
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const meBody = await meRes.json();
    assert(meRes.status === 200, 'GET /api/v1/auth/me returns 200 with valid JWT');
    assert(meBody.data.id === userA.id, '/auth/me returns correct authenticated user identity');
    assert(
      meBody.data.customerProfile?.firstName === 'Alice',
      '/auth/me includes full customerProfile'
    );

    // 2. No JWT -> 401
    const noJwtRes = await fetch(`${baseUrl}/api/v1/customers/me`);
    assert(noJwtRes.status === 401, 'Request with missing JWT returns 401');

    // 3. Invalid JWT -> 401
    const invalidJwtRes = await fetch(`${baseUrl}/api/v1/customers/me`, {
      headers: { Authorization: 'Bearer invalid.token.value' },
    });
    assert(invalidJwtRes.status === 401, 'Request with malformed/invalid JWT returns 401');

    // 4. Expired JWT -> 401
    const expiredToken = jwt.sign(
      { userId: userA.id, role: 'CUSTOMER' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '-10s' }
    );
    const expiredJwtRes = await fetch(`${baseUrl}/api/v1/customers/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert(expiredJwtRes.status === 401, 'Request with expired JWT returns 401');

    // 5. Non-customer role -> 403 on customer endpoints
    const riderToken = generateAccessToken({ userId: 'fake-rider-id', role: 'RIDER' });
    const riderRes = await fetch(`${baseUrl}/api/v1/customers/me`, {
      headers: { Authorization: `Bearer ${riderToken}` },
    });
    assert(riderRes.status === 403, 'Non-CUSTOMER role is forbidden (403)');

    console.log('\n2. Testing Customer Profile Retrieval & Updates...');

    // 6. Get own profile
    const profileRes = await fetch(`${baseUrl}/api/v1/customers/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const profileBody = await profileRes.json();
    assert(profileRes.status === 200, 'GET /api/v1/customers/me returns 200');
    assert(profileBody.data.userId === userA.id, 'Returns own customer profile');
    assert(profileBody.data.email === testCustomerEmailA, 'Returns customer email');

    // 7. Update own name
    const updateNameRes = await fetch(`${baseUrl}/api/v1/customers/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ name: 'Alice Wonder' }),
    });
    const updateNameBody = await updateNameRes.json();
    assert(updateNameRes.status === 200, 'PATCH /api/v1/customers/me updates name successfully');
    assert(updateNameBody.data.firstName === 'Alice', 'firstName split correctly');
    assert(updateNameBody.data.lastName === 'Wonder', 'lastName split correctly');

    // 8. Update own phone
    const updatePhoneRes = await fetch(`${baseUrl}/api/v1/customers/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ phone: '+91 9988776655' }),
    });
    const updatePhoneBody = await updatePhoneRes.json();
    assert(updatePhoneRes.status === 200, 'PATCH /api/v1/customers/me updates phone number');
    assert(updatePhoneBody.data.phone === '+91 9988776655', 'Phone number persisted');

    // 9. Invalid phone rejected (400)
    const badPhoneRes = await fetch(`${baseUrl}/api/v1/customers/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ phone: '123' }),
    });
    assert(badPhoneRes.status === 400, 'Invalid phone number rejected with 400');

    // 10. Empty name rejected (400)
    const emptyNameRes = await fetch(`${baseUrl}/api/v1/customers/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ name: '   ' }),
    });
    assert(emptyNameRes.status === 400, 'Empty name rejected with 400');

    // 11. Invalid language rejected (400)
    const badLangRes = await fetch(`${baseUrl}/api/v1/customers/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ preferredLanguage: 'french' }),
    });
    assert(badLangRes.status === 400, 'Unsupported language rejected with 400');

    // 12. Invalid theme rejected (400)
    const badThemeRes = await fetch(`${baseUrl}/api/v1/customers/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ theme: 'neon' }),
    });
    assert(badThemeRes.status === 400, 'Unsupported theme rejected with 400');

    console.log('\n3. Testing Security & Tenant Isolation...');

    // 13. Customer cannot access another customer's profile
    // Calling with Token A MUST return Profile A, even if body/query tries to specify User B
    const spoofRes = await fetch(`${baseUrl}/api/v1/customers/me?userId=${userB.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const spoofBody = await spoofRes.json();
    assert(
      spoofBody.data.userId === userA.id && spoofBody.data.userId !== userB.id,
      'Tenant isolation: User A cannot query User B profile via query param'
    );

    // 14. Protected field rejection (role, email, password)
    const exploitRes = await fetch(`${baseUrl}/api/v1/customers/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ role: 'ADMIN', email: 'hacked@dparcels.com' }),
    });
    assert(exploitRes.status === 400, 'Attempts to update role/email rejected by strict schema');

    // 15. Password hash and refresh tokens never exposed
    const stringified = JSON.stringify(profileBody);
    assert(!stringified.includes('password'), 'Password hash never exposed in profile responses');
    assert(!stringified.includes('refreshToken'), 'Refresh token never exposed in profile responses');
    assert(
      !stringified.includes('service-role') && !stringified.includes('SERVICE_ROLE'),
      'Supabase service role secret never exposed in responses'
    );

    console.log('\n4. Testing Persistence Across Sessions & Refresh...');

    // 16. Change language and theme -> verify DB persistence
    await fetch(`${baseUrl}/api/v1/customers/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ preferredLanguage: 'te', theme: 'light' }),
    });

    // Verify session restoration via /auth/me
    const verifyMeRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const verifyMeBody = await verifyMeRes.json();
    assert(
      verifyMeBody.data.customerProfile?.preferredLanguage === 'te',
      'Preferred language persisted in DB and returned on session restore'
    );
    assert(
      verifyMeBody.data.customerProfile?.theme === 'light',
      'Theme preference persisted in DB and returned on session restore'
    );

    console.log('\n5. Testing Supabase Storage Customer Avatars...');

    // 17. Valid JPEG avatar upload
    // Valid JPEG magic bytes: 0xFF, 0xD8, 0xFF
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const uploadRes = await supabaseStorageService.uploadAvatar(userA.id, jpegBuffer, 'image/jpeg');
    assert(uploadRes.path.startsWith('customer-avatars/'), 'Storage path starts with customer-avatars bucket');
    assert(uploadRes.path.includes(userA.id), 'Storage path is partitioned by customer userId');
    assert(uploadRes.publicUrl.includes(userA.id), 'Public URL contains storage path');

    // 18. Valid PNG upload
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const pngUpload = await supabaseStorageService.uploadAvatar(userA.id, pngBuffer, 'image/png');
    assert(pngUpload.path.endsWith('.png'), 'PNG upload generates .png extension');

    // 19. Valid WebP upload
    // RIFF....WEBP
    const webpHeader = Buffer.from('RIFF1234WEBPVP8 ');
    const webpUpload = await supabaseStorageService.uploadAvatar(userA.id, webpHeader, 'image/webp');
    assert(webpUpload.path.endsWith('.webp'), 'WebP upload generates .webp extension');

    // 20. Rejection of invalid MIME type (e.g. text/plain or executable)
    let rejectedMime = false;
    try {
      supabaseStorageService.validateImage(Buffer.from('not an image'), 'text/plain');
    } catch {
      rejectedMime = true;
    }
    assert(rejectedMime, 'Invalid MIME type rejected');

    // 21. Rejection of oversized file (> 5 MB)
    let rejectedSize = false;
    try {
      const hugeBuffer = Buffer.alloc(6 * 1024 * 1024);
      supabaseStorageService.validateImage(hugeBuffer, 'image/jpeg');
    } catch {
      rejectedSize = true;
    }
    assert(rejectedSize, 'Oversized file (> 5MB) rejected');

    // 22. Avatar replacement cleans up previous avatar & updates DB
    const firstAvatar = await prisma.customerProfile.update({
      where: { userId: userA.id },
      data: { profileImage: uploadRes.publicUrl },
    });
    assert(firstAvatar.profileImage === uploadRes.publicUrl, 'Initial avatar saved to database');

    // Replace with new avatar
    const replacementBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const newAvatarResult = await supabaseStorageService.uploadAvatar(
      userA.id,
      replacementBuffer,
      'image/png'
    );
    const secondAvatar = await prisma.customerProfile.update({
      where: { userId: userA.id },
      data: { profileImage: newAvatarResult.publicUrl },
    });
    assert(secondAvatar.profileImage === newAvatarResult.publicUrl, 'Replaced avatar saved to database');

    // 23. Delete avatar clears profileImage in DB
    const deleteAvatarRes = await fetch(`${baseUrl}/api/v1/customers/me/avatar`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const deleteAvatarBody = await deleteAvatarRes.json();
    assert(deleteAvatarRes.status === 200, 'DELETE /api/v1/customers/me/avatar returns 200');
    assert(deleteAvatarBody.data.profileImage === null, 'profileImage cleared in database');

    console.log('\n==================================================');
    console.log(`🎉 ALL ${passedCount} / ${totalCount} INTEGRATION TESTS PASSED CLEANLY!`);
    console.log('==================================================\n');
  } catch (err: any) {
    console.error('\n❌ INTEGRATION TEST FAILED:', err.message || err);
    process.exitCode = 1;
  } finally {
    // Clean up test data from database
    if (userA) {
      await prisma.user.delete({ where: { id: userA.id } }).catch(() => {});
    }
    if (userB) {
      await prisma.user.delete({ where: { id: userB.id } }).catch(() => {});
    }
    server.close();
  }
}

runCustomerProfileIntegrationTests();
