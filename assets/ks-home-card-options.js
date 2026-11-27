class HomeCardOptions extends HTMLElement {
  connectedCallback() {
    const choices = this.querySelector("[data-card-choices]");
    if (!choices) return;

    this.formSelect = this.querySelector('select[name="id"]');
    this.variantName = choices.querySelector("[data-card-variant-name]");
    const card = this.closest(".accessory-card");
    this.price = card.querySelector("[data-card-price]");
    this.comparePrice = card.querySelector("[data-card-compare-price]");
    this.image = card.querySelector(".accessory-card__primary");
    this.originalImage = this.image?.getAttribute("src");
    this.originalSrcset = this.image?.getAttribute("srcset");
    const fallback = this.querySelector("[data-card-variant-fallback]");
    if (fallback) fallback.hidden = true;
    choices.hidden = false;
    this.addEventListener("change", this.handleChange);
  }

  disconnectedCallback() {
    this.removeEventListener("change", this.handleChange);
  }

  handleChange = ({ target }) => {
    if (!target.matches("[data-card-variant]") || !this.formSelect) return;

    const choice = target.dataset;
    this.formSelect.value = choice.cardVariant;
    this.variantName.textContent = choice.cardName;
    this.price.textContent = choice.cardPriceValue;
    this.comparePrice.textContent = choice.cardCompareValue;
    this.comparePrice.hidden = !choice.cardCompareValue;
    if (this.image) {
      this.image.srcset = choice.cardSrcset || this.originalSrcset;
      this.image.src = choice.cardImage || this.originalImage;
    }
  };
}

customElements.define("home-card-options", HomeCardOptions);
