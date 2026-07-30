export type Locale = "pt-BR" | "en" | "es";

type ForeignLocale = Exclude<Locale, "pt-BR">;
type Translation = Record<ForeignLocale, string>;

const STORAGE_KEY = "amv-locale";
const SUPPORTED_LOCALES: readonly Locale[] = ["pt-BR", "en", "es"];

declare global {
  interface Window {
    __AMV_LOCALE__?: Locale;
  }
}

const normalizeLocale = (value?: string | null): Locale | null => {
  const language = value?.trim().toLowerCase();
  if (!language) return null;
  if (language === "pt-br" || language.startsWith("pt")) return "pt-BR";
  if (language === "es" || language.startsWith("es-")) return "es";
  if (language === "en" || language.startsWith("en-")) return "en";
  return null;
};

const detectLocale = (): Locale => {
  try {
    const stored = normalizeLocale(localStorage.getItem(STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // Browser privacy settings may block localStorage.
  }

  const candidates = [
    ...(navigator.languages ?? []),
    navigator.language,
  ];
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return "en";
};

const activeLocale =
  normalizeLocale(window.__AMV_LOCALE__) ??
  normalizeLocale(document.documentElement.lang) ??
  detectLocale();

window.__AMV_LOCALE__ = activeLocale;
document.documentElement.lang = activeLocale;

const messages: Record<string, Translation> = {
  "Sites profissionais para negócios locais": {
    en: "Professional websites for local businesses",
    es: "Sitios web profesionales para negocios locales",
  },
  "Sites profissionais para negócios locais.": {
    en: "Professional websites for local businesses.",
    es: "Sitios web profesionales para negocios locales.",
  },
  "Atendimento online para todo o Brasil": {
    en: "Online service throughout Brazil",
    es: "Atención online en todo Brasil",
  },
  "Sites profissionais que fazem seu negócio": {
    en: "Professional websites that help your business",
    es: "Sitios web profesionales que ayudan a tu negocio a",
  },
  "vender mais.": { en: "sell more.", es: "vender más." },
  "Pedir orçamento": { en: "Request a quote", es: "Solicitar presupuesto" },
  "Ver pacotes": { en: "View packages", es: "Ver paquetes" },
  "O que eu faço": { en: "What I do", es: "Lo que hago" },
  "Tudo que o seu negócio precisa": {
    en: "Everything your business needs",
    es: "Todo lo que tu negocio necesita",
  },
  "em um só lugar": { en: "in one place", es: "en un solo lugar" },
  "Serviços pensados para pequenos negócios locais venderem mais.": {
    en: "Services designed to help small local businesses sell more.",
    es: "Servicios pensados para que los pequeños negocios locales vendan más.",
  },
  "Você se identifica?": { en: "Does this sound familiar?", es: "¿Te identificas?" },
  "O problema não é falta de cliente. É falta de uma presença digital clara.": {
    en: "The problem is not a lack of customers. It is the lack of a clear digital presence.",
    es: "El problema no es la falta de clientes. Es la falta de una presencia digital clara.",
  },
  "A solução": { en: "The solution", es: "La solución" },
  "Um site que": { en: "A website that", es: "Un sitio web que" },
  "resolve de verdade": { en: "truly gets results", es: "realmente da resultados" },
  "Tudo organizado para o cliente decidir comprar de você.": {
    en: "Everything organized to help customers choose your business.",
    es: "Todo organizado para ayudar al cliente a elegir tu negocio.",
  },
  "Como funciona": { en: "How it works", es: "Cómo funciona" },
  "Um processo": { en: "A process that is", es: "Un proceso" },
  "leve e organizado": { en: "simple and organized", es: "simple y organizado" },
  "Inspiração": { en: "Inspiration", es: "Inspiración" },
  "Modelos": { en: "Examples", es: "Modelos" },
  "demonstrativos": { en: "you can explore", es: "demostrativos" },
  "Estilos que posso adaptar para diferentes negócios. (Exemplos ilustrativos, não são clientes reais.)": {
    en: "Styles I can adapt to different businesses. (Illustrative examples, not real clients.)",
    es: "Estilos que puedo adaptar a distintos negocios. (Ejemplos ilustrativos, no son clientes reales.)",
  },
  "Organização e segurança": { en: "Organization and security", es: "Organización y seguridad" },
  "Profissional do começo": { en: "Professional from start", es: "Profesional de principio" },
  "ao fim": { en: "to finish", es: "a fin" },
  "Pacotes": { en: "Packages", es: "Paquetes" },
  "Escolha o plano": { en: "Choose the package", es: "Elige el paquete" },
  "ideal pro seu negócio": { en: "that fits your business", es: "ideal para tu negocio" },
  "Todos os pacotes começam com proposta e contrato eletrônico. O valor final depende do que for combinado no WhatsApp.": {
    en: "Every package starts with a proposal and an electronic contract. The final price depends on what we agree on through WhatsApp.",
    es: "Todos los paquetes comienzan con una propuesta y un contrato electrónico. El precio final depende de lo acordado por WhatsApp.",
  },
  "Ativar movimento 3D": { en: "Enable 3D motion", es: "Activar movimiento 3D" },
  "Calibrando movimento...": { en: "Calibrating motion...", es: "Calibrando movimiento..." },
  "Aparelho sem sensor de movimento": {
    en: "This device has no motion sensor",
    es: "Este dispositivo no tiene sensor de movimiento",
  },
  "Essencial": { en: "Essential", es: "Esencial" },
  "Profissional": { en: "Professional", es: "Profesional" },
  "Manutenção": { en: "Maintenance", es: "Mantenimiento" },
  "Mais recomendado": { en: "Most recommended", es: "Más recomendado" },
  "pagamento único": { en: "one-time payment", es: "pago único" },
  "por mês": { en: "per month", es: "al mes" },
  "Para quem precisa marcar presença rápido e com qualidade.": {
    en: "For businesses that need a strong online presence quickly.",
    es: "Para quien necesita una presencia online rápida y de calidad.",
  },
  "Landing page de uma página": { en: "One-page landing page", es: "Landing page de una página" },
  "Uma página profissional para apresentar e vender": {
    en: "A professional page designed to present your offer and sell",
    es: "Una página profesional para presentar tu oferta y vender",
  },
  "Perfeito no celular, tablet e computador": {
    en: "Perfect on phones, tablets, and computers",
    es: "Perfecto en móviles, tablets y computadoras",
  },
  "Apresentação dos seus serviços": { en: "Presentation of your services", es: "Presentación de tus servicios" },
  "Configuração para aparecer no Google": {
    en: "Configuration to improve your Google presence",
    es: "Configuración para aparecer en Google",
  },
  "Contrato eletrônico antes de começar": {
    en: "Electronic contract before work begins",
    es: "Contrato electrónico antes de comenzar",
  },
  "Design responsivo (celular, tablet, desktop)": {
    en: "Responsive design (phone, tablet, desktop)",
    es: "Diseño adaptable (móvil, tablet y computadora)",
  },
  "Botão de WhatsApp": { en: "WhatsApp button", es: "Botón de WhatsApp" },
  "Seção de serviços": { en: "Services section", es: "Sección de servicios" },
  "SEO básico (title, description)": { en: "Basic SEO (title, description)", es: "SEO básico (title, description)" },
  "Para o negócio que quer passar confiança e vender mais.": {
    en: "For businesses that want to build trust and sell more.",
    es: "Para negocios que quieren transmitir confianza y vender más.",
  },
  "Tudo do Essencial": { en: "Everything in Essential", es: "Todo lo incluido en Esencial" },
  "Até 4 seções personalizadas": { en: "Up to 4 custom sections", es: "Hasta 4 secciones personalizadas" },
  "Até 4 áreas feitas para o seu negócio": {
    en: "Up to 4 sections tailored to your business",
    es: "Hasta 4 secciones creadas para tu negocio",
  },
  "Formulário que organiza pedidos de orçamento": {
    en: "A form that organizes quote requests",
    es: "Formulario que organiza solicitudes de presupuesto",
  },
  "Localização no Google Maps": { en: "Google Maps location", es: "Ubicación en Google Maps" },
  "Galeria de fotos ou trabalhos": { en: "Photo or project gallery", es: "Galería de fotos o trabajos" },
  "Movimentos suaves e visual diferenciado": {
    en: "Smooth motion and distinctive visuals",
    es: "Movimientos fluidos y un visual diferenciado",
  },
  "Formulário de orçamento inteligente": { en: "Smart quote request form", es: "Formulario inteligente de presupuesto" },
  "Integração com Google Maps": { en: "Google Maps integration", es: "Integración con Google Maps" },
  "Galeria / portfólio": { en: "Gallery / portfolio", es: "Galería / portafolio" },
  "Animações suaves e visual premium": { en: "Smooth motion and premium visuals", es: "Animaciones fluidas y visual premium" },
  "Para quem quer um site completo e diferenciado.": {
    en: "For businesses that want a complete, distinctive website.",
    es: "Para quien busca un sitio web completo y diferenciado.",
  },
  "Tudo do Profissional": { en: "Everything in Professional", es: "Todo lo incluido en Profesional" },
  "Site institucional multi-seção": { en: "Multi-section business website", es: "Sitio institucional con varias secciones" },
  "Site completo com várias áreas": { en: "Complete website with multiple sections", es: "Sitio completo con varias secciones" },
  "Visual adaptado à sua marca": { en: "Visuals tailored to your brand", es: "Visual adaptado a tu marca" },
  "Carregamento ainda mais rápido": { en: "Even faster loading", es: "Carga aún más rápida" },
  "Configuração completa para Google e redes sociais": {
    en: "Complete setup for Google and social media",
    es: "Configuración completa para Google y redes sociales",
  },
  "Atendimento prioritário na publicação": {
    en: "Priority support during launch",
    es: "Atención prioritaria durante la publicación",
  },
  "Identidade visual aplicada": { en: "Applied visual identity", es: "Identidad visual aplicada" },
  "Otimização avançada de performance": {
    en: "Advanced performance optimization",
    es: "Optimización avanzada de rendimiento",
  },
  "SEO completo + Open Graph": { en: "Complete SEO + Open Graph", es: "SEO completo + Open Graph" },
  "Suporte prioritário no lançamento": { en: "Priority launch support", es: "Soporte prioritario durante el lanzamiento" },
  "Para manter o site sempre atualizado.": {
    en: "To keep your website updated at all times.",
    es: "Para mantener tu sitio siempre actualizado.",
  },
  "Eu cuido do site e da hospedagem para você não precisar se preocupar.": {
    en: "I take care of the website and hosting so you do not have to worry.",
    es: "Me encargo del sitio y del alojamiento para que no tengas que preocuparte.",
  },
  "Eu cuido da hospedagem para você": {
    en: "I manage your hosting for you",
    es: "Me encargo de tu alojamiento",
  },
  "Até 2 solicitações simples por mês": {
    en: "Up to 2 simple requests per month",
    es: "Hasta 2 solicitudes simples al mes",
  },
  "Trocas de textos, fotos ou contatos": {
    en: "Updates to copy, photos, or contact details",
    es: "Cambios de textos, fotos o datos de contacto",
  },
  "Resposta inicial em até 2 dias úteis": {
    en: "Initial response within 2 business days",
    es: "Respuesta inicial en hasta 2 días hábiles",
  },
  "Acompanhamento e cópias de segurança": {
    en: "Monitoring and backups",
    es: "Seguimiento y copias de seguridad",
  },
  "Avisos sobre domínio e renovações": {
    en: "Domain and renewal reminders",
    es: "Avisos sobre dominio y renovaciones",
  },
  "Atualizações de conteúdo": { en: "Content updates", es: "Actualizaciones de contenido" },
  "Pequenos ajustes mensais": { en: "Small monthly adjustments", es: "Pequeños ajustes mensuales" },
  "Monitoramento e backups": { en: "Monitoring and backups", es: "Monitoreo y copias de seguridad" },
  "Suporte por WhatsApp": { en: "Support via WhatsApp", es: "Soporte por WhatsApp" },
  "Relatório simples de visitas": { en: "Simple traffic report", es: "Informe simple de visitas" },
  "Sem plano: R$ 50 por solicitação simples, com até 2 pequenas mudanças": {
    en: "Without a plan: BRL 50 per simple request, including up to 2 small changes",
    es: "Sin plan: R$ 50 por solicitud simple, con hasta 2 pequeños cambios",
  },
  "Alterações mais complexas a partir de R$ 100, após análise": {
    en: "More complex changes from BRL 100, subject to review",
    es: "Cambios más complejos desde R$ 100, después de una revisión",
  },
  "Quero o Essencial": { en: "Choose Essential", es: "Quiero Esencial" },
  "Quero o Profissional": { en: "Choose Professional", es: "Quiero Profesional" },
  "Quero o Premium": { en: "Choose Premium", es: "Quiero Premium" },
  "Quero Manutenção": { en: "Choose Maintenance", es: "Quiero Mantenimiento" },
  "Falar no WhatsApp": { en: "Chat on WhatsApp", es: "Hablar por WhatsApp" },
  "Chamar no WhatsApp": { en: "Chat on WhatsApp", es: "Hablar por WhatsApp" },
  "Pedir orçamento pelo formulário": { en: "Request a quote through the form", es: "Solicitar presupuesto por el formulario" },
  "Página para vender mais": { en: "A page designed to sell more", es: "Una página para vender más" },
  "Uma página direta que apresenta sua oferta e transforma visitas em contatos.": {
    en: "A focused page that presents your offer and turns visits into leads.",
    es: "Una página directa que presenta tu oferta y convierte visitas en contactos.",
  },
  "Site completo para sua empresa": { en: "A complete website for your company", es: "Un sitio completo para tu empresa" },
  "Tudo sobre o seu negócio organizado para transmitir confiança e profissionalismo.": {
    en: "Everything about your business, organized to convey trust and professionalism.",
    es: "Todo sobre tu negocio, organizado para transmitir confianza y profesionalismo.",
  },
  "Contato a um toque, com mensagem pronta para acelerar o atendimento.": {
    en: "One-tap contact with a ready-to-send message for faster service.",
    es: "Contacto con un toque y mensaje listo para agilizar la atención.",
  },
  "Pedido de orçamento": { en: "Quote request", es: "Solicitud de presupuesto" },
  "Seu cliente informa o que precisa de forma simples e organizada.": {
    en: "Customers can explain what they need in a simple, organized way.",
    es: "Tus clientes explican lo que necesitan de forma simple y organizada.",
  },
  "Google Maps": { en: "Google Maps", es: "Google Maps" },
  "Localização integrada para quem precisa ser encontrado na região.": {
    en: "Integrated location details so nearby customers can find you.",
    es: "Ubicación integrada para que los clientes de tu zona te encuentren.",
  },
  "Mais fácil de achar no Google": { en: "Easier to find on Google", es: "Más fácil de encontrar en Google" },
  "Configuro as informações que ajudam o Google a entender e mostrar seu negócio.": {
    en: "I configure the information Google needs to understand and display your business.",
    es: "Configuro la información que ayuda a Google a entender y mostrar tu negocio.",
  },
  "Manutenção mensal": { en: "Monthly maintenance", es: "Mantenimiento mensual" },
  "Seu site sempre atualizado, no ar e funcionando sem dor de cabeça.": {
    en: "Your website stays updated, online, and working without the hassle.",
    es: "Tu sitio siempre actualizado, online y funcionando sin complicaciones.",
  },
  "Perfeito em qualquer tela": { en: "Great on every screen", es: "Perfecto en cualquier pantalla" },
  "Seu site funciona bem no celular, tablet e computador.": {
    en: "Your website works well on phones, tablets, and computers.",
    es: "Tu sitio funciona bien en móviles, tablets y computadoras.",
  },
  "O cliente pesquisa no Google, mas não encontra um site do seu negócio.": {
    en: "Customers search on Google but cannot find your business website.",
    es: "El cliente busca en Google, pero no encuentra un sitio web de tu negocio.",
  },
  "O Instagram não organiza todas as informações importantes em um só lugar.": {
    en: "Instagram does not organize all your important information in one place.",
    es: "Instagram no organiza toda la información importante en un solo lugar.",
  },
  "Sem uma página própria, o negócio parece menos profissional.": {
    en: "Without its own website, a business can look less professional.",
    es: "Sin una página propia, el negocio parece menos profesional.",
  },
  "O cliente precisa ver serviços, localização e contato de forma rápida.": {
    en: "Customers need quick access to your services, location, and contact details.",
    es: "El cliente necesita ver servicios, ubicación y contacto rápidamente.",
  },
  "Página profissional": { en: "Professional website", es: "Página profesional" },
  "Um site que transmite confiança desde o primeiro segundo.": {
    en: "A website that builds trust from the very first second.",
    es: "Un sitio que transmite confianza desde el primer segundo.",
  },
  "Serviços organizados": { en: "Organized services", es: "Servicios organizados" },
  "Tudo o que você oferece, claro e fácil de entender.": {
    en: "Everything you offer, presented clearly and simply.",
    es: "Todo lo que ofreces, claro y fácil de entender.",
  },
  "Fotos e identidade": { en: "Photos and identity", es: "Fotos e identidad" },
  "Seu visual aplicado para o negócio se destacar.": {
    en: "Your visual identity applied to make the business stand out.",
    es: "Tu identidad visual aplicada para que el negocio se destaque.",
  },
  "Localização": { en: "Location", es: "Ubicación" },
  "Mapa integrado para clientes te encontrarem.": {
    en: "An integrated map so customers can find you.",
    es: "Mapa integrado para que los clientes te encuentren.",
  },
  "Contato direto, sem formulários complicados.": {
    en: "Direct contact without complicated forms.",
    es: "Contacto directo, sin formularios complicados.",
  },
  "Feito para o celular": { en: "Made for mobile", es: "Hecho para móviles" },
  "Fácil de ler, navegar e entrar em contato em qualquer tela.": {
    en: "Easy to read, browse, and contact you from any screen.",
    es: "Fácil de leer, navegar y contactar desde cualquier pantalla.",
  },
  "Conversa rápida": { en: "Quick conversation", es: "Conversación rápida" },
  "Um papo no WhatsApp para entender o seu negócio e objetivo.": {
    en: "A WhatsApp chat to understand your business and goals.",
    es: "Una conversación por WhatsApp para entender tu negocio y objetivo.",
  },
  "Escolha do pacote": { en: "Package selection", es: "Elección del paquete" },
  "Você escolhe a melhor opção e combinamos exatamente o que será entregue.": {
    en: "You choose the best option, and we define exactly what will be delivered.",
    es: "Eliges la mejor opción y definimos exactamente qué se entregará.",
  },
  "Proposta e contrato": { en: "Proposal and contract", es: "Propuesta y contrato" },
  "Tudo combinado de forma clara antes de começar.": {
    en: "Everything is clearly agreed before the work begins.",
    es: "Todo se acuerda claramente antes de comenzar.",
  },
  "Envio dos materiais": { en: "Sending your materials", es: "Envío de materiales" },
  "Você manda o essencial: textos, fotos e informações.": {
    en: "You send the essentials: copy, photos, and business information.",
    es: "Envías lo esencial: textos, fotos e información.",
  },
  "Criação do site": { en: "Website creation", es: "Creación del sitio" },
  "Eu monto tudo para carregar rápido, transmitir confiança e gerar contatos.": {
    en: "I build everything to load quickly, inspire trust, and generate leads.",
    es: "Creo todo para que cargue rápido, transmita confianza y genere contactos.",
  },
  "Revisão": { en: "Review", es: "Revisión" },
  "Você revisa e a gente ajusta os detalhes juntos.": {
    en: "You review the website, and we refine the details together.",
    es: "Revisas el sitio y ajustamos juntos los detalles.",
  },
  "Publicação": { en: "Launch", es: "Publicación" },
  "Seu site vai ao ar pronto para funcionar no celular e no computador.": {
    en: "Your website goes live, ready to work on mobile and desktop.",
    es: "Tu sitio se publica listo para funcionar en móvil y computadora.",
  },
  "Manutenção opcional": { en: "Optional maintenance", es: "Mantenimiento opcional" },
  "Mantenho tudo atualizado e funcionando.": {
    en: "I keep everything updated and working.",
    es: "Mantengo todo actualizado y funcionando.",
  },
  "Eu conduzo o processo de forma leve. Você responde o essencial, eu organizo o restante.": {
    en: "I keep the process simple. You provide the essentials, and I organize the rest.",
    es: "Conduzco el proceso de forma simple. Tú respondes lo esencial y yo organizo el resto.",
  },
  "Tudo fica no seu nome": { en: "Everything stays in your name", es: "Todo queda a tu nombre" },
  "Eu configuro a publicação, mas o site e o domínio continuam sob o seu controle.": {
    en: "I handle the launch, but the website and domain remain under your control.",
    es: "Yo configuro la publicación, pero el sitio y el dominio siguen bajo tu control.",
  },
  "Abre rápido": { en: "Loads quickly", es: "Carga rápido" },
  "Seu cliente não precisa esperar para conhecer o seu negócio.": {
    en: "Customers do not have to wait to learn about your business.",
    es: "Tus clientes no tienen que esperar para conocer tu negocio.",
  },
  "Fácil para todos": { en: "Easy for everyone", es: "Fácil para todos" },
  "Textos claros, bom contraste e navegação simples.": {
    en: "Clear copy, strong contrast, and simple navigation.",
    es: "Textos claros, buen contraste y navegación simple.",
  },
  "Pronto para crescer": { en: "Ready to grow", es: "Listo para crecer" },
  "O site pode receber novas páginas e recursos quando você precisar.": {
    en: "The website can gain new pages and features whenever you need them.",
    es: "El sitio puede recibir nuevas páginas y funciones cuando las necesites.",
  },
  "Perguntas": { en: "Frequently asked", es: "Preguntas" },
  "Dúvidas": { en: "Questions", es: "Dudas" },
  "frequentes": { en: "questions", es: "frecuentes" },
  "Quanto tempo demora para ficar pronto?": {
    en: "How long does it take?",
    es: "¿Cuánto tarda en estar listo?",
  },
  "Uma página única costuma ficar pronta entre 3 e 7 dias úteis depois que eu recebo os materiais. Sites maiores podem levar de 10 a 15 dias úteis.": {
    en: "A one-page website is usually ready within 3 to 7 business days after I receive the materials. Larger websites may take 10 to 15 business days.",
    es: "Una página única suele estar lista entre 3 y 7 días hábiles después de recibir los materiales. Los sitios más grandes pueden tardar entre 10 y 15 días hábiles.",
  },
  "Um site de uma página costuma ficar pronto em 3 a 7 dias úteis, dependendo do pacote e da rapidez no envio dos materiais. Sites maiores podem levar de 10 a 15 dias.": {
    en: "A one-page website is usually ready within 3 to 7 business days, depending on the package and how quickly the materials are provided. Larger websites may take 10 to 15 days.",
    es: "Un sitio de una página suele estar listo entre 3 y 7 días hábiles, según el paquete y la rapidez del envío de materiales. Los sitios más grandes pueden tardar entre 10 y 15 días.",
  },
  "Preciso ter logo e fotos?": { en: "Do I need a logo and photos?", es: "¿Necesito tener logo y fotos?" },
  "Não. Se você ainda não tiver tudo pronto, eu te ajudo a organizar o material e posso orientar alternativas para imagens e identidade visual.": {
    en: "No. If you do not have everything ready, I can help organize the materials and suggest alternatives for imagery and visual identity.",
    es: "No. Si todavía no tienes todo listo, te ayudo a organizar el material y puedo sugerir alternativas para imágenes e identidad visual.",
  },
  "Ajuda bastante, mas não é obrigatório. Se você ainda não tem, eu preparo o visual para funcionar bem com o que você tiver e indico soluções simples.": {
    en: "It helps, but it is not required. If you do not have them yet, I will design the website around the materials you have and suggest simple alternatives.",
    es: "Ayuda bastante, pero no es obligatorio. Si todavía no los tienes, preparo el visual para funcionar bien con lo que tengas y te sugiero soluciones simples.",
  },
  "O site funciona bem no celular?": {
    en: "Will the website work well on mobile?",
    es: "¿El sitio funciona bien en móviles?",
  },
  "Sim. O projeto é pensado primeiro para celular e depois ajustado para tablet e computador.": {
    en: "Yes. The project is designed for mobile first, then adapted for tablets and desktops.",
    es: "Sí. El proyecto se diseña primero para móviles y después se adapta a tablets y computadoras.",
  },
  "Sim. A prioridade é justamente o celular, porque a maioria dos seus clientes vai abrir pelo WhatsApp ou Instagram. Tudo é testado em celular, tablet e desktop.": {
    en: "Yes. Mobile is the priority because most customers will arrive through WhatsApp or Instagram. Everything is tested on phones, tablets, and desktops.",
    es: "Sí. La prioridad es el móvil, porque la mayoría de tus clientes llegará desde WhatsApp o Instagram. Todo se prueba en móviles, tablets y computadoras.",
  },
  "Tem manutenção mensal?": { en: "Is monthly maintenance available?", es: "¿Hay mantenimiento mensual?" },
  "Sim. O plano de manutenção custa R$ 149 por mês e cobre hospedagem, monitoramento, backups e até 2 solicitações simples de conteúdo por mês. Eu cuido da parte técnica para você não precisar se preocupar.": {
    en: "Yes. The maintenance plan costs BRL 149 per month and includes hosting, monitoring, backups, and up to 2 simple content requests per month. I handle the technical side so you do not have to worry about it.",
    es: "Sí. El plan de mantenimiento cuesta R$ 149 al mes e incluye alojamiento, monitoreo, copias de seguridad y hasta 2 solicitudes simples de contenido al mes. Yo me encargo de la parte técnica para que no tengas que preocuparte.",
  },
  "Tem, mas é opcional. No plano mensal eu acompanho a hospedagem, o funcionamento do site, cópias de segurança e renovações. Também estão incluídas até 2 solicitações simples por mês. Se você não quiser o plano, pode contratar uma solicitação simples avulsa por R$ 50, com até 2 pequenas mudanças. Você não precisa se preocupar com a parte técnica.": {
    en: "Yes, but it is optional. With the monthly plan, I manage hosting, website operation, backups, and renewals. It also includes up to 2 simple requests per month. If you do not want the plan, you can purchase a one-time simple request for BRL 50, including up to 2 small changes. You do not have to worry about the technical side.",
    es: "Sí, pero es opcional. Con el plan mensual gestiono el alojamiento, el funcionamiento del sitio, las copias de seguridad y las renovaciones. También incluye hasta 2 solicitudes simples al mes. Si no quieres el plan, puedes contratar una solicitud simple por R$ 50, con hasta 2 pequeños cambios. No tienes que preocuparte por la parte técnica.",
  },
  "O que não entra na manutenção?": {
    en: "What is not included in maintenance?",
    es: "¿Qué no incluye el mantenimiento?",
  },
  "Novas páginas, novas funções, reformulação visual, integrações, loja virtual e mudanças grandes são orçadas separadamente.": {
    en: "New pages, features, redesigns, integrations, online stores, and major changes are quoted separately.",
    es: "Las nuevas páginas, funciones, rediseños, integraciones, tiendas online y cambios grandes se cotizan por separado.",
  },
  "Páginas novas, mudança completa do visual, novas funções e trabalhos maiores não entram nas solicitações simples e recebem um orçamento separado. Solicitações não utilizadas não acumulam para o mês seguinte.": {
    en: "New pages, a complete redesign, new features, and larger jobs are not considered simple requests and are quoted separately. Unused requests do not roll over to the next month.",
    es: "Las páginas nuevas, un rediseño completo, nuevas funciones y trabajos mayores no se consideran solicitudes simples y se cotizan por separado. Las solicitudes no utilizadas no se acumulan para el mes siguiente.",
  },
  "Qual é a diferença entre uma alteração simples e uma mais complexa?": {
    en: "What is the difference between a simple and a more complex change?",
    es: "¿Cuál es la diferencia entre un cambio simple y uno más complejo?",
  },
  "Uma alteração simples é trocar texto, foto, telefone, horário ou contato em uma área que já existe, sem mudar o layout. A solicitação avulsa de R$ 50 inclui até 2 pequenas mudanças desse tipo. Uma alteração mais complexa envolve criar uma nova seção, mudar o layout ou adicionar formulário, integração, animação ou funcionalidade. Nesses casos, o valor começa em R$ 100 e é confirmado após análise, antes do serviço.": {
    en: "A simple change means updating copy, a photo, phone number, opening hours, or contact details in an existing area without changing the layout. The BRL 50 one-time request includes up to 2 small changes of this kind. A more complex change involves creating a new section, changing the layout, or adding a form, integration, animation, or feature. In these cases, pricing starts at BRL 100 and is confirmed after review, before the work begins.",
    es: "Un cambio simple consiste en actualizar un texto, una foto, un teléfono, un horario o un contacto en un área existente, sin cambiar el diseño. La solicitud puntual de R$ 50 incluye hasta 2 pequeños cambios de este tipo. Un cambio más complejo implica crear una nueva sección, cambiar el diseño o añadir un formulario, integración, animación o funcionalidad. En estos casos, el precio comienza en R$ 100 y se confirma después de la revisión, antes de realizar el servicio.",
  },
  "O site sai do ar sem manutenção?": {
    en: "Will my website go offline without maintenance?",
    es: "¿El sitio se desconecta sin mantenimiento?",
  },
  "Não. O site continua sendo seu. Sem o plano mensal, custos e cuidados com domínio, hospedagem e serviços externos ficam sob sua responsabilidade.": {
    en: "No. The website remains yours. Without the monthly plan, domain, hosting, and third-party service costs and management become your responsibility.",
    es: "No. El sitio sigue siendo tuyo. Sin el plan mensual, los costos y la gestión del dominio, alojamiento y servicios externos quedan bajo tu responsabilidad.",
  },
  "Não. A manutenção é separada da hospedagem. O site continua no ar enquanto o domínio e a conta de hospedagem estiverem ativos, e você pode pedir alterações somente quando precisar.": {
    en: "No. Maintenance is separate from hosting. The website stays online while the domain and hosting account remain active, and you can request changes only when needed.",
    es: "No. El mantenimiento es independiente del alojamiento. El sitio sigue online mientras el dominio y la cuenta de alojamiento estén activos, y puedes solicitar cambios solo cuando los necesites.",
  },
  "Como funciona o pagamento?": { en: "How does payment work?", es: "¿Cómo funciona el pago?" },
  "Nos projetos de criação, o pagamento e as etapas ficam definidos na proposta e no contrato. Na manutenção, a cobrança é mensal no cartão e só começa após a assinatura do contrato.": {
    en: "For website projects, payment and milestones are defined in the proposal and contract. Maintenance is billed monthly by card and only starts after the contract is signed.",
    es: "En los proyectos de creación, el pago y las etapas se definen en la propuesta y el contrato. El mantenimiento se cobra mensualmente con tarjeta y solo comienza después de firmar el contrato.",
  },
  "Todos os pacotes têm proposta e contrato eletrônico antes do início. Nos pacotes de criação, combinamos uma parte na contratação e o restante na entrega. A manutenção é uma cobrança mensal no cartão, ativada somente depois da conversa e da assinatura do contrato. Os dados do cartão são preenchidos em uma página de pagamento segura e não ficam armazenados neste site.": {
    en: "Every package includes a proposal and electronic contract before work begins. For website projects, one payment is made when hiring and the remainder upon delivery. Maintenance is billed monthly by card and only starts after our conversation and the contract signature. Card details are entered on a secure payment page and are not stored on this website.",
    es: "Todos los paquetes incluyen una propuesta y un contrato electrónico antes de comenzar. En los proyectos de creación, se paga una parte al contratar y el resto al entregar. El mantenimiento se cobra mensualmente con tarjeta y solo se activa después de la conversación y la firma del contrato. Los datos de la tarjeta se completan en una página de pago segura y no se almacenan en este sitio.",
  },
  "Posso cancelar a manutenção?": { en: "Can I cancel maintenance?", es: "¿Puedo cancelar el mantenimiento?" },
  "Sim. As regras de cancelamento, prazo de aviso e encerramento dos serviços ficam descritas no contrato antes da contratação.": {
    en: "Yes. Cancellation rules, notice periods, and service termination are described in the contract before you sign.",
    es: "Sí. Las reglas de cancelación, el plazo de aviso y el cierre de los servicios se describen en el contrato antes de contratar.",
  },
  "Sim. O cancelamento pode ser solicitado pelo WhatsApp conforme as condições apresentadas antes da assinatura. Em caso de atraso, o atendimento e os novos ajustes podem ser pausados, mas o site não é apagado.": {
    en: "Yes. Cancellation can be requested through WhatsApp under the terms presented before signing. In case of late payment, support and new updates may be paused, but the website is not deleted.",
    es: "Sí. La cancelación puede solicitarse por WhatsApp según las condiciones presentadas antes de la firma. En caso de retraso, la atención y los nuevos ajustes pueden pausarse, pero el sitio no se elimina.",
  },
  "Você faz domínio e hospedagem?": { en: "Do you handle domains and hosting?", es: "¿Gestionas el dominio y el alojamiento?" },
  "Sim. Posso configurar domínio e hospedagem no seu nome. No plano mensal, eu acompanho essa parte técnica; fora dele, você assume as renovações e a gestão depois da entrega.": {
    en: "Yes. I can configure the domain and hosting in your name. With the monthly plan, I manage the technical side; without it, you handle renewals and management after delivery.",
    es: "Sí. Puedo configurar el dominio y el alojamiento a tu nombre. Con el plan mensual, me encargo de la parte técnica; sin él, tú asumes las renovaciones y la gestión después de la entrega.",
  },
  "Sim. A configuração inicial da hospedagem está incluída e tudo fica organizado no seu nome. O domínio tem renovação anual própria. Se o projeto precisar de algum serviço pago adicional, você será informado e aprovará antes, sem cobranças de surpresa.": {
    en: "Yes. The initial hosting setup is included, and everything is organized in your name. The domain has its own annual renewal. If the project requires any additional paid service, you will be informed and approve it in advance, with no surprise charges.",
    es: "Sí. La configuración inicial del alojamiento está incluida y todo queda organizado a tu nombre. El dominio tiene su propia renovación anual. Si el proyecto necesita algún servicio adicional de pago, te informaré y lo aprobarás antes, sin cobros inesperados.",
  },
  "Quer uma página profissional": { en: "Want a professional website", es: "¿Quieres una página profesional" },
  "para o seu negócio?": { en: "for your business?", es: "para tu negocio?" },
  "Vamos conversar. Em poucos minutos eu entendo o que você precisa e monto uma proposta.": {
    en: "Let’s talk. In just a few minutes, I can understand what you need and prepare a proposal.",
    es: "Hablemos. En pocos minutos entiendo lo que necesitas y preparo una propuesta.",
  },
  "Preencher briefing rápido": { en: "Fill out the quick brief", es: "Completar el briefing rápido" },
  "Orçamento": { en: "Quote", es: "Presupuesto" },
  "Conte o que você precisa": { en: "Tell me what you need", es: "Cuéntame qué necesitas" },
  "Peça seu": { en: "Request a", es: "Solicita tu" },
  "orçamento": { en: "quote", es: "presupuesto" },
  "Preencha o essencial e eu te respondo no WhatsApp. Você recebe a proposta e o contrato antes de qualquer cobrança.": {
    en: "Share the essentials and I will reply on WhatsApp. You receive the proposal and contract before any payment.",
    es: "Completa lo esencial y te respondo por WhatsApp. Recibes la propuesta y el contrato antes de cualquier cobro.",
  },
  "Preencha o essencial. Eu organizo as informações e abro o WhatsApp com a mensagem pronta.": {
    en: "Share the essentials. I will organize the details and open WhatsApp with a ready-to-send message.",
    es: "Completa lo esencial. Organizo la información y abro WhatsApp con el mensaje listo.",
  },
  "Nome *": { en: "Name *", es: "Nombre *" },
  "Seu nome": { en: "Your name", es: "Tu nombre" },
  "Nome da empresa": { en: "Company name", es: "Nombre de la empresa" },
  "Sua empresa": { en: "Your company", es: "Tu empresa" },
  "Segmento do negócio *": { en: "Business type *", es: "Tipo de negocio *" },
  "Ex.: barbearia, clínica...": { en: "E.g. barber shop, clinic...", es: "Ej.: barbería, clínica..." },
  "Objetivo do site *": { en: "Website goal *", es: "Objetivo del sitio *" },
  "Ex.: vender mais, captar contatos": { en: "E.g. sell more, generate leads", es: "Ej.: vender más, captar contactos" },
  "Pacote de interesse": { en: "Package of interest", es: "Paquete de interés" },
  "Ainda não sei": { en: "I am not sure yet", es: "Aún no lo sé" },
  "Mensagem adicional": { en: "Additional message", es: "Mensaje adicional" },
  "Conte um pouco mais sobre o que você precisa": {
    en: "Tell me a little more about what you need",
    es: "Cuéntame un poco más sobre lo que necesitas",
  },
  "Enviar e abrir o WhatsApp": { en: "Send and open WhatsApp", es: "Enviar y abrir WhatsApp" },
  "Enviar e abrir o WhatsApp 💬": { en: "Send and open WhatsApp 💬", es: "Enviar y abrir WhatsApp 💬" },
  "Enviando…": { en: "Sending…", es: "Enviando…" },
  "✓ Abrindo o WhatsApp": { en: "✓ Opening WhatsApp", es: "✓ Abriendo WhatsApp" },
  "Abrindo o WhatsApp": { en: "Opening WhatsApp", es: "Abriendo WhatsApp" },
  "Ao enviar, o WhatsApp abre com a sua mensagem já escrita.": {
    en: "After you submit, WhatsApp opens with your message ready.",
    es: "Al enviar, WhatsApp se abre con tu mensaje ya escrito.",
  },
  "🔒 Seus dados são usados para responder ao orçamento pelo WhatsApp. Veja o": {
    en: "🔒 Your data is used to answer your quote request through WhatsApp. Read the",
    es: "🔒 Tus datos se utilizan para responder tu solicitud por WhatsApp. Consulta el",
  },
  "aviso de privacidade": { en: "privacy notice", es: "aviso de privacidad" },
  "Informe seu nome.": { en: "Enter your name.", es: "Escribe tu nombre." },
  "Nome muito curto.": { en: "The name is too short.", es: "El nombre es demasiado corto." },
  "Use apenas letras no nome.": { en: "Use letters only in the name.", es: "Usa solo letras en el nombre." },
  "Nome de empresa muito curto.": { en: "The company name is too short.", es: "El nombre de la empresa es demasiado corto." },
  "Informe seu WhatsApp.": { en: "Enter your WhatsApp number.", es: "Escribe tu número de WhatsApp." },
  "WhatsApp inválido: use DDD + número.": {
    en: "Invalid WhatsApp number: include the area code.",
    es: "Número de WhatsApp inválido: incluye el código de área.",
  },
  "WhatsApp inválido: inclua o código do país e o número.": {
    en: "Invalid WhatsApp number: include the country code and number.",
    es: "Número de WhatsApp inválido: incluye el código de país y el número.",
  },
  "Informe o segmento do negócio.": { en: "Enter your business type.", es: "Indica el tipo de negocio." },
  "Descreva o segmento (mín. 2 letras).": {
    en: "Describe the business type (at least 2 letters).",
    es: "Describe el tipo de negocio (mín. 2 letras).",
  },
  "Informe o objetivo do site.": { en: "Enter the website goal.", es: "Indica el objetivo del sitio." },
  "Descreva melhor o objetivo (mín. 3 letras).": {
    en: "Describe the goal more clearly (at least 3 letters).",
    es: "Describe mejor el objetivo (mín. 3 letras).",
  },
  "Use só letras, números, ponto e _ (ex.: @seuperfil).": {
    en: "Use only letters, numbers, periods, and _ (e.g. @yourprofile).",
    es: "Usa solo letras, números, punto y _ (ej.: @tuperfil).",
  },
  "O @ não pode começar nem terminar com ponto.": {
    en: "The @ handle cannot start or end with a period.",
    es: "El usuario no puede comenzar ni terminar con un punto.",
  },
  "O @ não pode ter dois pontos seguidos.": {
    en: "The @ handle cannot contain two consecutive periods.",
    es: "El usuario no puede tener dos puntos seguidos.",
  },
  "Instagram muito curto para ser um perfil.": {
    en: "The Instagram handle is too short.",
    es: "El usuario de Instagram es demasiado corto.",
  },
  "Mensagem muito longa (máx. 600 caracteres).": {
    en: "The message is too long (600 characters maximum).",
    es: "El mensaje es demasiado largo (máx. 600 caracteres).",
  },
  "Corrija o campo destacado para continuar.": {
    en: "Please correct the highlighted field to continue.",
    es: "Corrige el campo destacado para continuar.",
  },
  "Corrija os {count} campos destacados para continuar.": {
    en: "Please correct the {count} highlighted fields to continue.",
    es: "Corrige los {count} campos destacados para continuar.",
  },
  "Também quero": { en: "I also want", es: "También quiero" },
  "manutenção mensal": { en: "monthly maintenance", es: "mantenimiento mensual" },
  "(R$ 149/mês): cuidados com a hospedagem e até 2 solicitações simples por mês. A cobrança no cartão só é ativada após a assinatura do contrato.": {
    en: "(BRL 149/month): hosting management and up to 2 simple requests per month. Card billing only starts after the contract is signed.",
    es: "(R$ 149/mes): gestión del alojamiento y hasta 2 solicitudes simples al mes. El cobro con tarjeta solo se activa después de firmar el contrato.",
  },
  "Serviços": { en: "Services", es: "Servicios" },
  "Processo": { en: "Process", es: "Proceso" },
  "Abrir menu": { en: "Open menu", es: "Abrir menú" },
  "Menu principal": { en: "Main menu", es: "Menú principal" },
  "Navegação": { en: "Navigation", es: "Navegación" },
  "Idioma": { en: "Language", es: "Idioma" },
  "Selecionar idioma": { en: "Select language", es: "Seleccionar idioma" },
  "Português do Brasil": { en: "Brazilian Portuguese", es: "Portugués de Brasil" },
  "Modo claro / escuro": { en: "Light / dark mode", es: "Modo claro / oscuro" },
  "Animações": { en: "Motion", es: "Animaciones" },
  "Qualidade da experiência visual": { en: "Visual experience quality", es: "Calidad de la experiencia visual" },
  "Máxima": { en: "High", es: "Máxima" },
  "Média": { en: "Medium", es: "Media" },
  "Leve": { en: "Light", es: "Ligera" },
  "Qualidade máxima": { en: "Full quality", es: "Calidad máxima" },
  "Equilibrada": { en: "Balanced", es: "Equilibrada" },
  "Experiência otimizada": { en: "Optimized experience", es: "Experiencia optimizada" },
  "máxima": { en: "high", es: "máxima" },
  "equilibrada": { en: "balanced", es: "equilibrada" },
  "leve": { en: "light", es: "ligera" },
  "essencial": { en: "essential", es: "esencial" },
  "Sistema reduzido": { en: "System reduced motion", es: "Movimiento reducido del sistema" },
  "Detectado": { en: "Detected", es: "Detectado" },
  "Aplicando...": { en: "Applying...", es: "Aplicando..." },
  "Privacidade": { en: "Privacy", es: "Privacidad" },
  "Todos os direitos reservados.": { en: "All rights reserved.", es: "Todos los derechos reservados." },
  "Explorar cortes": { en: "Explore haircuts", es: "Explorar cortes" },
  "Ver evolução": { en: "View progress", es: "Ver evolución" },
  "Abrir cardápio": { en: "Open menu", es: "Abrir menú" },
  "Montar treino": { en: "Build a workout", es: "Crear entrenamiento" },
  "Abrir vitrine": { en: "Open storefront", es: "Abrir escaparate" },
  "Fazer diagnóstico": { en: "Run assessment", es: "Hacer diagnóstico" },
  "Barbearia": { en: "Barber shop", es: "Barbería" },
  "Clínica de estética": { en: "Aesthetic clinic", es: "Clínica estética" },
  "Restaurante": { en: "Restaurant", es: "Restaurante" },
  "Personal trainer": { en: "Personal trainer", es: "Entrenador personal" },
  "Loja local": { en: "Local store", es: "Tienda local" },
  "Consultor": { en: "Consultant", es: "Consultor" },
  "Estilo urbano e moderno": { en: "Urban and modern", es: "Estilo urbano y moderno" },
  "Elegante e confiável": { en: "Elegant and trustworthy", es: "Elegante y confiable" },
  "Apetitoso e direto": { en: "Enticing and direct", es: "Apetitoso y directo" },
  "Energético e motivador": { en: "Energetic and motivating", es: "Enérgico y motivador" },
  "Vitrine que vende": { en: "A storefront that sells", es: "Un escaparate que vende" },
  "Autoridade e clareza": { en: "Authority and clarity", es: "Autoridad y claridad" },
  "Foco em agendamento rápido, fotos de cortes e botão direto pro WhatsApp.": {
    en: "Focused on quick bookings, haircut photos, and direct WhatsApp contact.",
    es: "Enfocado en reservas rápidas, fotos de cortes y contacto directo por WhatsApp.",
  },
  "Tons suaves, lista de procedimentos e prova de resultados.": {
    en: "Soft tones, a treatment list, and clear proof of results.",
    es: "Tonos suaves, lista de procedimientos y prueba de resultados.",
  },
  "Cardápio em destaque, localização no mapa e pedidos por WhatsApp.": {
    en: "A featured menu, map location, and orders through WhatsApp.",
    es: "Menú destacado, ubicación en el mapa y pedidos por WhatsApp.",
  },
  "Planos de treino, depoimentos e chamada forte para agendar avaliação.": {
    en: "Training plans, testimonials, and a strong call to book an assessment.",
    es: "Planes de entrenamiento, testimonios y una llamada clara para agendar una evaluación.",
  },
  "Produtos em destaque, novidades e contato rápido para reservar.": {
    en: "Featured products, new arrivals, and quick contact for reservations.",
    es: "Productos destacados, novedades y contacto rápido para reservar.",
  },
  "Apresentação profissional, serviços e formulário para captar contatos.": {
    en: "Professional presentation, services, and a lead capture form.",
    es: "Presentación profesional, servicios y formulario para captar contactos.",
  },
  "Fechar": { en: "Close", es: "Cerrar" },
  "Anterior": { en: "Previous", es: "Anterior" },
  "Próximo": { en: "Next", es: "Siguiente" },
  "Frente": { en: "Front", es: "Frente" },
  "Lateral": { en: "Side", es: "Lateral" },
  "Lateral esquerda": { en: "Left side", es: "Lateral izquierdo" },
  "Lateral direita": { en: "Right side", es: "Lateral derecho" },
  "Nuca": { en: "Back", es: "Nuca" },
  "Topo": { en: "Top", es: "Parte superior" },
  "Ver todos os ângulos": { en: "View every angle", es: "Ver todos los ángulos" },
  "Todos os cortes": { en: "All haircuts", es: "Todos los cortes" },
  "Escolha sua próxima versão": { en: "Choose your next look", es: "Elige tu próximo estilo" },
  "Arraste para explorar. Toque em um corte para entrar.": {
    en: "Drag to explore. Tap a haircut to open it.",
    es: "Arrastra para explorar. Toca un corte para abrirlo.",
  },
  "Coleção de cortes · 2026": { en: "Haircut collection · 2026", es: "Colección de cortes · 2026" },
  "Cortes vistos": { en: "Haircuts seen", es: "Cortes vistos" },
  "por todos os lados.": { en: "from every angle.", es: "desde todos los ángulos." },
  "Quero um catálogo assim": { en: "I want a catalog like this", es: "Quiero un catálogo así" },
  "Textura marcada no topo com degradê baixo e acabamento natural.": {
    en: "Defined texture on top with a low fade and natural finish.",
    es: "Textura definida arriba, degradado bajo y acabado natural.",
  },
  "Volume natural, linha frontal precisa e transição limpa nas laterais.": {
    en: "Natural volume, a precise hairline, and clean side transitions.",
    es: "Volumen natural, línea frontal precisa y transición limpia en los laterales.",
  },
  "Cachos definidos, contraste equilibrado e fade suave ao redor.": {
    en: "Defined curls, balanced contrast, and a soft fade all around.",
    es: "Rizos definidos, contraste equilibrado y degradado suave alrededor.",
  },
  "Risco clássico, volume controlado e laterais graduais com elegância.": {
    en: "Classic part, controlled volume, and elegantly tapered sides.",
    es: "Raya clásica, volumen controlado y laterales graduales con elegancia.",
  },
  "Baixo · Texturizado": { en: "Low · Textured", es: "Bajo · Texturizado" },
  "Médio · Definido": { en: "Medium · Defined", es: "Medio · Definido" },
  "Médio · Cacheado": { en: "Medium · Curly", es: "Medio · Rizado" },
  "Clássico · Social": { en: "Classic · Formal", es: "Clásico · Formal" },
  "Peça disponível": { en: "Item available", es: "Pieza disponible" },
  "Uma loja demonstrativa para mostrar produtos, valores e personalidade antes mesmo da primeira mensagem.": {
    en: "A demo store designed to showcase products, values, and personality before the first message.",
    es: "Una tienda demostrativa para mostrar productos, valores y personalidad antes del primer mensaje.",
  },
  "Produtos, marca e valores são ilustrativos.": {
    en: "Products, brand, and prices are illustrative.",
    es: "Los productos, la marca y los precios son ilustrativos.",
  },
  "Quero uma vitrine assim": { en: "I want a storefront like this", es: "Quiero un escaparate así" },
  "Sua marca": { en: "Your brand", es: "Tu marca" },
  "Reproduzir evolução": { en: "Play progress", es: "Reproducir evolución" },
  "Pausar evolução": { en: "Pause progress", es: "Pausar evolución" },
  "Leitura atual": { en: "Current reading", es: "Lectura actual" },
  "Etapas do protocolo": { en: "Protocol stages", es: "Etapas del protocolo" },
  "Leitura inicial": { en: "Initial reading", es: "Lectura inicial" },
  "Início": { en: "Start", es: "Inicio" },
  "Plano de cuidado": { en: "Care plan", es: "Plan de cuidado" },
  "Mapa": { en: "Map", es: "Mapa" },
  "Procedimento": { en: "Treatment", es: "Procedimiento" },
  "Ação": { en: "Treatment", es: "Acción" },
  "Recuperação": { en: "Recovery", es: "Recuperación" },
  "Pausa": { en: "Recovery", es: "Pausa" },
  "Resultado": { en: "Result", es: "Resultado" },
  "Final": { en: "Final", es: "Final" },
  "Mapeamento de textura, oleosidade e pontos de sensibilidade.": {
    en: "Mapping texture, oiliness, and sensitive areas.",
    es: "Mapeo de textura, oleosidad y zonas sensibles.",
  },
  "A estratégia visualiza regiões e organiza o protocolo indicado.": {
    en: "The plan maps each area and organizes the recommended protocol.",
    es: "La estrategia visualiza las zonas y organiza el protocolo indicado.",
  },
  "Aplicação controlada com acompanhamento de cada área tratada.": {
    en: "Controlled application with monitoring of every treated area.",
    es: "Aplicación controlada con seguimiento de cada zona tratada.",
  },
  "A pele entra na fase de renovação com orientação pós-cuidado.": {
    en: "The skin enters its renewal phase with aftercare guidance.",
    es: "La piel entra en la fase de renovación con orientación posterior.",
  },
  "Textura mais uniforme e evolução registrada de forma transparente.": {
    en: "More even texture, with progress documented transparently.",
    es: "Textura más uniforme y evolución registrada de forma transparente.",
  },
  "Leitura ilustrativa da imagem · não é avaliação clínica.": {
    en: "Illustrative image reading · not a clinical assessment.",
    es: "Lectura ilustrativa de la imagen · no es una evaluación clínica.",
  },
  "Escolha o nível": { en: "Choose a level", es: "Elige el nivel" },
  "Começar desafio": { en: "Start challenge", es: "Comenzar desafío" },
  "Escolha o nível e comece.": { en: "Choose a level and start.", es: "Elige el nivel y comienza." },
  "Toque nos alvos assim que eles aparecerem. A experiência mede sua velocidade de reação em tempo real.": {
    en: "Tap each target as soon as it appears. The experience measures your reaction speed in real time.",
    es: "Toca cada objetivo en cuanto aparezca. La experiencia mide tu velocidad de reacción en tiempo real.",
  },
  "Use o mouse ou toque na tela · nenhum dado é armazenado.": {
    en: "Use your mouse or tap the screen · no data is stored.",
    es: "Usa el ratón o toca la pantalla · no se almacena ningún dato.",
  },
  "O alvo muda de posição a cada toque.": {
    en: "The target changes position after every tap.",
    es: "El objetivo cambia de posición con cada toque.",
  },
  "Melhor reação": { en: "Best reaction", es: "Mejor reacción" },
  "Escolha o foco. O mapa reorganiza prioridades e revela uma direção possível para o negócio.": {
    en: "Choose a focus. The map reorganizes priorities and reveals a possible direction for the business.",
    es: "Elige un enfoque. El mapa reorganiza prioridades y revela una posible dirección para el negocio.",
  },
  "Ser mais lembrado": { en: "Build brand recognition", es: "Ser más recordado" },
  "Crescer sem caos": { en: "Grow without chaos", es: "Crecer sin caos" },
  "Vender com clareza": { en: "Sell with clarity", es: "Vender con claridad" },
  "Gerar plano de 30 dias": { en: "Generate a 30-day plan", es: "Generar plan de 30 días" },
  "Quero isso no meu site": { en: "I want this on my website", es: "Quiero esto en mi sitio" },
  "Modelo demonstrativo · Restaurante": { en: "Demo concept · Restaurant", es: "Modelo demostrativo · Restaurante" },
  "Modelo demonstrativo": { en: "Demo concept", es: "Modelo demostrativo" },
  "A casa": { en: "Our story", es: "La casa" },
  "Cardápio": { en: "Menu", es: "Menú" },
  "Bebidas": { en: "Drinks", es: "Bebidas" },
  "Seu": { en: "Your", es: "Tu" },
  "Cardápio digital personalizado": { en: "Custom digital menu", es: "Menú digital personalizado" },
  "Uma apresentação feita para abrir o apetite.": {
    en: "A presentation designed to whet the appetite.",
    es: "Una presentación hecha para abrir el apetito.",
  },
  "Clique para abrir": { en: "Click to open", es: "Haz clic para abrir" },
  "Sua cidade · 2026": { en: "Your city · 2026", es: "Tu ciudad · 2026" },
  "Identidade e cozinha personalizadas": { en: "Custom identity and cuisine", es: "Identidad y cocina personalizadas" },
  "Ingredientes próximos, fogo aceso e uma mesa feita para ficar.": {
    en: "Local ingredients, an open flame, and a table made for lingering.",
    es: "Ingredientes cercanos, fuego encendido y una mesa hecha para quedarse.",
  },
  "Ter–Sáb": { en: "Tue–Sat", es: "Mar–Sáb" },
  "Domingo": { en: "Sunday", es: "Domingo" },
  "Reserva": { en: "Booking", es: "Reserva" },
  "Online": { en: "Online", es: "Online" },
  "Menu · Outono": { en: "Menu · Autumn", es: "Menú · Otoño" },
  "Valores ilustrativos": { en: "Illustrative prices", es: "Precios ilustrativos" },
  "Para começar": { en: "To start", es: "Para comenzar" },
  "Pão da casa": { en: "House bread", es: "Pan de la casa" },
  "Fermentação natural, manteiga tostada": { en: "Naturally fermented, toasted butter", es: "Fermentación natural, mantequilla tostada" },
  "Croqueta de costela": { en: "Beef rib croquette", es: "Croqueta de costilla" },
  "Mostarda de rapadura, picles de cebola": { en: "Raw sugar mustard, pickled onion", es: "Mostaza de panela, cebolla encurtida" },
  "Burrata da estação": { en: "Seasonal burrata", es: "Burrata de temporada" },
  "Tomates assados, manjericão, castanhas": { en: "Roasted tomatoes, basil, nuts", es: "Tomates asados, albahaca y frutos secos" },
  "Da cozinha": { en: "From the kitchen", es: "De la cocina" },
  "Arroz do mar": { en: "Seafood rice", es: "Arroz del mar" },
  "Camarão, lula, peixe fresco e aioli de limão": { en: "Shrimp, squid, fresh fish, and lemon aioli", es: "Camarón, calamar, pescado fresco y alioli de limón" },
  "Nhoque de mandioquinha": { en: "Arracacha gnocchi", es: "Ñoquis de arracacha" },
  "Cogumelos, queijo curado e ervas": { en: "Mushrooms, aged cheese, and herbs", es: "Hongos, queso curado y hierbas" },
  "Peixe na brasa": { en: "Chargrilled fish", es: "Pescado a la brasa" },
  "Purê defumado, legumes e molho de moqueca": { en: "Smoked purée, vegetables, and moqueca sauce", es: "Puré ahumado, vegetales y salsa de moqueca" },
  "Da casa": { en: "House creations", es: "De la casa" },
  "Tônica da casa": { en: "House tonic", es: "Tónica de la casa" },
  "Gin, cambuci, tônica e alecrim": { en: "Gin, cambuci fruit, tonic, and rosemary", es: "Gin, cambuci, tónica y romero" },
  "Caju alto": { en: "Tall cashew", es: "Cajú alto" },
  "Cachaça, caju, limão e espuma de gengibre": { en: "Cachaça, cashew, lime, and ginger foam", es: "Cachaça, cajú, limón y espuma de jengibre" },
  "Brisa zero": { en: "Zero breeze", es: "Brisa cero" },
  "Uva branca, manjericão e água com gás": { en: "White grape, basil, and sparkling water", es: "Uva blanca, albahaca y agua con gas" },
  "Final feliz": { en: "Sweet ending", es: "Final feliz" },
  "Pudim de cumaru": { en: "Tonka bean flan", es: "Flan de cumarú" },
  "Chocolate e café": { en: "Chocolate and coffee", es: "Chocolate y café" },
  "Frutas, coco e limão": { en: "Fruit, coconut, and lime", es: "Frutas, coco y limón" },
  "Bar & sobremesas": { en: "Bar & desserts", es: "Bar y postres" },
  "Beba com moderação": { en: "Drink responsibly", es: "Bebe con moderación" },
  "Opções sem álcool e adaptações alimentares disponíveis.": {
    en: "Alcohol-free options and dietary adaptations are available.",
    es: "Hay opciones sin alcohol y adaptaciones alimentarias disponibles.",
  },
  "Quero um site assim": { en: "I want a website like this", es: "Quiero un sitio así" },
  "Iluminação artesanal": { en: "Handcrafted lighting", es: "Iluminación artesanal" },
  "Luz portátil": { en: "Portable light", es: "Luz portátil" },
  "Cerâmica iluminada": { en: "Illuminated ceramic", es: "Cerámica iluminada" },
  "Bem-estar": { en: "Wellness", es: "Bienestar" },
  "Adicionar": { en: "Add", es: "Añadir" },
  "Vitrine": { en: "Neighborhood", es: "Vitrina" },
  "de Bairro": { en: "Storefront", es: "del Barrio" },
  "Tema": { en: "Theme", es: "Tema" },
  "Luz": { en: "Light", es: "Luz" },
  "Seleção": { en: "Selection", es: "Selección" },
  "Coleção 01 · Feita por perto": { en: "Collection 01 · Made nearby", es: "Colección 01 · Hecha cerca" },
  "Objetos com história.": { en: "Objects with a story.", es: "Objetos con historia." },
  "Vitrine com presença.": { en: "A storefront with presence.", es: "Un escaparate con presencia." },
  "Entrega local · Retirada no bairro": { en: "Local delivery · Neighborhood pickup", es: "Entrega local · Retiro en el barrio" },
  "Jornada de cuidado": { en: "Care journey", es: "Proceso de cuidado" },
  "Evolução que": { en: "Progress that", es: "Evolución que" },
  "você consegue ver.": { en: "you can see.", es: "puedes ver." },
  "Arraste pelas etapas e acompanhe como uma clínica pode apresentar o processo com clareza, cuidado e confiança.": {
    en: "Move through the stages and see how a clinic can present its process with clarity, care, and confidence.",
    es: "Recorre las etapas y descubre cómo una clínica puede presentar el proceso con claridad, cuidado y confianza.",
  },
  "CLIQUE PARA ANALISAR": { en: "CLICK TO ANALYZE", es: "HAZ CLIC PARA ANALIZAR" },
  "ANÁLISE 01—05": { en: "ANALYSIS 01—05", es: "ANÁLISIS 01—05" },
  "PROTOCOLO DIGITAL · 01": { en: "DIGITAL PROTOCOL · 01", es: "PROTOCOLO DIGITAL · 01" },
  "Imagens demonstrativas geradas para esta experiência.": {
    en: "Demo images created for this experience.",
    es: "Imágenes demostrativas creadas para esta experiencia.",
  },
  "LEITURA CAPTURADA": { en: "READING CAPTURED", es: "LECTURA CAPTURADA" },
  "Textura visual": { en: "Visual texture", es: "Textura visual" },
  "Uniformidade": { en: "Uniformity", es: "Uniformidad" },
  "Etapa": { en: "Stage", es: "Etapa" },
  "Escolher etapa do tratamento": { en: "Choose a treatment stage", es: "Elegir etapa del tratamiento" },
  "Fora da área facial": { en: "Outside the facial area", es: "Fuera del área facial" },
  "Região frontal": { en: "Forehead area", es: "Región frontal" },
  "Mandíbula e mento": { en: "Jawline and chin", es: "Mandíbula y mentón" },
  "Região malar direita": { en: "Right cheek area", es: "Región malar derecha" },
  "Região malar esquerda": { en: "Left cheek area", es: "Región malar izquierda" },
  "Colo e ombros": { en: "Neck and shoulders", es: "Escote y hombros" },
  "TESTE DE AGILIDADE": { en: "AGILITY TEST", es: "PRUEBA DE AGILIDAD" },
  "DESAFIO / 15 SEGUNDOS": { en: "CHALLENGE / 15 SECONDS", es: "DESAFÍO / 15 SEGUNDOS" },
  "Até onde vai": { en: "How sharp is", es: "¿Hasta dónde llega" },
  "seu reflexo?": { en: "your reaction?", es: "tu reflejo?" },
  "Ritmo": { en: "Rhythm", es: "Ritmo" },
  "Ágil": { en: "Fast", es: "Ágil" },
  "TEMPO": { en: "TIME", es: "TIEMPO" },
  "ACERTOS": { en: "HITS", es: "ACIERTOS" },
  "TOQUE": { en: "TAP", es: "TOCA" },
  "PRONTO?": { en: "READY?", es: "¿LISTO?" },
  "LEITURA AO VIVO": { en: "LIVE READING", es: "LECTURA EN VIVO" },
  "REAÇÃO MÉDIA": { en: "AVERAGE REACTION", es: "REACCIÓN MEDIA" },
  "Precisão": { en: "Accuracy", es: "Precisión" },
  "SEU RESULTADO": { en: "YOUR RESULT", es: "TU RESULTADO" },
  "Reflexo afiado.": { en: "Sharp reflexes.", es: "Reflejos rápidos." },
  "Você concluiu o teste.": { en: "You completed the test.", es: "Completaste la prueba." },
  "Esquerda!": { en: "Left!", es: "¡Izquierda!" },
  "Direita!": { en: "Right!", es: "¡Derecha!" },
  "Acima!": { en: "Up!", es: "¡Arriba!" },
  "Centro!": { en: "Center!", es: "¡Centro!" },
  "Jogar novamente": { en: "Play again", es: "Jugar de nuevo" },
  "Reflexo de elite.": { en: "Elite reflexes.", es: "Reflejos de élite." },
  "Resposta afiada.": { en: "Sharp response.", es: "Respuesta rápida." },
  "Boa primeira marca.": { en: "Strong first score.", es: "Buen primer resultado." },
  "Teste concluído.": { en: "Test complete.", es: "Prueba completada." },
  "Uma pergunta para começar": { en: "One question to begin", es: "Una pregunta para comenzar" },
  "DIAGNÓSTICO VIVO · SESSÃO 01": { en: "LIVE ASSESSMENT · SESSION 01", es: "DIAGNÓSTICO EN VIVO · SESIÓN 01" },
  "O que precisa": { en: "What needs to", es: "¿Qué necesitas" },
  "destravar agora?": { en: "move forward now?", es: "desbloquear ahora?" },
  "NEGÓCIO": { en: "BUSINESS", es: "NEGOCIO" },
  "OFERTA": { en: "OFFER", es: "OFERTA" },
  "MARCA": { en: "BRAND", es: "MARCA" },
  "CANAL": { en: "CHANNEL", es: "CANAL" },
  "RITMO": { en: "PACE", es: "RITMO" },
  "MAPA / EM CONSTRUÇÃO": { en: "MAP / IN PROGRESS", es: "MAPA / EN CONSTRUCCIÓN" },
  "Direção sugerida": { en: "Suggested direction", es: "Dirección sugerida" },
  "Motor comercial": { en: "Sales engine", es: "Motor comercial" },
  "Organizar a jornada para transformar atenção em conversas qualificadas.": {
    en: "Organize the journey to turn attention into qualified conversations.",
    es: "Organizar el recorrido para convertir la atención en conversaciones calificadas.",
  },
  "Oferta central": { en: "Core offer", es: "Oferta central" },
  "Prova de valor": { en: "Proof of value", es: "Prueba de valor" },
  "Rota de conversão": { en: "Conversion path", es: "Ruta de conversión" },
  "Reescrever a oferta principal": { en: "Rewrite the main offer", es: "Reescribir la oferta principal" },
  "Publicar três provas de valor": { en: "Publish three proofs of value", es: "Publicar tres pruebas de valor" },
  "Simplificar o caminho até o contato": { en: "Simplify the path to contact", es: "Simplificar el camino al contacto" },
  "Território de marca": { en: "Brand territory", es: "Territorio de marca" },
  "Criar uma presença reconhecível antes de acelerar aquisição.": {
    en: "Build a recognizable presence before accelerating acquisition.",
    es: "Crear una presencia reconocible antes de acelerar la adquisición.",
  },
  "Posicionamento": { en: "Positioning", es: "Posicionamiento" },
  "Narrativa própria": { en: "Distinctive narrative", es: "Narrativa propia" },
  "Sistema visual": { en: "Visual system", es: "Sistema visual" },
  "Definir um território de marca": { en: "Define a brand territory", es: "Definir un territorio de marca" },
  "Criar uma narrativa reconhecível": { en: "Create a recognizable narrative", es: "Crear una narrativa reconocible" },
  "Aplicar o sistema nos pontos de contato": { en: "Apply the system across touchpoints", es: "Aplicar el sistema en los puntos de contacto" },
  "Sistema de escala": { en: "Scalable system", es: "Sistema de escala" },
  "Reduzir atrito interno para crescer com clareza e consistência.": {
    en: "Reduce internal friction to grow with clarity and consistency.",
    es: "Reducir la fricción interna para crecer con claridad y consistencia.",
  },
  "Processos-chave": { en: "Key processes", es: "Procesos clave" },
  "Automação leve": { en: "Light automation", es: "Automatización ligera" },
  "Ritmo de gestão": { en: "Management cadence", es: "Ritmo de gestión" },
  "Mapear o processo mais crítico": { en: "Map the most critical process", es: "Mapear el proceso más crítico" },
  "Automatizar uma tarefa repetitiva": { en: "Automate one repetitive task", es: "Automatizar una tarea repetitiva" },
  "Criar um ritual semanal de decisão": { en: "Create a weekly decision ritual", es: "Crear un ritual semanal de decisión" },
  "HIPÓTESE INICIAL · NÃO É UMA CONSULTORIA REAL": {
    en: "INITIAL HYPOTHESIS · NOT REAL CONSULTING",
    es: "HIPÓTESIS INICIAL · NO ES UNA CONSULTORÍA REAL",
  },
  "PLANO DE 30 DIAS GERADO": { en: "30-DAY PLAN GENERATED", es: "PLAN DE 30 DÍAS GENERADO" },
  "ROTA / 30 DIAS": { en: "ROADMAP / 30 DAYS", es: "RUTA / 30 DÍAS" },
  "PLANO GERADO PARA": { en: "PLAN GENERATED FOR", es: "PLAN GENERADO PARA" },
  "Próxima revisão": { en: "Next review", es: "Próxima revisión" },
  "EM 30 DIAS": { en: "IN 30 DAYS", es: "EN 30 DÍAS" },
  "Abrir catálogo demonstrativo de cortes de cabelo": {
    en: "Open demo haircut catalog",
    es: "Abrir catálogo demostrativo de cortes de cabello",
  },
  "Abrir cardápio demonstrativo de restaurante": {
    en: "Open the restaurant menu demo",
    es: "Abrir la demostración de menú de restaurante",
  },
  "Abrir vitrine demonstrativa de loja": {
    en: "Open the store demo",
    es: "Abrir la demostración de tienda",
  },
  "Abrir análise demonstrativa de clínica de estética": {
    en: "Open the aesthetic clinic analysis demo",
    es: "Abrir el análisis demostrativo de clínica estética",
  },
  "Abrir experiência demonstrativa de personal trainer": {
    en: "Open the personal trainer experience demo",
    es: "Abrir la experiencia demostrativa de entrenador personal",
  },
  "Abrir diagnóstico demonstrativo de consultoria": {
    en: "Open the consulting assessment demo",
    es: "Abrir el diagnóstico demostrativo de consultoría",
  },
  "Abrir modelo de cardápio para restaurante": {
    en: "Open restaurant menu demo",
    es: "Abrir modelo de menú para restaurante",
  },
  "Abrir modelo de vitrine para loja local": {
    en: "Open local store demo",
    es: "Abrir modelo de escaparate para tienda local",
  },
  "Abrir o cardápio demonstrativo": { en: "Open the demo menu", es: "Abrir el menú demostrativo" },
  "Ângulo anterior": { en: "Previous angle", es: "Ángulo anterior" },
  "Próximo ângulo": { en: "Next angle", es: "Siguiente ángulo" },
  "Aparência da vitrine": { en: "Storefront appearance", es: "Apariencia del escaparate" },
  "Área do teste de reflexo": { en: "Reaction test area", es: "Área de la prueba de reflejos" },
  "Detalhes do pacote": { en: "Package details", es: "Detalles del paquete" },
  "Fechar análise": { en: "Close analysis", es: "Cerrar análisis" },
  "Fechar cardápio": { en: "Close menu", es: "Cerrar menú" },
  "Fechar catálogo de cortes": { en: "Close haircut catalog", es: "Cerrar catálogo de cortes" },
  "Fechar diagnóstico": { en: "Close assessment", es: "Cerrar diagnóstico" },
  "Fechar treino": { en: "Close workout", es: "Cerrar entrenamiento" },
  "Fechar vitrine": { en: "Close storefront", es: "Cerrar escaparate" },
  "Foco do diagnóstico": { en: "Assessment focus", es: "Enfoque del diagnóstico" },
  "Ilustração de uma mesa posta": { en: "Illustration of a set table", es: "Ilustración de una mesa servida" },
  "Lúmina clínica demonstrativa": { en: "Lúmina demo clinic", es: "Clínica demostrativa Lúmina" },
  "Mapa estratégico interativo": { en: "Interactive strategy map", es: "Mapa estratégico interactivo" },
  "Nível do desafio": { en: "Challenge level", es: "Nivel del desafío" },
  "Plano estratégico de 30 dias": { en: "30-day strategic plan", es: "Plan estratégico de 30 días" },
  "Rodapé": { en: "Footer", es: "Pie de página" },
  "Seções do cardápio": { en: "Menu sections", es: "Secciones del menú" },
  "Voltar ao diagnóstico": { en: "Back to assessment", es: "Volver al diagnóstico" },
  "Acender luzes da vitrine": { en: "Turn on storefront lights", es: "Encender las luces del escaparate" },
  "Alternar modo claro e escuro": { en: "Switch between light and dark mode", es: "Alternar entre modo claro y oscuro" },
  "Alternar tema da vitrine": { en: "Switch storefront theme", es: "Alternar tema del escaparate" },
  "Atingir alvo": { en: "Hit target", es: "Tocar objetivo" },
  "Cortes disponíveis": { en: "Available haircuts", es: "Cortes disponibles" },
  "Fechar experiência": { en: "Close experience", es: "Cerrar experiencia" },
  "Mover o scanner e clicar para capturar uma leitura da pele": {
    en: "Move the scanner and click to capture a skin reading",
    es: "Mueve el escáner y haz clic para capturar una lectura de la piel",
  },
  "Produtos demonstrativos": { en: "Demo products", es: "Productos demostrativos" },
};

const metadata: Record<Locale, {
  title: string;
  description: string;
  socialDescription: string;
  imageAlt: string;
}> = {
  "pt-BR": {
    title: "AMV Web Studio | Sites profissionais para negócios locais",
    description: "Criação de sites e páginas profissionais para negócios locais, com WhatsApp, serviços, localização, formulário e visual responsivo.",
    socialDescription: "Sites rápidos, bonitos e responsivos para negócios locais venderem mais e transmitirem confiança.",
    imageAlt: "AMV Web Studio — sites profissionais para negócios locais",
  },
  en: {
    title: "AMV Web Studio | Professional websites for local businesses",
    description: "Professional websites for local businesses, with WhatsApp, services, location, contact forms, and responsive design.",
    socialDescription: "Fast, polished, responsive websites that help local businesses sell more and build trust.",
    imageAlt: "AMV Web Studio — professional websites for local businesses",
  },
  es: {
    title: "AMV Web Studio | Sitios web profesionales para negocios locales",
    description: "Sitios web profesionales para negocios locales, con WhatsApp, servicios, ubicación, formulario y diseño adaptable.",
    socialDescription: "Sitios rápidos, atractivos y adaptables para que los negocios locales vendan más y transmitan confianza.",
    imageAlt: "AMV Web Studio — sitios web profesionales para negocios locales",
  },
};

const patterns: Array<{
  source: RegExp;
  replace: Record<ForeignLocale, (...matches: string[]) => string>;
}> = [
  {
    source: /^Corrija os (\d+) campos destacados para continuar\.$/,
    replace: {
      en: (count) => `Please correct the ${count} highlighted fields to continue.`,
      es: (count) => `Corrige los ${count} campos destacados para continuar.`,
    },
  },
  {
    source: /^Ir para item (\d+)$/,
    replace: {
      en: (item) => `Go to item ${item}`,
      es: (item) => `Ir al elemento ${item}`,
    },
  },
  {
    source: /^(\d+) alvos em 15 segundos · média de (.+) ms\.$/,
    replace: {
      en: (hits, average) => `${hits} targets in 15 seconds · ${average} ms average.`,
      es: (hits, average) => `${hits} objetivos en 15 segundos · media de ${average} ms.`,
    },
  },
  {
    source: /^Adicionar (.+) à seleção$/,
    replace: {
      en: (item) => `Add ${item} to the selection`,
      es: (item) => `Añadir ${item} a la selección`,
    },
  },
  {
    source: /^Modelo com o corte (.+)$/,
    replace: {
      en: (name) => `Model with the ${name} haircut`,
      es: (name) => `Modelo con el corte ${name}`,
    },
  },
  {
    source: /^Ângulos do corte (.+)$/,
    replace: {
      en: (name) => `Angles of the ${name} haircut`,
      es: (name) => `Ángulos del corte ${name}`,
    },
  },
  {
    source: /^Selecionar ângulo de (.+)$/,
    replace: {
      en: (name) => `Select an angle for ${name}`,
      es: (name) => `Seleccionar ángulo de ${name}`,
    },
  },
  {
    source: /^(\d+) de (\d+): (.+)$/,
    replace: {
      en: (current, total, name) => `${current} of ${total}: ${name}`,
      es: (current, total, name) => `${current} de ${total}: ${name}`,
    },
  },
  {
    source: /^© (\d{4}) (.+)\. Todos os direitos reservados\.$/,
    replace: {
      en: (year, brand) => `© ${year} ${brand}. All rights reserved.`,
      es: (year, brand) => `© ${year} ${brand}. Todos los derechos reservados.`,
    },
  },
  {
    source: /^(.+), ângulo (\d+) de (\d+)$/,
    replace: {
      en: (label, current, total) => `${translateText(label, "en")}, angle ${current} of ${total}`,
      es: (label, current, total) => `${translateText(label, "es")}, ángulo ${current} de ${total}`,
    },
  },
  {
    source: /^Abrir (.+)$/,
    replace: {
      en: (subject) => `Open ${translateText(subject, "en")}`,
      es: (subject) => `Abrir ${translateText(subject, "es")}`,
    },
  },
  {
    source: /^Fechar (.+)$/,
    replace: {
      en: (subject) => `Close ${translateText(subject, "en")}`,
      es: (subject) => `Cerrar ${translateText(subject, "es")}`,
    },
  },
  {
    source: /^Ver (.+)$/,
    replace: {
      en: (subject) => `View ${translateText(subject, "en")}`,
      es: (subject) => `Ver ${translateText(subject, "es")}`,
    },
  },
];

export function getLocale(): Locale {
  return activeLocale;
}

export function setLocale(locale: Locale): void {
  if (!SUPPORTED_LOCALES.includes(locale)) return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
    sessionStorage.setItem("amv-skip-intro-once", "1");
  } catch {
    // The selected language still applies after reload when storage is available.
  }
  window.location.reload();
}

export function translateText(source: string, locale: Locale = activeLocale): string {
  if (locale === "pt-BR" || !source) return source;
  const direct = messages[source]?.[locale];
  if (direct) return direct;

  for (const pattern of patterns) {
    const match = source.match(pattern.source);
    if (match) return pattern.replace[locale](...match.slice(1));
  }
  return source;
}

export function formatMessage(
  portuguese: string,
  variables: Record<string, string | number>,
  locale: Locale = activeLocale,
): string {
  let result = translateText(portuguese, locale);
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replaceAll(`{${key}}`, String(value));
  });
  return result;
}

