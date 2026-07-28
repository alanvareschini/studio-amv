// RF08 — Perguntas frequentes. Adicione/edite livremente.

export interface FaqItem {
  question: string;
  answer: string;
}

export const faq: FaqItem[] = [
  {
    question: "Quanto tempo demora para ficar pronto?",
    answer:
      "Um site de uma página costuma ficar pronto em 3 a 7 dias úteis, dependendo do pacote e da rapidez no envio dos materiais. Sites maiores podem levar de 10 a 15 dias.",
  },
  {
    question: "Preciso ter logo e fotos?",
    answer:
      "Ajuda bastante, mas não é obrigatório. Se você ainda não tem, eu preparo o visual para funcionar bem com o que você tiver e indico soluções simples.",
  },
  {
    question: "O site funciona bem no celular?",
    answer:
      "Sim. A prioridade é justamente o celular, porque a maioria dos seus clientes vai abrir pelo WhatsApp ou Instagram. Tudo é testado em celular, tablet e desktop.",
  },
  {
    question: "Tem manutenção mensal?",
    answer:
      "Tem, mas é opcional. No plano mensal eu acompanho a hospedagem, o funcionamento do site, cópias de segurança e renovações. Também estão incluídas até 2 solicitações simples por mês, como trocar textos, fotos ou contatos. Você não precisa se preocupar com a parte técnica.",
  },
  {
    question: "O que não entra na manutenção?",
    answer:
      "Páginas novas, mudança completa do visual, novas funções e trabalhos maiores não entram nas solicitações simples e recebem um orçamento separado. Solicitações não utilizadas não acumulam para o mês seguinte.",
  },
  {
    question: "O site sai do ar sem manutenção?",
    answer:
      "Não. A manutenção é separada da hospedagem. O site continua no ar enquanto o domínio e a conta de hospedagem estiverem ativos, e você pode pedir alterações somente quando precisar.",
  },
  {
    question: "Como funciona o pagamento?",
    answer:
      "Todos os pacotes têm proposta e contrato eletrônico antes do início. Nos pacotes de criação, combinamos uma parte na contratação e o restante na entrega. A manutenção é uma cobrança mensal no cartão, ativada somente depois da conversa e da assinatura do contrato. Os dados do cartão são preenchidos em uma página de pagamento segura e não ficam armazenados neste site.",
  },
  {
    question: "Posso cancelar a manutenção?",
    answer:
      "Sim. O cancelamento pode ser solicitado pelo WhatsApp conforme as condições apresentadas antes da assinatura. Em caso de atraso, o atendimento e os novos ajustes podem ser pausados, mas o site não é apagado.",
  },
  {
    question: "Você faz domínio e hospedagem?",
    answer:
      "Sim. A configuração inicial da hospedagem está incluída e tudo fica organizado no seu nome. O domínio tem renovação anual própria. Se o projeto precisar de algum serviço pago adicional, você será informado e aprovará antes, sem cobranças de surpresa.",
  },
];
