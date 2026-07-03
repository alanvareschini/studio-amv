// RF08 — Perguntas frequentes. Adicione/edite livremente.

export interface FaqItem {
  question: string;
  answer: string;
}

export const faq: FaqItem[] = [
  {
    question: "Quanto tempo demora para ficar pronto?",
    answer:
      "Uma landing page costuma ficar pronta em 3 a 7 dias úteis, dependendo do pacote e da rapidez no envio dos materiais. Sites maiores podem levar de 10 a 15 dias.",
  },
  {
    question: "Preciso ter logo e fotos?",
    answer:
      "Ajuda bastante, mas não é obrigatório. Se você ainda não tem, eu organizo o layout para funcionar bem com o que você tiver e indico soluções simples.",
  },
  {
    question: "O site funciona bem no celular?",
    answer:
      "Sim. A prioridade é justamente o celular, porque a maioria dos seus clientes vai abrir pelo WhatsApp ou Instagram. Tudo é testado em celular, tablet e desktop.",
  },
  {
    question: "Tem manutenção mensal?",
    answer:
      "Tem, e é opcional. O pacote de Manutenção cuida de atualizações, ajustes, backups e suporte para o seu site ficar sempre atualizado.",
  },
  {
    question: "Como funciona o pagamento?",
    answer:
      "Combinamos pela conversa no WhatsApp. Normalmente uma parte na contratação e o restante na entrega. Pacotes de manutenção são mensais.",
  },
  {
    question: "Você faz domínio e hospedagem?",
    answer:
      "Sim, eu oriento e ajudo na configuração de domínio e hospedagem. Você fica com tudo no seu nome e no controle do seu negócio.",
  },
];
