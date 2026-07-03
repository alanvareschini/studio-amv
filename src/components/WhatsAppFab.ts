// Botão flutuante de WhatsApp: fica sempre acessível no canto,
// leva direto pra conversa com uma mensagem pronta.
import { quickWhatsappLink } from "../lib/whatsapp";

export function WhatsAppFab(): string {
  return /* html */ `
    <a
      class="wa-fab"
      href="${quickWhatsappLink()}"
      target="_blank"
      rel="noopener"
      aria-label="Falar no WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.7 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-4.9 1 .9-4.7-.3-.4C5.3 18.4 4.8 16.7 4.8 15 4.8 8.8 9.8 3.8 16 3.8S27.2 8.8 27.2 15 22.2 24.8 16 24.8zm6.1-7.7c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.8.2-.2.3-.9 1.1-1.1 1.3-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-2-1.8-2.3-.2-.3 0-.5.1-.7.1-.1.3-.4.5-.6.1-.2.2-.3.3-.5.1-.2 0-.4 0-.6 0-.2-.8-1.9-1-2.6-.3-.7-.5-.6-.7-.6h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.7.7.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/>
      </svg>
    </a>
  `;
}
