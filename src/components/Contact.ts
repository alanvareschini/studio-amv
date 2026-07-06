// RF06 / RF07 — Formulário de briefing que gera mensagem pronta para o WhatsApp.
import { packages } from "../data/packages";
import { buildWhatsappMessage, whatsappLink, type BriefingData } from "../lib/whatsapp";

export function Contact(): string {
  // O dropdown lista só os PLANOS de site; a Manutenção é um adicional separado.
  const options = packages
    .filter((p) => p.id !== "manutencao")
    .map((p) => `<option value="${p.name}">${p.name}</option>`)
    .join("");

  return /* html */ `
    <section class="section" id="orcamento">
      <div class="container container--narrow">
        <header class="section__head" data-reveal>
          <span class="eyebrow">Briefing rápido</span>
          <h2 class="section__title">Peça seu <span class="text-gradient">orçamento</span></h2>
          <p class="section__lead">Preencha o essencial e eu te respondo direto no WhatsApp com a proposta.</p>
        </header>

        <form class="form" id="briefingForm" novalidate data-reveal>
          <div class="form__row">
            <div class="field">
              <label for="f-nome">Nome *</label>
              <input id="f-nome" name="nome" type="text" required autocomplete="name" maxlength="60" placeholder="Seu nome" />
            </div>
            <div class="field">
              <label for="f-empresa">Nome da empresa</label>
              <input id="f-empresa" name="empresa" type="text" autocomplete="organization" maxlength="60" placeholder="Sua empresa" />
            </div>
          </div>

          <div class="form__row">
            <div class="field">
              <label for="f-whatsapp">WhatsApp *</label>
              <input id="f-whatsapp" name="whatsapp" type="tel" required inputmode="tel" autocomplete="tel" maxlength="16" placeholder="(00) 90000-0000" />
            </div>
            <div class="field">
              <label for="f-segmento">Segmento do negócio *</label>
              <input id="f-segmento" name="segmento" type="text" required maxlength="40" placeholder="Ex.: barbearia, clínica..." />
            </div>
          </div>

          <div class="form__row">
            <div class="field">
              <label for="f-objetivo">Objetivo do site *</label>
              <input id="f-objetivo" name="objetivo" type="text" required maxlength="120" placeholder="Ex.: vender mais, captar contatos" />
            </div>
            <div class="field">
              <label for="f-pacote">Pacote de interesse</label>
              <select id="f-pacote" name="pacote">
                <option value="">Ainda não sei</option>
                ${options}
              </select>
            </div>
          </div>

          <div class="field">
            <label for="f-instagram">Instagram</label>
            <input id="f-instagram" name="instagram" type="text" maxlength="31" placeholder="@seuperfil" />
          </div>

          <div class="field field--check">
            <label class="check" for="f-manutencao">
              <input type="checkbox" id="f-manutencao" name="manutencao" value="sim" />
              <span>Também quero <strong>manutenção mensal</strong> (R$ 149/mês): atualizações, backups e suporte por WhatsApp.</span>
            </label>
          </div>

          <div class="field">
            <label for="f-mensagem">Mensagem adicional</label>
            <textarea id="f-mensagem" name="mensagem" rows="3" maxlength="600" placeholder="Conte um pouco mais sobre o que você precisa"></textarea>
          </div>

          <p class="form__error" id="formError" role="alert" hidden></p>

          <button class="state-btn" type="submit" id="briefingSubmit" data-state="idle">
            <span class="state-btn__c state-btn__c--idle">Enviar e abrir o WhatsApp 💬</span>
            <span class="state-btn__c state-btn__c--sending"><span class="state-btn__spin" aria-hidden="true"></span>Enviando…</span>
            <span class="state-btn__c state-btn__c--done">✓ Abrindo o WhatsApp</span>
          </button>
          <p class="form__hint">Ao enviar, o WhatsApp abre com a sua mensagem já escrita.</p>
          <p class="form__lgpd">🔒 Seus dados são usados apenas para entrar em contato sobre o seu orçamento. Não compartilhamos com terceiros.</p>
        </form>
      </div>
    </section>
  `;
}

