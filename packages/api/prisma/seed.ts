import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { id: 'mock-user-id' },
    update: {},
    create: {
      id: 'mock-user-id',
      email: 'mock@example.com',
      displayName: 'Mock User',
      cognitoId: 'mock-cognito-id',
    },
  });
  console.log('Seed completed: mock user created');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
