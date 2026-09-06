// @ts-ignore
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.argv[2];
  if (!email) {
    console.error('Please provide an email: npx ts-node src/scripts/seed-admin.ts <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('User not found.');
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' }
  });

  console.log(`✅ Successfully updated ${email} to ADMIN role.`);
  process.exit(0);
}

seedAdmin();
