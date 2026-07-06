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

    const since = `${days} days`;

    const summary = await sql`
      SELECT
        COUNT(DISTINCT visit)                                          AS visitors,
        COUNT(*) FILTER (WHERE type='pageview')                        AS pageviews,
        COALESCE(ROUND(AVG(duration_ms) FILTER (WHERE type='leave')),0) AS avg_ms,
        COALESCE(ROUND(AVG(scroll_pct)  FILTER (WHERE type='leave')),0) AS avg_scroll,
        COUNT(*) FILTER (WHERE type='click')                          AS clicks,
        COUNT(DISTINCT visit) FILTER (WHERE device='mobile')          AS mobile,
        COUNT(DISTINCT visit) FILTER (WHERE device='desktop')         AS desktop,
        COUNT(DISTINCT visit) FILTER (WHERE device='tablet')          AS tablet
      FROM events
      WHERE created_at >= now() - ${since}::interval;
    `;

    const series = await sql`
      SELECT to_char(day,'YYYY-MM-DD') AS day,
             COUNT(DISTINCT visit) AS visitors
      FROM events
      WHERE created_at >= now() - ${since}::interval
      GROUP BY day ORDER BY day;
    `;

    const topPages = await sql`
      SELECT path,
             COUNT(DISTINCT visit)                                            AS visitors,
             COALESCE(ROUND(AVG(duration_ms) FILTER (WHERE type='leave')),0)  AS avg_ms
      FROM events
      WHERE created_at >= now() - ${since}::interval
      GROUP BY path ORDER BY visitors DESC LIMIT 12;
    `;

    const leastEngaged = await sql`
      SELECT path, ROUND(AVG(duration_ms)) AS avg_ms, COUNT(*) AS samples
      FROM events
      WHERE type='leave' AND duration_ms IS NOT NULL
        AND created_at >= now() - ${since}::interval
      GROUP BY path HAVING COUNT(*) >= 3
      ORDER BY avg_ms ASC LIMIT 8;
    `;

    const clicks = await sql`
      SELECT COALESCE(label,'(sem rótulo)') AS label, COUNT(*) AS n
      FROM events
      WHERE type='click' AND created_at >= now() - ${since}::interval
      GROUP BY label ORDER BY n DESC LIMIT 15;
    `;

    const devices = await sql`
      SELECT COALESCE(device,'desconhecido') AS device, COUNT(DISTINCT visit) AS visitors
      FROM events
      WHERE created_at >= now() - ${since}::interval
      GROUP BY device ORDER BY visitors DESC;
    `;

    const browsers = await sql`
      SELECT COALESCE(browser,'Outro') AS browser, COUNT(DISTINCT visit) AS visitors
      FROM events
      WHERE created_at >= now() - ${since}::interval
      GROUP BY browser ORDER BY visitors DESC LIMIT 10;
    `;

    const systems = await sql`
      SELECT COALESCE(os,'Outro') AS os, COUNT(DISTINCT visit) AS visitors
      FROM events
      WHERE created_at >= now() - ${since}::interval
      GROUP BY os ORDER BY visitors DESC LIMIT 10;
    `;

    const referrers = await sql`
      SELECT COALESCE(NULLIF(ref,''),'direto') AS ref, COUNT(DISTINCT visit) AS visitors
      FROM events
      WHERE created_at >= now() - ${since}::interval
      GROUP BY ref ORDER BY visitors DESC LIMIT 10;
    `;

    // Cada visitante (anônimo): aparelho, navegador, SO, tempo e quando.
    const recentVisits = await sql`
      SELECT
        MAX(device)  AS device,
        MAX(browser) AS browser,
        MAX(os)      AS os,
        MAX(scroll_pct)  AS scroll,
        MAX(duration_ms) AS duration,
        to_char(MIN(created_at) AT TIME ZONE 'America/Sao_Paulo','DD/MM HH24:MI') AS quando
      FROM events
      WHERE visit IS NOT NULL AND created_at >= now() - ${since}::interval
      GROUP BY visit
      ORDER BY MIN(created_at) DESC
      LIMIT 40;
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
      browsers: browsers.rows,
      systems: systems.rows,
      referrers: referrers.rows,
      recentVisits: recentVisits.rows,
    });
  } catch (e) {
    console.error("[stats] erro", e);
    res.status(500).json({ error: "server", detail: describeError(e) });
  }
}

function describeError(e: unknown): string {
  if (e instanceof Error) {
    const anyE = e as { code?: string; detail?: string };
    return [e.message, anyE.code, anyE.detail].filter(Boolean).join(" | ");
  }
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    const parts = ["message", "code", "detail", "name", "severity", "hint"]
      .map((k) => (o[k] != null ? `${k}=${String(o[k])}` : ""))
      .filter(Boolean);
    if (parts.length) return parts.join(" | ");
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
  return String(e);
}
