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
      "Uma página profissional para apresentar e vender",
      "Perfeito no celular, tablet e computador",
      "Botão de WhatsApp",
      "Apresentação dos seus serviços",
      "Configuração para aparecer no Google",
      "Contrato eletrônico antes de começar",
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
      "Até 4 áreas feitas para o seu negócio",
      "Formulário que organiza pedidos de orçamento",
      "Localização no Google Maps",
      "Galeria de fotos ou trabalhos",
      "Movimentos suaves e visual diferenciado",
      "Contrato eletrônico antes de começar",
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
      "Site completo com várias áreas",
      "Visual adaptado à sua marca",
      "Carregamento ainda mais rápido",
      "Configuração completa para Google e redes sociais",
      "Atendimento prioritário na publicação",
      "Contrato eletrônico antes de começar",
    ],
    cta: "Quero o Premium",
  },
  {
    id: "manutencao",
    name: "Manutenção",
    price: "R$ 149",
    priceNote: "por mês",
    audience: "Eu cuido do site e da hospedagem para você não precisar se preocupar.",
    features: [
      "Eu cuido da hospedagem para você",
      "Até 2 solicitações simples por mês",
      "Trocas de textos, fotos ou contatos",
      "Resposta inicial em até 2 dias úteis",
      "Acompanhamento e cópias de segurança",
      "Avisos sobre domínio e renovações",
      "Suporte por WhatsApp",
      "Relatório simples de visitas",
    ],
    cta: "Quero Manutenção",
  },
];
