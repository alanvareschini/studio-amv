// Conteúdo das seções de texto (serviços, problemas, solução, processo).
// Centralizado para facilitar edição sem mexer no layout (RNF08).

export interface Service {
  icon: string;
  title: string;
  description: string;
}

export const services: Service[] = [
  { icon: "🚀", title: "Página para vender mais", description: "Uma página direta que apresenta sua oferta e transforma visitas em contatos." },
  { icon: "🏢", title: "Site completo para sua empresa", description: "Tudo sobre o seu negócio organizado para transmitir confiança e profissionalismo." },
  { icon: "💬", title: "Botão de WhatsApp", description: "Contato a um toque, com mensagem pronta para acelerar o atendimento." },
  { icon: "📝", title: "Pedido de orçamento", description: "Seu cliente informa o que precisa de forma simples e organizada." },
  { icon: "📍", title: "Google Maps", description: "Localização integrada para quem precisa ser encontrado na região." },
  { icon: "🔍", title: "Mais fácil de achar no Google", description: "Configuro as informações que ajudam o Google a entender e mostrar seu negócio." },
  { icon: "🛠️", title: "Manutenção mensal", description: "Seu site sempre atualizado, no ar e funcionando sem dor de cabeça." },
  { icon: "📱", title: "Perfeito em qualquer tela", description: "Seu site funciona bem no celular, tablet e computador." },
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
  { icon: "📱", title: "Feito para o celular", description: "Fácil de ler, navegar e entrar em contato em qualquer tela." },
];

export interface ProcessStep {
  title: string;
  description: string;
}

export const processSteps: ProcessStep[] = [
  { title: "Conversa rápida", description: "Um papo no WhatsApp para entender o seu negócio e objetivo." },
  { title: "Escolha do pacote", description: "Você escolhe a melhor opção e combinamos exatamente o que será entregue." },
  { title: "Proposta e contrato", description: "Tudo combinado de forma clara antes de começar." },
  { title: "Envio dos materiais", description: "Você manda o essencial: textos, fotos e informações." },
  { title: "Criação do site", description: "Eu monto tudo para carregar rápido, transmitir confiança e gerar contatos." },
  { title: "Revisão", description: "Você revisa e a gente ajusta os detalhes juntos." },
  { title: "Publicação", description: "Seu site vai ao ar pronto para funcionar no celular e no computador." },
  { title: "Manutenção opcional", description: "Mantenho tudo atualizado e funcionando." },
];

export const processMessage =
  "Eu conduzo o processo de forma leve. Você responde o essencial, eu organizo o restante.";

// "Organização e segurança" (seção de confiança)
export const trustPoints: Service[] = [
  { icon: "🔐", title: "Tudo fica no seu nome", description: "Eu configuro a publicação, mas o site e o domínio continuam sob o seu controle." },
  { icon: "⚡", title: "Abre rápido", description: "Seu cliente não precisa esperar para conhecer o seu negócio." },
  { icon: "♿", title: "Fácil para todos", description: "Textos claros, bom contraste e navegação simples." },
  { icon: "🧩", title: "Pronto para crescer", description: "O site pode receber novas páginas e recursos quando você precisar." },
];

export const proofPoints: string[] = [
  "Visual premium",
  "Foco no celular",
  "Carregamento rápido",
  "Direto no WhatsApp",
];