const translateValue = (value: string): string => {
  const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return value;
  const translated = translateText(match[2]);
  return translated === match[2] ? value : `${match[1]}${translated}${match[3]}`;
};

const translatableAttributes = ["aria-label", "title", "placeholder", "alt"] as const;

export function translateTree(root: Node): void {
  if (activeLocale === "pt-BR") return;

  if (root instanceof Text) {
    const parent = root.parentElement;
    if (parent?.closest("script, style, code, pre, [data-no-translate]")) return;
    const translated = translateValue(root.data);
    if (translated !== root.data) root.data = translated;
    return;
  }

  if (!(root instanceof Element) && !(root instanceof DocumentFragment) && !(root instanceof Document)) {
    return;
  }

  if (root instanceof Element) {
    if (root.matches("script, style, code, pre, [data-no-translate]")) return;
    translatableAttributes.forEach((attribute) => {
      const current = root.getAttribute(attribute);
      if (!current) return;
      const translated = translateText(current);
      if (translated !== current) root.setAttribute(attribute, translated);
    });
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
  );
  let node = walker.nextNode();
  while (node) {
    if (node instanceof Text) {
      const parent = node.parentElement;
      if (!parent?.closest("script, style, code, pre, [data-no-translate]")) {
        const translated = translateValue(node.data);
        if (translated !== node.data) node.data = translated;
      }
    } else if (node instanceof Element && !node.matches("script, style, code, pre, [data-no-translate]")) {
      const element = node;
      translatableAttributes.forEach((attribute) => {
        const current = element.getAttribute(attribute);
        if (!current) return;
        const translated = translateText(current);
        if (translated !== current) element.setAttribute(attribute, translated);
      });
    }
    node = walker.nextNode();
  }
}