// Formata o número enquanto o usuário digita: (00) 90000-0000
function formatPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Regras de validação por campo. Retorna mensagem de erro ou "" se estiver ok.
function validateField(name: string, raw: string): string {
  const v = raw.trim();
  switch (name) {
    case "nome":
      if (!v) return "Informe seu nome.";
      if (v.length < 2) return "Nome muito curto.";
      if (!/^[\p{L}][\p{L}\s'.-]*$/u.test(v)) return "Use apenas letras no nome.";
      return "";
    case "empresa":
      if (v && v.length < 2) return "Nome de empresa muito curto.";
      return "";
    case "whatsapp": {
      const d = v.replace(/\D/g, "");
      if (!d) return "Informe seu WhatsApp.";
      if (d.length < 10 || d.length > 11) return "WhatsApp inválido: use DDD + número.";
      return "";
    }
    case "segmento":
      if (!v) return "Informe o segmento do negócio.";
      if (v.length < 2) return "Descreva o segmento (mín. 2 letras).";
      return "";
    case "objetivo":
      if (!v) return "Informe o objetivo do site.";
      if (v.length < 3) return "Descreva melhor o objetivo (mín. 3 letras).";
      return "";
    case "instagram": {
      if (!v) return "";
      const h = v.replace(/^@/, "");
      if (!/^[A-Za-z0-9._]{1,30}$/.test(h))
        return "Use só letras, números, ponto e _ (ex.: @seuperfil).";
      if (/^\.|\.$/.test(h)) return "O @ não pode começar nem terminar com ponto.";
      if (/\.\./.test(h)) return "O @ não pode ter dois pontos seguidos.";
      if (h.length < 3) return "Instagram muito curto para ser um perfil.";
      return "";
    }
    case "mensagem":
      if (v.length > 600) return "Mensagem muito longa (máx. 600 caracteres).";
      return "";
    default:
      return "";
  }
}

function setFieldError(el: HTMLElement, msg: string): void {
  const field = el.closest(".field");
  if (!field) return;
  field.classList.add("field--error");
  el.setAttribute("aria-invalid", "true");
  let m = field.querySelector<HTMLElement>(".field__err");
  if (!m) {
    m = document.createElement("small");
    m.className = "field__err";
    field.appendChild(m);
  }
  m.textContent = msg;
  m.hidden = false;
}

function clearFieldError(el: HTMLElement): void {
  const field = el.closest(".field");
  if (!field) return;
  field.classList.remove("field--error");
  el.removeAttribute("aria-invalid");
  const m = field.querySelector<HTMLElement>(".field__err");
  if (m) m.hidden = true;
}

export function initContact(): void {
  const form = document.getElementById("briefingForm") as HTMLFormElement | null;
  const error = document.getElementById("formError");
  if (!form) return;

  const fields = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[name], textarea[name]")
  );

  // máscara de telefone em tempo real
  const wpp = form.querySelector<HTMLInputElement>("#f-whatsapp");
  wpp?.addEventListener("input", () => {
    wpp.value = formatPhone(wpp.value);
  });

  // ao corrigir, some o erro daquele campo
  fields.forEach((el) => el.addEventListener("input", () => clearFieldError(el)));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form)) as unknown as BriefingData;

    // Valida campo a campo (RF06)
    let firstInvalid: HTMLElement | null = null;
    let count = 0;
    fields.forEach((el) => {
      const msg = validateField(el.name, el.value);
      if (msg) {
        setFieldError(el, msg);
        if (!firstInvalid) firstInvalid = el;
        count++;
      } else {
        clearFieldError(el);
      }
    });

    if (firstInvalid) {
      if (error) {
        error.textContent =
          count === 1
            ? "Corrija o campo destacado para continuar."
            : `Corrija os ${count} campos destacados para continuar.`;
        error.hidden = false;
      }
      (firstInvalid as HTMLElement).focus();
      return;
    }
    if (error) error.hidden = true;

    // conversão: formulário enviado com sucesso (o analytics escuta este evento)
    window.dispatchEvent(new CustomEvent("amv:conv", { detail: "form" }));

    const submit = document.getElementById("briefingSubmit") as HTMLButtonElement | null;
    const message = buildWhatsappMessage(data);
    const url = whatsappLink(message);

    if (submit) {
      // Deixa a animação aparecer: "Enviando…" → "✓ Abrindo" → só então abre o WhatsApp.
      submit.disabled = true;
      submit.dataset.state = "sending";
      window.setTimeout(() => (submit.dataset.state = "done"), 900);
      window.setTimeout(() => {
        const win = window.open(url, "_blank", "noopener");
        if (!win) window.location.href = url; // fallback se o popup for bloqueado
        submit.dataset.state = "idle";
        submit.disabled = false;
      }, 1500);
    } else {
      window.open(url, "_blank", "noopener");
    }
  });
}
