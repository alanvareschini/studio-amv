// Acesso ao Postgres (Vercel Postgres / Neon). Cria a tabela na primeira vez.
// Rastreamento ANÔNIMO: nenhuma informação que identifique a pessoa é gravada
// (sem IP, sem cookie de visitante). Só dados agregados de comportamento.
import { createPool, type VercelPool } from "@vercel/postgres";

// O Postgres do Vercel (Neon) pode injetar a string de conexão com nomes
// diferentes dependendo da integração. Aceitamos qualquer um.
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

let pool: VercelPool | null = null;
function db(): VercelPool {
  if (!pool) pool = createPool({ connectionString: connectionString() });
  return pool;
}

// `sql` como tagged template, ligado ao pool resolvido em runtime.
export const sql: VercelPool["sql"] = (strings: TemplateStringsArray, ...values: never[]) =>
  db().sql(strings, ...values);

let ready: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
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
    })().catch((e) => {
      ready = null; // permite tentar de novo numa próxima requisição
      throw e;
    });
  }
  return ready;
}
