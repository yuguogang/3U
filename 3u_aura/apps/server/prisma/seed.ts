import { PrismaClient, Prisma } from 'generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { userSeed } from './seeds/user.seed';
import {
  resolveDatabaseSchemaFromEnv,
  splitPrismaPgPoolConfig,
} from '../src/db/prisma-pg-config';

const { poolConfig, schema } = splitPrismaPgPoolConfig({
  connectionString: process.env.DATABASE_URL,
  schema: resolveDatabaseSchemaFromEnv(),
});
const pool = new Pool(poolConfig);
const adapter = new PrismaPg(pool, schema ? { schema } : undefined);
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
