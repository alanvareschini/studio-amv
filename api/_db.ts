// Acesso ao Postgres (Vercel Postgres / Neon). Cria a tabela na primeira vez.
// Rastreamento ANÔNIMO: nenhuma informação que identifique a pessoa é gravada
// (sem IP, sem cookie de visitante). Só dados agregados de comportamento.
import { sql } from "@vercel/postgres";

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

export { sql };
