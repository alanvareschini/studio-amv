// RF08 — FAQ em accordion acessível.
import { faq } from "../data/faq";

export function FAQ(): string {
  return /* html */ `
    <section class="section section--alt" id="faq">
      <div class="container container--narrow">
        <header class="section__head" data-reveal>
          <span class="eyebrow">Dúvidas</span>
          <h2 class="section__title">Perguntas <span class="text-gradient">frequentes</span></h2>
        </header>
        <div class="faq" data-reveal>
          ${faq
            .map(
              (item, i) => /* html */ `
            <div class="faq__item">
              <button class="faq__q" type="button" aria-expanded="false" aria-controls="faq-a-${i}" id="faq-q-${i}">
                <span>${item.question}</span>
                <span class="faq__icon" aria-hidden="true">+</span>
              </button>
              <div class="faq__a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}" hidden>
                <p>${item.answer}</p>
              </div>
            </div>`
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

export function initFAQ(): void {
  document.querySelectorAll<HTMLButtonElement>(".faq__q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const answer = document.getElementById(btn.getAttribute("aria-controls")!);
      btn.setAttribute("aria-expanded", String(!expanded));
      btn.classList.toggle("is-open", !expanded);
      if (answer) answer.hidden = expanded;
    });
  });
}
