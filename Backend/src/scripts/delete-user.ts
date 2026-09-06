import 'dotenv/config';
import prisma from '../utils/prisma';

async function deleteUserByEmail(email: string) {
  if (!email) {
    console.error('❌ Please provide an email address. Usage: npx tsx src/scripts/delete-user.ts <email>');
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        customerProfile: true,
        riderProfile: true,
      },
    });

    if (!user) {
      console.log(`⚠️ User with email "${normalizedEmail}" was not found in the database.`);
      process.exit(0);
    }

    // Handle cascading deletions safely due to onDelete: Restrict on profiles
    await prisma.$transaction(async (tx: any) => {
      // 1. Delete RefreshTokens & Notifications
      await tx.refreshToken.deleteMany({ where: { userId: user.id } });
      await tx.notification.deleteMany({ where: { userId: user.id } });

      // 2. Delete Customer Profile & Addresses if present
      if (user.customerProfile) {
        await tx.address.deleteMany({ where: { customerProfileId: user.customerProfile.id } });
        await tx.customerProfile.delete({ where: { id: user.customerProfile.id } });
      }

      // 3. Delete Rider Profile if present
      if (user.riderProfile) {
        await tx.riderProfile.delete({ where: { id: user.riderProfile.id } });
      }

      // 4. Delete User record
      await tx.user.delete({ where: { id: user.id } });
    });

    console.log(`✅ Successfully deleted user with email: ${normalizedEmail}`);
  } catch (error) {
    console.error('❌ Failed to delete user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Read email from CLI arguments (e.g. npx tsx src/scripts/delete-user.ts user@example.com)
const targetEmail = process.argv[2];
deleteUserByEmail(targetEmail);
