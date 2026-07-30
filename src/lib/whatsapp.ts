// RF07 — Gera o link do WhatsApp com mensagem pronta a partir dos dados do formulário.
import { site } from "../data/site";
import { getLocale, translateText } from "../i18n";

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
  const locale = getLocale();
  const labels = locale === "en"
    ? {
        name: "Name",
        company: "Company",
        segment: "Business type",
        goal: "Goal",
        package: "Package",
        maintenance: "Monthly maintenance",
        notes: "Notes",
        notSelected: "Not selected yet",
        yes: "Yes (BRL 149/month)",
        no: "No",
        title: "New quote request — AMV Web Studio",
      }
    : locale === "es"
      ? {
          name: "Nombre",
          company: "Empresa",
          segment: "Tipo de negocio",
          goal: "Objetivo",
          package: "Paquete",
          maintenance: "Mantenimiento mensual",
          notes: "Observaciones",
          notSelected: "Aún no elegido",
          yes: "Sí (R$ 149/mes)",
          no: "No",
          title: "Nueva solicitud de presupuesto — AMV Web Studio",
        }
      : {
          name: "Nome",
          company: "Empresa",
          segment: "Segmento",
          goal: "Objetivo",
          package: "Pacote",
          maintenance: "Manutenção mensal",
          notes: "Observações",
          notSelected: "Ainda não escolhido",
          yes: "Sim (R$ 149/mês)",
          no: "Não",
          title: "Novo orçamento — AMV Web Studio",
        };
  // Cada informação em sua própria linha, com rótulo (a quebra de linha no
  // WhatsApp vira %0A depois do encodeURIComponent).
  const linhas = [
    `*${labels.name}:* ${data.nome || "-"}`,
    `*WhatsApp:* ${data.whatsapp || "-"}`,
    data.empresa ? `*${labels.company}:* ${data.empresa}` : "",
    `*${labels.segment}:* ${data.segmento || "-"}`,
    `*${labels.goal}:* ${data.objetivo || "-"}`,
    `*${labels.package}:* ${data.pacote ? translateText(data.pacote) : labels.notSelected}`,
    `*${labels.maintenance}:* ${data.manutencao ? labels.yes : labels.no}`,
    data.instagram ? `*Instagram:* ${data.instagram}` : "",
    data.mensagem ? `*${labels.notes}:* ${data.mensagem}` : "",
  ].filter(Boolean);
  return `*${labels.title}*\n\n${linhas.join("\n")}`;
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

// Link rápido com mensagem padrão (usado nos CTAs espalhados pela página — RF10)
export function quickWhatsappLink(presetMessage?: string): string {
  const locale = getLocale();
  const msg =
    presetMessage ??
    (locale === "en"
      ? `Hello! I found ${site.brand}'s website and would like a quote for my business.`
      : locale === "es"
        ? `¡Hola! Llegué desde el sitio de ${site.brand} y quiero un presupuesto para mi negocio.`
        : `Olá! Vim pelo site da ${site.brand} e quero um orçamento para o meu negócio.`);
  return whatsappLink(msg);
}
