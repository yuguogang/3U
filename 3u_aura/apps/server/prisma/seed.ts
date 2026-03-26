import { PrismaClient, Prisma } from 'generated/prisma/client';

import { userSeed } from './seeds/user.seed';
import {
  createPrismaPgAdapter,
  resolveDatabaseSchemaFromEnv,
  splitPrismaPgPoolConfig,
} from '../src/db/prisma-pg-config';

const { poolConfig, schema } = splitPrismaPgPoolConfig({
  connectionString: process.env.DATABASE_URL,
  schema: resolveDatabaseSchemaFromEnv(),
});
const { adapter } = createPrismaPgAdapter(poolConfig, schema);
const prisma = new PrismaClient({ adapter });

const main = async () => {
  console.log('Seeding database...');

  await userSeed(prisma);

  console.log('Seeding complete 🌱');
};

main()
  .then(async () => {
    console.log('Process completed');
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.log(error);
    await prisma.$disconnect();
    process.exit(1);
  });