export function updateLocalizedMetadata(): void {
  const content = metadata[activeLocale];
  document.title = content.title;

  const setMeta = (selector: string, value: string) => {
    document.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", value);
  };
  setMeta('meta[name="description"]', content.description);
  setMeta('meta[property="og:title"]', content.title);
  setMeta('meta[property="og:description"]', content.socialDescription);
  setMeta('meta[property="og:locale"]', activeLocale === "pt-BR" ? "pt_BR" : activeLocale === "en" ? "en_US" : "es_ES");
  setMeta('meta[property="og:image:alt"]', content.imageAlt);
  setMeta('meta[name="twitter:title"]', content.title);
  setMeta('meta[name="twitter:description"]', content.socialDescription);

  const schema = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
  if (schema?.textContent) {
    try {
      const data = JSON.parse(schema.textContent) as Record<string, unknown>;
      data.description = content.description;
      data.serviceType = activeLocale === "pt-BR"
        ? "Criação de sites"
        : activeLocale === "en"
          ? "Website design and development"
          : "Diseño y desarrollo de sitios web";
      const contactPoint = data.contactPoint as Record<string, unknown> | undefined;
      if (contactPoint) {
        contactPoint.availableLanguage = activeLocale === "pt-BR"
          ? ["Portuguese", "English", "Spanish"]
          : ["English", "Spanish", "Portuguese"];
      }
      schema.textContent = JSON.stringify(data);
    } catch {
      // Invalid structured data must never block the page.
    }
  }
}

let observer: MutationObserver | null = null;

export function initI18n(): void {
  updateLocalizedMetadata();
  if (activeLocale === "pt-BR") return;

  translateTree(document.body);
  observer?.disconnect();
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "characterData") {
        translateTree(mutation.target);
        return;
      }
      if (mutation.type === "attributes") {
        translateTree(mutation.target);
        return;
      }
      mutation.addedNodes.forEach(translateTree);
    });
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...translatableAttributes],
  });
}
