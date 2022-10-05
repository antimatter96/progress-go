import { html, render } from "lit-html";
import { classMap } from "lit-html/directives/class-map";


const CSS = {
  'ok': {
    'heading': { 'text-lime-500': true },
    'bg': { 'bg-lime-500': true }
  },
  'error': {
    'heading': { 'text-red-500': true },
    'bg': { 'bg-red-500': true }
  },
  'warning': {
    'heading': { 'text-amber-500': true },
    'bg': { 'bg-amber-500': true }
  },
  'info': {
    'heading': { 'text-blue-500': true },
    'bg': { 'bg-blue-500': true }
  }
}

class AlertHandler {
  visible: boolean
  type: string
  message: string

  container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container;
    this.visible = false;
  }

  render() {
    if (!this.visible) {
      return html``
    }
    return html`
    <div id="alert" class="alert-container">
      <div class="alert-inner-container">
        <div class="alert-logo-container ${classMap(CSS[this.type].bg)}">
          <svg ?hidden=${this.type != 'ok'}      class="alert-logo" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M20 3.33331C10.8 3.33331 3.33337 10.8 3.33337 20C3.33337 29.2 10.8 36.6666 20 36.6666C29.2 36.6666 36.6667 29.2 36.6667 20C36.6667 10.8 29.2 3.33331 20 3.33331ZM16.6667 28.3333L8.33337 20L10.6834 17.65L16.6667 23.6166L29.3167 10.9666L31.6667 13.3333L16.6667 28.3333Z" /></svg>
          <svg ?hidden=${this.type != 'error'}   class="alert-logo" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M20 3.36667C10.8167 3.36667 3.3667 10.8167 3.3667 20C3.3667 29.1833 10.8167 36.6333 20 36.6333C29.1834 36.6333 36.6334 29.1833 36.6334 20C36.6334 10.8167 29.1834 3.36667 20 3.36667ZM19.1334 33.3333V22.9H13.3334L21.6667 6.66667V17.1H27.25L19.1334 33.3333Z" /></svg>
          <svg ?hidden=${this.type != 'warning'} class="alert-logo" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M20 3.33331C10.8 3.33331 3.33337 10.8 3.33337 20C3.33337 29.2 10.8 36.6666 20 36.6666C29.2 36.6666 36.6667 29.2 36.6667 20C36.6667 10.8 29.2 3.33331 20 3.33331ZM21.6667 28.3333H18.3334V25H21.6667V28.3333ZM21.6667 21.6666H18.3334V11.6666H21.6667V21.6666Z" /></svg>
          <svg ?hidden=${this.type != 'info'}    class="alert-logo" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M20 3.33331C10.8 3.33331 3.33337 10.8 3.33337 20C3.33337 29.2 10.8 36.6666 20 36.6666C29.2 36.6666 36.6667 29.2 36.6667 20C36.6667 10.8 29.2 3.33331 20 3.33331ZM21.6667 28.3333H18.3334V25H21.6667V28.3333ZM21.6667 21.6666H18.3334V11.6666H21.6667V21.6666Z" /></svg>
        </div>
        <div class="px-4 py-2 text-left">
          <span class="alert-heading ${classMap(CSS[this.type].heading)}">${this.type.charAt(0).toUpperCase() + this.type.substr(1)}</span>
          <p class="alert-text actual-text">${this.message}</p>
        </div>
      </div>
    </div>
    `
  }

  show(type: string, message: string, timeout: number): void {
    this.type = type;
    this.message = message;
    this.visible = true;

    render(this.render(), this.container);

    setTimeout(() => {
      this.hide();
    }, timeout);
  }

  hide() {
    this.visible = false;
    render(this.render(), this.container);
  }
}

export { AlertHandler };
