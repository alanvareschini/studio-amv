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
  const partes = [
    `Olá, meu nome é ${data.nome || "[nome]"}.`,
    `Meu WhatsApp é ${data.whatsapp || "[WhatsApp]"}.`,
    data.empresa ? `Minha empresa é ${data.empresa}.` : "",
    `Tenho um negócio no segmento ${data.segmento || "[segmento]"}.`,
    `Quero um site com objetivo de ${data.objetivo || "[objetivo]"}.`,
    data.pacote ? `Tenho interesse no pacote ${data.pacote}.` : "Ainda não escolhi o pacote.",
    data.manutencao ? "Também quero incluir a manutenção mensal (R$ 149/mês)." : "",
    data.instagram ? `Meu Instagram é ${data.instagram}.` : "",
    data.mensagem ? `Observações: ${data.mensagem}.` : "",
  ];
  return partes.filter(Boolean).join(" ");
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
