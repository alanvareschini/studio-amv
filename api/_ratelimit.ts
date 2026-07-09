// Limite simples por IP, em memória (compartilhado por instância serverless quente).
// Não é à prova de escala horizontal, mas barra flood/força-bruta trivial sem
// depender de um serviço externo (KV/Upstash). Para rigor total, trocar por KV.

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export function clientIp(req: { headers: Record<string, unknown> }): string {
  const xff = String(req.headers["x-forwarded-for"] || "");
  const first = xff.split(",")[0].trim();
  return first || String(req.headers["x-real-ip"] || "") || "unknown";
}

// Retorna true se ainda dentro do limite; false se estourou.
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    // limpeza oportunista pra não crescer sem limite
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
    }
    return true;
  }
  b.count += 1;
  return b.count <= max;
}
