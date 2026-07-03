// RF03 / RF04 — Pacotes. Marque "featured: true" no pacote a destacar (Profissional).

export interface Package {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  audience: string;
  features: string[];
  cta: string;
  featured?: boolean;
  badge?: string;
}

export const packages: Package[] = [
  {
    id: "essencial",
    name: "Essencial",
    price: "R$ 497",
    priceNote: "pagamento único",
    audience: "Para quem precisa marcar presença rápido e com qualidade.",
    features: [
      "Landing page de uma página",
      "Design responsivo (celular, tablet, desktop)",
      "Botão de WhatsApp",
      "Seção de serviços",
      "SEO básico (title, description)",
    ],
    cta: "Quero o Essencial",
  },
  {
    id: "profissional",
    name: "Profissional",
    price: "R$ 897",
    priceNote: "pagamento único",
    audience: "Para o negócio que quer passar confiança e vender mais.",
    features: [
      "Tudo do Essencial",
      "Até 4 seções personalizadas",
      "Formulário de orçamento inteligente",
      "Integração com Google Maps",
      "Galeria / portfólio",
      "Animações suaves e visual premium",
    ],
    cta: "Quero o Profissional",
    featured: true,
    badge: "Mais recomendado",
  },
  {
    id: "premium",
    name: "Premium",
    price: "R$ 1.497",
    priceNote: "pagamento único",
    audience: "Para quem quer um site completo e diferenciado.",
    features: [
      "Tudo do Profissional",
      "Site institucional multi-seção",
      "Identidade visual aplicada",
      "Otimização avançada de performance",
      "SEO completo + Open Graph",
      "Suporte prioritário no lançamento",
    ],
    cta: "Quero o Premium",
  },
  {
    id: "manutencao",
    name: "Manutenção",
    price: "R$ 149",
    priceNote: "por mês",
    audience: "Para manter o site sempre atualizado.",
    features: [
      "Atualizações de conteúdo",
      "Pequenos ajustes mensais",
      "Monitoramento e backups",
      "Suporte por WhatsApp",
      "Relatório simples de visitas",
    ],
    cta: "Quero Manutenção",
  },
];
