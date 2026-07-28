// Acesso ao Postgres (Vercel Postgres / Neon) usando o driver padrão `pg`
// (TCP nativo) — funciona com qualquer string de conexão, sem os problemas
// de WebSocket/pooling do driver serverless.
// Rastreamento ANÔNIMO: nada que identifique a pessoa é gravado.
import pg from "pg";

const { Pool } = pg;

function connectionString(): string {
  const s =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED ||
    "";
  if (!s) {
    throw new Error(
      "Nenhuma string de conexão do Postgres encontrada (POSTGRES_URL / DATABASE_URL). Conecte o banco no Vercel e faça redeploy."
    );
  }
  return s;
}

let pool: pg.Pool | null = null;
function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: connectionString(),
      ssl: { rejectUnauthorized: false }, // Neon exige SSL
      max: 3,
      idleTimeoutMillis: 10_000,
    });
  }
  return pool;
}

// `sql` como tagged template: converte para query parametrizada do pg.
// Uso: const r = await sql`SELECT ... ${valor}`; r.rows
export function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<pg.QueryResult> {
  let text = strings[0];
  for (let i = 0; i < values.length; i++) {
    text += `$${i + 1}` + strings[i + 1];
  }
  return getPool().query(text, values as unknown[]);
}

let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext('amv_events_schema_v1'))");
      await client.query(`
        CREATE TABLE IF NOT EXISTS events (
          id          BIGSERIAL PRIMARY KEY,
          type        TEXT NOT NULL,
          path        TEXT NOT NULL DEFAULT '/',
          ref         TEXT,
          device      TEXT,
          label       TEXT,
          duration_ms INTEGER,
          scroll_pct  SMALLINT,
          visit       TEXT,
          day         DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        ALTER TABLE events ADD COLUMN IF NOT EXISTS browser TEXT;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS os TEXT;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS vid TEXT;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS country TEXT;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS city TEXT;
        CREATE INDEX IF NOT EXISTS events_created_idx ON events (created_at);
        CREATE INDEX IF NOT EXISTS events_type_idx ON events (type);
        CREATE INDEX IF NOT EXISTS events_visit_idx ON events (visit);
        CREATE INDEX IF NOT EXISTS events_vid_idx ON events (vid);
        DELETE FROM events WHERE created_at < now() - interval '180 days';
      `);
      await client.query("COMMIT");
      schemaReady = true;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  })().finally(() => {
    schemaPromise = null;
  });

  return schemaPromise;
}
