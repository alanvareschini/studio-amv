// Recebe os eventos de comportamento do site de vendas e grava no Postgres.
// Aberto (é o que o site chama), mas só ACEITA eventos — nunca devolve dados.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, sql } from "./_db.js";

const TYPES = new Set(["pageview", "click", "leave", "conv"]);
const DEVICES = new Set(["mobile", "tablet", "desktop"]);

function clampStr(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, max);
  return s || null;
}

function clampInt(v: unknown, min: number, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method" });
    return;
  }
  // ignora robôs pelo user-agent do servidor (não são visitas reais)
  const ua = String(req.headers["user-agent"] || "").toLowerCase();
  if (/bot|crawl|spider|slurp|headless|lighthouse|pagespeed|monitor|bingpreview|facebookexternalhit|embedly|phantom|puppeteer|playwright|vercel|uptime|dataprovider|scan/i.test(ua)) {
    res.status(204).end();
    return;
  }
  try {
    // sendBeacon manda como texto; o body pode vir como string
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const type = clampStr(body.type, 16);
    if (!type || !TYPES.has(type)) {
      res.status(400).json({ error: "type" });
      return;
    }
    const path = clampStr(body.path, 200) || "/";
    const ref = clampStr(body.ref, 120);
    const deviceRaw = clampStr(body.device, 16);
    const device = deviceRaw && DEVICES.has(deviceRaw) ? deviceRaw : null;
    const browser = clampStr(body.browser, 30);
    const os = clampStr(body.os, 20);
    const label = clampStr(body.label, 80);
    const duration = clampInt(body.duration, 0, 1000 * 60 * 60); // até 1h
    const scroll = clampInt(body.scroll, 0, 100);
    const visit = clampStr(body.visit, 40);
    const vid = clampStr(body.vid, 60);

    // Localização aproximada vinda do Vercel (NÃO guardamos o IP — só país/cidade).
    const h = req.headers;
    const country = clampStr(h["x-vercel-ip-country"], 4);
    let city: string | null = null;
    const rawCity = h["x-vercel-ip-city"];
    if (typeof rawCity === "string") {
      try {
        city = clampStr(decodeURIComponent(rawCity), 60);
      } catch {
        city = clampStr(rawCity, 60);
      }
    }

    await ensureSchema();
    await sql`
      INSERT INTO events (type, path, ref, device, browser, os, label, duration_ms, scroll_pct, visit, vid, country, city)
      VALUES (${type}, ${path}, ${ref}, ${device}, ${browser}, ${os}, ${label}, ${duration}, ${scroll}, ${visit}, ${vid}, ${country}, ${city});
    `;
    res.status(204).end();
  } catch (e) {
    console.error("[track] erro", e);
    res.status(500).json({ error: "server" });
  }
}
