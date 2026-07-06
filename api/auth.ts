// Login do painel: POST { password } → cookie de sessão. DELETE → logout.
// GET → informa se a sessão atual é válida (para o front decidir o que mostrar).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { checkPassword, makeToken, setCookie, clearCookie, isAuthed } from "./_auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      res.status(200).json({ authed: isAuthed(req), configured: !!process.env.DASHBOARD_PASSWORD });
      return;
    }

    if (req.method === "DELETE") {
      res.setHeader("Set-Cookie", clearCookie());
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "POST") {
      let body: Record<string, unknown> = {};
      try {
        body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      } catch {
        body = {};
      }
      if (!process.env.DASHBOARD_PASSWORD) {
        res.status(500).json({ error: "config", hint: "DASHBOARD_PASSWORD não configurada no Vercel" });
        return;
      }
      // pequena proteção anti-força-bruta: atraso fixo
      await new Promise((r) => setTimeout(r, 350));
      if (!checkPassword(body.password)) {
        res.status(401).json({ error: "senha" });
        return;
      }
      res.setHeader("Set-Cookie", setCookie(makeToken()));
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "method" });
  } catch (e) {
    console.error("[auth] erro", e);
    res.status(500).json({ error: "server" });
  }
}
