# Alan Web Studio — Landing Page

Landing page premium, rápida e responsiva para vender serviços de criação de sites para negócios locais.

Construída com **Vite + TypeScript** e CSS moderno (sem frameworks pesados), seguindo o tema escuro premium da especificação.

## 🚀 Como rodar

```bash
npm install      # instala as dependências (uma vez)
npm run dev      # ambiente de desenvolvimento (http://localhost:5173)
npm run build    # gera a versão de produção em /dist
npm run preview  # visualiza o build de produção
```

> Precisa do [Node.js](https://nodejs.org) 18+ instalado.

## ✏️ O que editar (sem mexer no layout)

Todo o conteúdo fica separado em `src/data/`:

| Arquivo | O que contém |
|---|---|
| `src/data/site.ts` | **Número do WhatsApp**, Instagram, e-mail, marca |
| `src/data/packages.ts` | Pacotes, preços e o destaque (`featured`) |
| `src/data/faq.ts` | Perguntas e respostas |
| `src/data/portfolio.ts` | Modelos demonstrativos |
| `src/data/content.ts` | Serviços, problemas, solução, processo |

> ⚠️ **Primeiro passo:** abra `src/data/site.ts` e troque `whatsapp` pelo seu número real
> (formato internacional, só dígitos — ex.: `5511987654321`).

## 🧱 Estrutura

```
index.html              # SEO, meta tags, fontes
src/
  main.ts               # monta as seções na ordem e inicializa interações
  style.css             # design system completo (paleta, gradientes, componentes)
  components/           # cada seção da página
  data/                 # conteúdo editável
  lib/
    whatsapp.ts         # gera a mensagem pronta do WhatsApp (RF07)
    reveal.ts           # animações de entrada (respeita prefers-reduced-motion)
```

## ✅ Requisitos atendidos

- **RF01–RF10:** hero, serviços, pacotes com destaque, processo, formulário com
  mensagem automática de WhatsApp, FAQ, modelos demonstrativos e CTAs.
- **RNF01–RNF08:** responsivo (mobile-first), carregamento leve, visual premium,
  animações suaves, legibilidade, acessibilidade básica, SEO e conteúdo editável.

## 🌐 Deploy

Gere o build (`npm run build`) e publique a pasta `/dist` em qualquer host estático
(Vercel, Netlify, GitHub Pages, etc.). É um site 100% estático — não precisa de backend.
