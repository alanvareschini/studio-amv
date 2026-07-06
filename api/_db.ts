// Acesso ao Postgres (Vercel Postgres / Neon). Cria a tabela na primeira vez.
// Rastreamento ANÔNIMO: nenhuma informação que identifique a pessoa é gravada
// (sem IP, sem cookie de visitante). Só dados agregados de comportamento.
//
// Usa createClient (conexão direta) — funciona tanto com string "pooled" quanto
// "direct". A conexão é reaproveitada entre invocações quentes e revalidada a
// cada chamada (recria se tiver caído).
import { createClient, type VercelClient } from "@vercel/postgres";

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

let client: VercelClient | null = null;

async function ensureConn(): Promise<VercelClient> {
  if (client) {
    try {
      await client.sql`SELECT 1`; // conexão ainda viva?
      return client;
    } catch {
      try {
        await client.end();
      } catch {
        /* ignora */
      }
      client = null;
    }
  }
  const c = createClient({ connectionString: connectionString() });
  await c.connect();
  client = c;
  return c;
}

// `sql` como tagged template — usa o cliente já conectado por ensureSchema().
export const sql: VercelClient["sql"] = ((strings: TemplateStringsArray, ...values: never[]) => {
  if (!client) throw new Error("DB não inicializado — chame ensureSchema() antes.");
  return client.sql(strings, ...values);
}) as VercelClient["sql"];

let schemaReady = false;

export async function ensureSchema(): Promise<void> {
  await ensureConn(); // garante conexão viva a cada requisição
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id          BIGSERIAL PRIMARY KEY,
      type        TEXT NOT NULL,            -- 'pageview' | 'click' | 'leave'
      path        TEXT NOT NULL DEFAULT '/',
      ref         TEXT,                     -- domínio de origem (sem query)
      device      TEXT,                     -- 'mobile' | 'tablet' | 'desktop'
      label       TEXT,                     -- rótulo do elemento clicado
      duration_ms INTEGER,                  -- tempo engajado (evento 'leave')
      scroll_pct  SMALLINT,                 -- profundidade de rolagem (0-100)
      visit       TEXT,                     -- id efêmero por visita (não persistido no navegador)
      day         DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS events_created_idx ON events (created_at);`;
  await sql`CREATE INDEX IF NOT EXISTS events_type_idx ON events (type);`;
  schemaReady = true;
}
