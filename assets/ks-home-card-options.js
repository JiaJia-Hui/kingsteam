class HomeCardOptions extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector("dialog");
    if (typeof this.dialog?.showModal !== "function") return;

    this.querySelector("[data-options-fallback]").hidden = true;
    this.querySelector("[data-options-open]").hidden = false;
    this.addEventListener("click", this.handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.handleClick);
  }

  handleClick = (event) => {
    if (event.target.closest("[data-options-open]")) {
      this.dialog.showModal();
    } else if (this.dialog.open && (event.target === this.dialog || event.target.closest("[data-options-close]"))) {
      this.dialog.close();
    }
  };
}

customElements.define("home-card-options", HomeCardOptions);

document.addEventListener("product-ajax:added", ({ detail }) => {
  const dialog = document.querySelector("home-card-options dialog[open]");
  if (dialog?.closest("home-card-options").dataset.productId === String(detail?.product?.product_id)) {
    dialog.close();
  }
});
