// Estatísticas agregadas para o painel. Exige sessão válida.
// Retorna: resumo, série por dia, páginas mais/menos engajadas, cliques,
// dispositivos e origens de tráfego. Tudo agregado (nada individual).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, sql } from "./_db.js";
import { isAuthed } from "./_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthed(req)) {
    res.status(401).json({ error: "auth" });
    return;
  }
  const days = Math.max(1, Math.min(365, Number(req.query.days) || 30));

  try {
    await ensureSchema();

    const summary = await sql`
      SELECT
        COUNT(*) FILTER (WHERE type='pageview')                         AS pageviews,
        COUNT(DISTINCT visit) FILTER (WHERE type='pageview')            AS visits,
        COALESCE(ROUND(AVG(duration_ms) FILTER (WHERE type='leave')),0) AS avg_ms,
        COALESCE(ROUND(AVG(scroll_pct)  FILTER (WHERE type='leave')),0) AS avg_scroll,
        COUNT(*) FILTER (WHERE type='click')                           AS clicks
      FROM events
      WHERE created_at >= now() - (${days} || ' days')::interval;
    `;

    const series = await sql`
      SELECT to_char(day,'YYYY-MM-DD') AS day,
             COUNT(DISTINCT visit) FILTER (WHERE type='pageview') AS visits,
             COUNT(*) FILTER (WHERE type='pageview')              AS pageviews
      FROM events
      WHERE created_at >= now() - (${days} || ' days')::interval
      GROUP BY day ORDER BY day;
    `;

    const topPages = await sql`
      SELECT path,
             COUNT(*) FILTER (WHERE type='pageview')                          AS views,
             COALESCE(ROUND(AVG(duration_ms) FILTER (WHERE type='leave')),0)  AS avg_ms
      FROM events
      WHERE created_at >= now() - (${days} || ' days')::interval
      GROUP BY path ORDER BY views DESC LIMIT 12;
    `;

    // páginas onde as pessoas MENOS ficam (menor tempo médio, com dados suficientes)
    const leastEngaged = await sql`
      SELECT path,
             ROUND(AVG(duration_ms)) AS avg_ms,
             COUNT(*)                AS samples
      FROM events
      WHERE type='leave' AND duration_ms IS NOT NULL
        AND created_at >= now() - (${days} || ' days')::interval
      GROUP BY path HAVING COUNT(*) >= 3
      ORDER BY avg_ms ASC LIMIT 8;
    `;

    const clicks = await sql`
      SELECT COALESCE(label,'(sem rótulo)') AS label, COUNT(*) AS n
      FROM events
      WHERE type='click'
        AND created_at >= now() - (${days} || ' days')::interval
      GROUP BY label ORDER BY n DESC LIMIT 12;
    `;

    const devices = await sql`
      SELECT COALESCE(device,'desconhecido') AS device,
             COUNT(DISTINCT visit) AS visits
      FROM events
      WHERE type='pageview'
        AND created_at >= now() - (${days} || ' days')::interval
      GROUP BY device ORDER BY visits DESC;
    `;

    const referrers = await sql`
      SELECT COALESCE(NULLIF(ref,''),'direto') AS ref, COUNT(*) AS n
      FROM events
      WHERE type='pageview'
        AND created_at >= now() - (${days} || ' days')::interval
      GROUP BY ref ORDER BY n DESC LIMIT 10;
    `;

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      days,
      summary: summary.rows[0],
      series: series.rows,
      topPages: topPages.rows,
      leastEngaged: leastEngaged.rows,
      clicks: clicks.rows,
      devices: devices.rows,
      referrers: referrers.rows,
    });
  } catch (e) {
    console.error("[stats] erro", e);
    res.status(500).json({ error: "server" });
  }
}
