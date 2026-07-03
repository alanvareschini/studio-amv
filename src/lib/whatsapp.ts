// RF07 — Gera o link do WhatsApp com mensagem pronta a partir dos dados do formulário.
import { site } from "../data/site";

export interface BriefingData {
  nome: string;
  whatsapp: string;
  empresa?: string;
  segmento: string;
  objetivo: string;
  pacote: string;
  manutencao?: string;
  instagram?: string;
  mensagem?: string;
}

export function buildWhatsappMessage(data: BriefingData): string {
  // Cada informação em sua própria linha, com rótulo (a quebra de linha no
  // WhatsApp vira %0A depois do encodeURIComponent).
  const linhas = [
    `*Nome:* ${data.nome || "-"}`,
    `*WhatsApp:* ${data.whatsapp || "-"}`,
    data.empresa ? `*Empresa:* ${data.empresa}` : "",
    `*Segmento:* ${data.segmento || "-"}`,
    `*Objetivo:* ${data.objetivo || "-"}`,
    `*Pacote:* ${data.pacote || "Ainda não escolhido"}`,
    `*Manutenção mensal:* ${data.manutencao ? "Sim (R$ 149/mês)" : "Não"}`,
    data.instagram ? `*Instagram:* ${data.instagram}` : "",
    data.mensagem ? `*Observações:* ${data.mensagem}` : "",
  ].filter(Boolean);
  return `*Novo orçamento — AMV Web Studio*\n\n${linhas.join("\n")}`;
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

// Link rápido com mensagem padrão (usado nos CTAs espalhados pela página — RF10)
export function quickWhatsappLink(presetMessage?: string): string {
  const msg =
    presetMessage ??
    `Olá! Vim pelo site da ${site.brand} e quero um orçamento para o meu negócio.`;
  return whatsappLink(msg);
}
