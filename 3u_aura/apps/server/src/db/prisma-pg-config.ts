import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import type { PoolConfig } from 'pg';

const POSTGRES_SCHEMA_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export type PrismaPgPoolConfig = PoolConfig & {
  schema?: string;
};

export function resolveDatabaseSchemaFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const explicitSchema = env.DATABASE_SCHEMA?.trim();
  if (explicitSchema) {
    return normalizeSchema(explicitSchema);
  }

  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return undefined;
  }

  try {
    const schema = new URL(databaseUrl).searchParams.get('schema')?.trim();
    return schema ? normalizeSchema(schema) : undefined;
  } catch {
    return undefined;
  }
}

export function splitPrismaPgPoolConfig(config: PrismaPgPoolConfig): {
  poolConfig: PoolConfig;
  schema?: string;
} {
  const { schema, ...poolConfig } = config;
  return {
    poolConfig,
    schema,
  };
}

type PrismaPgPoolInput = ConstructorParameters<typeof PrismaPg>[0];

export function createPrismaPgAdapter(
  poolConfig: PoolConfig,
  schema?: string,
): { adapter: PrismaPg; pool: Pool } {
  const pool = new Pool(poolConfig);

  // pnpm 10 can materialize multiple compatible pg type packages in the graph,
  // so we bridge the constructor input through PrismaPg's declared parameter type.
  const adapter = new PrismaPg(
    pool as unknown as PrismaPgPoolInput,
    schema ? { schema } : undefined,
  );

  return { adapter, pool };
}

function normalizeSchema(schema: string): string {
  if (!POSTGRES_SCHEMA_PATTERN.test(schema)) {
    throw new Error(`Invalid DATABASE_SCHEMA value "${schema}"`);
  }

  return schema;
}
