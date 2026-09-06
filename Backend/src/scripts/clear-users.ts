import 'dotenv/config';
import prisma from '../utils/prisma';

async function clearCustomerUsers() {
  try {
    console.log('🔄 Cleaning customer user records from the database...');

    // Find all users with CUSTOMER role
    const customerUsers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true, email: true }
    });

    if (customerUsers.length === 0) {
      console.log('ℹ️ No customer user records found in the database.');
      return;
    }

    const customerUserIds = customerUsers.map(u => u.id);

    await prisma.$transaction(async (tx: any) => {
      // 1. Delete associated refresh tokens & notifications
      await tx.refreshToken.deleteMany({ where: { userId: { in: customerUserIds } } });
      await tx.notification.deleteMany({ where: { userId: { in: customerUserIds } } });

      // 2. Delete customer profiles & addresses
      const profiles = await tx.customerProfile.findMany({
        where: { userId: { in: customerUserIds } },
        select: { id: true }
      });
      const profileIds = profiles.map((p: any) => p.id);

      if (profileIds.length > 0) {
        await tx.address.deleteMany({ where: { customerProfileId: { in: profileIds } } });
        await tx.customerProfile.deleteMany({ where: { id: { in: profileIds } } });
      }

      // 3. Delete the customer User records
      const count = await tx.user.deleteMany({ where: { id: { in: customerUserIds } } });
      console.log(`✅ Successfully removed ${count.count} customer user email record(s).`);
    });
  } catch (error) {
    console.error('❌ Error while clearing user records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearCustomerUsers();
