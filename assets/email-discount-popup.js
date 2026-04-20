class EmailDiscountPopup extends HTMLElement {
  constructor() {
    super();

    this.modal = this.querySelector(".m-modal");
    this.closeButtons = this.querySelectorAll("[data-email-popup-close]");
    this.copyButton = this.querySelector("[data-email-popup-copy]");
    this.discountCode = this.dataset.discountCode || "";
    this.enable = this.dataset.enable === "true";
    this.designMode = this.dataset.designMode === "true";
    this.delay = Number(this.dataset.delay || 0);
    this.dismissDays = Number(this.dataset.dismissDays || 7);
    this.storagePrefix = `Minimog:email-discount-popup:${this.id}`;
    this.dismissKey = `${this.storagePrefix}:dismissed-until`;
    this.subscribedKey = `${this.storagePrefix}:subscribed`;
    this.hasSuccess = Boolean(this.querySelector("[data-email-popup-success]"));
    this.hasErrors = Boolean(this.querySelector(".notification.warning"));

    if (this.hasSuccess) {
      localStorage.setItem(this.subscribedKey, "true");
    }

    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
    this.boundHandleSectionSelect = this.handleSectionSelect.bind(this);
    this.boundHandleSectionLoad = this.handleSectionLoad.bind(this);
  }

  connectedCallback() {
    this.modal?.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        this.dismissPopup();
      }
    });

    this.closeButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.dismissPopup();
      });
    });

    if (this.copyButton) {
      this.copyButton.addEventListener("click", (event) => {
        event.preventDefault();
        this.copyDiscountCode();
      });
    }

    document.addEventListener("keyup", this.boundHandleKeyUp);

    if (window.Shopify && Shopify.designMode) {
      document.addEventListener("shopify:section:select", this.boundHandleSectionSelect);
      document.addEventListener("shopify:section:load", this.boundHandleSectionLoad);
    }

    if (this.shouldOpen()) {
      window.setTimeout(() => this.openPopup(), this.delay);
    }
  }

  disconnectedCallback() {
    document.removeEventListener("keyup", this.boundHandleKeyUp);

    if (window.Shopify && Shopify.designMode) {
      document.removeEventListener("shopify:section:select", this.boundHandleSectionSelect);
      document.removeEventListener("shopify:section:load", this.boundHandleSectionLoad);
    }
  }

  shouldOpen() {
    if (window.Shopify && Shopify.designMode && this.designMode) {
      return true;
    }

    if (!this.enable) {
      return this.hasSuccess || this.hasErrors;
    }

    if (this.hasSuccess || this.hasErrors) {
      return true;
    }

    if (localStorage.getItem(this.subscribedKey) === "true") {
      return false;
    }

    const dismissedUntil = Number(localStorage.getItem(this.dismissKey) || 0);

    return dismissedUntil < Date.now();
  }

  handleKeyUp(event) {
    if (event.key === "Escape" && this.modal?.classList.contains("m-open-modal")) {
      this.dismissPopup();
    }
  }

  handleSectionLoad(event) {
    if (event.detail.sectionId === this.dataset.sectionId && this.designMode) {
      this.openPopup();
    }
  }

  handleSectionSelect(event) {
    if (event.detail.sectionId === this.dataset.sectionId && this.designMode) {
      this.openPopup();
    } else if (window.Shopify && Shopify.designMode) {
      this.closePopup();
    }
  }

  openPopup() {
    if (!this.modal) return;

    this.modal.style.setProperty("--m-opacity", "1");
    this.modal.classList.add("m-open-modal");
    document.documentElement.classList.add("prevent-scroll");
  }

  closePopup() {
    if (!this.modal) return;

    this.modal.classList.remove("m-open-modal");
    this.modal.style.setProperty("--m-opacity", "0");
    document.documentElement.classList.remove("prevent-scroll");
  }

  dismissPopup() {
    if (this.hasSuccess) {
      localStorage.setItem(this.subscribedKey, "true");
    } else if (!(window.Shopify && Shopify.designMode)) {
      const dismissUntil = Date.now() + this.dismissDays * 24 * 60 * 60 * 1000;
      localStorage.setItem(this.dismissKey, String(dismissUntil));
    }

    this.closePopup();
  }

  async copyDiscountCode() {
    if (!this.discountCode) return;

    try {
      await navigator.clipboard.writeText(this.discountCode);
      this.copyButton.classList.add("is-copied");
      this.copyButton.textContent = "Copied";
      window.setTimeout(() => {
        this.copyButton.classList.remove("is-copied");
        this.copyButton.textContent = "Copy";
      }, 1800);
    } catch (error) {
      this.copyButton.textContent = this.discountCode;
    }
  }
}

if (!customElements.get("email-discount-popup")) {
  customElements.define("email-discount-popup", EmailDiscountPopup);
}
