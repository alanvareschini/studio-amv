// Acesso ao Postgres (Vercel Postgres / Neon). Cria a tabela na primeira vez.
// Rastreamento ANÔNIMO: nenhuma informação que identifique a pessoa é gravada
// (sem IP, sem cookie de visitante). Só dados agregados de comportamento.
//
// O driver serverless do Neon conecta via WebSocket e EXIGE a string "pooled"
// (host com "-pooler"). Se o Vercel injetou a string direta, convertemos.
import { createPool, type VercelPool } from "@vercel/postgres";

// Garante o host "pooled" do Neon (insere "-pooler" antes do primeiro ponto).
function poolify(url: string): string {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("-pooler")) {
      const dot = u.hostname.indexOf(".");
      if (dot > 0) {
        u.hostname = u.hostname.slice(0, dot) + "-pooler" + u.hostname.slice(dot);
      }
    }
    return u.toString();
  } catch {
    return url;
  }
}

function connectionString(): string {
  // prioriza uma string que já seja "pooled"
  const candidates = [
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL_UNPOOLED,
  ].filter((s): s is string => !!s);

  if (candidates.length === 0) {
    throw new Error(
      "Nenhuma string de conexão do Postgres encontrada (POSTGRES_URL / DATABASE_URL). Conecte o banco no Vercel e faça redeploy."
    );
  }
  const pooled = candidates.find((s) => s.includes("-pooler"));
  return poolify(pooled || candidates[0]);
}

let pool: VercelPool | null = null;
function db(): VercelPool {
  if (!pool) pool = createPool({ connectionString: connectionString() });
  return pool;
}

// `sql` como tagged template, ligado ao pool resolvido em runtime.
export const sql: VercelPool["sql"] = ((strings: TemplateStringsArray, ...values: never[]) =>
  db().sql(strings, ...values)) as VercelPool["sql"];

let schemaReady = false;

export async function ensureSchema(): Promise<void> {
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
