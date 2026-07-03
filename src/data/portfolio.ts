// RF09 — Modelos demonstrativos (NÃO são clientes reais).

export interface PortfolioItem {
  segment: string;
  title: string;
  description: string;
  // Cor de destaque do card (usa as cores da paleta)
  accent: "green" | "purple" | "cyan" | "blue" | "gold";
  // Emoji simples para evitar imagens pesadas (RNF02)
  icon: string;
}

export const portfolio: PortfolioItem[] = [
  {
    segment: "Barbearia",
    title: "Estilo urbano e moderno",
    description: "Foco em agendamento rápido, fotos de cortes e botão direto pro WhatsApp.",
    accent: "cyan",
    icon: "💈",
  },
  {
    segment: "Clínica de estética",
    title: "Elegante e confiável",
    description: "Tons suaves, lista de procedimentos e prova de resultados.",
    accent: "purple",
    icon: "✨",
  },
  {
    segment: "Restaurante",
    title: "Apetitoso e direto",
    description: "Cardápio em destaque, localização no mapa e pedidos por WhatsApp.",
    accent: "gold",
    icon: "🍽️",
  },
  {
    segment: "Personal trainer",
    title: "Energético e motivador",
    description: "Planos de treino, depoimentos e chamada forte para agendar avaliação.",
    accent: "green",
    icon: "💪",
  },
  {
    segment: "Loja local",
    title: "Vitrine que vende",
    description: "Produtos em destaque, novidades e contato rápido para reservar.",
    accent: "blue",
    icon: "🛍️",
  },
  {
    segment: "Consultor",
    title: "Autoridade e clareza",
    description: "Apresentação profissional, serviços e formulário para captar contatos.",
    accent: "cyan",
    icon: "📈",
  },
];
