// Conteúdo das seções de texto (serviços, problemas, solução, processo).
// Centralizado para facilitar edição sem mexer no layout (RNF08).

export interface Service {
  icon: string;
  title: string;
  description: string;
}

export const services: Service[] = [
  { icon: "🚀", title: "Landing pages", description: "Páginas de alta conversão focadas em transformar visitantes em clientes." },
  { icon: "🏢", title: "Sites institucionais", description: "Presença profissional completa para o seu negócio aparecer com seriedade." },
  { icon: "💬", title: "Botão de WhatsApp", description: "Contato a um toque, com mensagem pronta para acelerar o atendimento." },
  { icon: "📝", title: "Formulário de contato", description: "Captação de orçamentos simples, sem fricção para o cliente." },
  { icon: "📍", title: "Google Maps", description: "Localização integrada para quem precisa ser encontrado na região." },
  { icon: "🔍", title: "SEO básico", description: "Title, description e estrutura para o Google entender o seu site." },
  { icon: "🛠️", title: "Manutenção mensal", description: "Seu site sempre atualizado, no ar e funcionando sem dor de cabeça." },
  { icon: "📱", title: "100% responsivo", description: "Perfeito no celular, tablet e desktop — prioridade total no mobile." },
];

export interface Problem {
  icon: string;
  text: string;
}

export const problems: Problem[] = [
  { icon: "🔎", text: "O cliente pesquisa no Google, mas não encontra um site do seu negócio." },
  { icon: "📲", text: "O Instagram não organiza todas as informações importantes em um só lugar." },
  { icon: "😕", text: "Sem uma página própria, o negócio parece menos profissional." },
  { icon: "⏱️", text: "O cliente precisa ver serviços, localização e contato de forma rápida." },
];

export const problemHeadline =
  "O problema não é falta de cliente. É falta de uma presença digital clara.";

export const solutions: Service[] = [
  { icon: "🌐", title: "Página profissional", description: "Um site que transmite confiança desde o primeiro segundo." },
  { icon: "📋", title: "Serviços organizados", description: "Tudo o que você oferece, claro e fácil de entender." },
  { icon: "🖼️", title: "Fotos e identidade", description: "Seu visual aplicado para o negócio se destacar." },
  { icon: "📍", title: "Localização", description: "Mapa integrado para clientes te encontrarem." },
  { icon: "💬", title: "Botão de WhatsApp", description: "Contato direto, sem formulários complicados." },
  { icon: "📱", title: "Responsividade", description: "Perfeito em qualquer tela, com foco no celular." },
];

export interface ProcessStep {
  title: string;
  description: string;
}

export const processSteps: ProcessStep[] = [
  { title: "Conversa rápida", description: "Um papo no WhatsApp para entender o seu negócio e objetivo." },
  { title: "Escolha do pacote", description: "Você escolhe o pacote ideal e alinhamos o escopo." },
  { title: "Proposta e contrato", description: "Tudo combinado de forma clara antes de começar." },
  { title: "Envio dos materiais", description: "Você manda o essencial: textos, fotos e informações." },
  { title: "Desenvolvimento", description: "Eu crio o site com foco em performance e conversão." },
  { title: "Revisão", description: "Você revisa e a gente ajusta os detalhes juntos." },
  { title: "Publicação", description: "Seu site vai ao ar, rápido e responsivo." },
  { title: "Manutenção opcional", description: "Mantenho tudo atualizado e funcionando." },
];

export const processMessage =
  "Eu conduzo o processo de forma leve. Você responde o essencial, eu organizo o restante.";

// "Organização e segurança" (seção de confiança)
export const trustPoints: Service[] = [
  { icon: "🔐", title: "Seu domínio, no seu nome", description: "Você fica com o controle total do site e do domínio." },
  { icon: "⚡", title: "Carregamento rápido", description: "Sites leves e otimizados, sem peso desnecessário." },
  { icon: "♿", title: "Acessibilidade básica", description: "Bom contraste, textos claros e navegação por teclado." },
  { icon: "🧩", title: "Fácil de manter", description: "Estrutura organizada para evoluir quando você quiser." },
];

export const proofPoints: string[] = [
  "Visual premium",
  "Foco no celular",
  "Carregamento rápido",
  "Direto no WhatsApp",
];
