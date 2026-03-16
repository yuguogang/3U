import {
  resolveDatabaseSchemaFromEnv,
  splitPrismaPgPoolConfig,
} from './prisma-pg-config';

describe('prisma-pg-config', () => {
  it('prefers DATABASE_SCHEMA when provided', () => {
    expect(
      resolveDatabaseSchemaFromEnv({
        DATABASE_SCHEMA: 'fork_anvil',
        DATABASE_URL: 'postgresql://postgres:password@127.0.0.1:5433/db?schema=public',
      }),
    ).toBe('fork_anvil');
  });

  it('falls back to schema query param in DATABASE_URL', () => {
    expect(
      resolveDatabaseSchemaFromEnv({
        DATABASE_URL:
          'postgresql://postgres:password@127.0.0.1:5433/db?schema=fork_anvil',
      }),
    ).toBe('fork_anvil');
  });

  it('returns undefined when schema is not configured', () => {
    expect(resolveDatabaseSchemaFromEnv({})).toBeUndefined();
    expect(
      resolveDatabaseSchemaFromEnv({
        DATABASE_URL: 'postgresql://postgres:password@127.0.0.1:5433/db',
      }),
    ).toBeUndefined();
  });

  it('rejects invalid schema names', () => {
    expect(() =>
      resolveDatabaseSchemaFromEnv({
        DATABASE_SCHEMA: 'fork-anvil',
      }),
    ).toThrow('Invalid DATABASE_SCHEMA value "fork-anvil"');
  });

  it('splits schema out of pool config', () => {
    expect(
      splitPrismaPgPoolConfig({
        database: '3u_aura',
        host: '127.0.0.1',
        port: 5433,
        schema: 'fork_anvil',
        user: 'postgres',
      }),
    ).toEqual({
      poolConfig: {
        database: '3u_aura',
        host: '127.0.0.1',
        port: 5433,
        user: 'postgres',
      },
      schema: 'fork_anvil',
    });
  });
});
