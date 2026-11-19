class KingsteamShopNav extends HTMLElement {
  connectedCallback() {
    this.listeners = new AbortController();
    const { signal } = this.listeners;

    for (const item of this.querySelectorAll('.ks-shop-nav__item')) {
      const button = item.querySelector('button');
      item.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse') this.show(button);
      }, { signal });
      button?.addEventListener('click', (event) => {
        const alreadyOpen = this.active === button;
        this.show(alreadyOpen && (event.detail === 0 || !matchMedia('(hover: hover)').matches) ? null : button);
      }, { signal });
    }

    this.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse' && !this.active?.nextElementSibling.contains(document.activeElement)) this.show(null);
    }, { signal });
    this.addEventListener('focusout', (event) => {
      if (!this.contains(event.relatedTarget)) this.show(null);
    }, { signal });
    document.addEventListener('pointerdown', (event) => {
      if (!this.contains(event.target)) this.show(null);
    }, { signal });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !this.active) return;
      const active = this.active;
      const focusInside = this.contains(document.activeElement);
      this.show(null);
      if (focusInside) {
        event.preventDefault();
        active.focus();
      }
    }, { signal });
  }

  disconnectedCallback() {
    this.show(null);
    this.listeners?.abort();
  }

  show(button) {
    if (button === this.active) return;
    if (this.active) {
      this.active.setAttribute('aria-expanded', 'false');
      this.active.nextElementSibling.hidden = true;
    }
    this.active = button;
    if (button) {
      button.setAttribute('aria-expanded', 'true');
      button.nextElementSibling.hidden = false;
    }
  }
}

if (!customElements.get('kingsteam-shop-nav')) {
  customElements.define('kingsteam-shop-nav', KingsteamShopNav);
}
