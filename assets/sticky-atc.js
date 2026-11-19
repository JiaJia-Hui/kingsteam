if (!customElements.get("sticky-atc")) {
  customElements.define(
    "sticky-atc",
    class StickyAtc extends HTMLElement {
      constructor() {
        super();
        this.selectors = {
          prodTitle: ".m-sticky-addtocart--title",
          mainImage: ".m-sticky-addtocart--image",
          addToCart: ".m-add-to-cart",
          buyNowBtn: ".m-product-dynamic-checkout",
          variantIdSelect: '[name="id"]',
          foxkitBtn: ".foxkit-button",
          picker: "[data-sticky-picker]",
        };
        this.hasCustomFields = !!document.querySelector(".m-main-product--info .m-product-custom-field");
      }

      connectedCallback() {
        this.mainProduct = document.querySelector("product-info[id^='MainProduct']");
        this.container = this.closest(".m-sticky-addtocart");
        this.mainProductForm = document.querySelector(".m-product-form--main");
        this.mainProductInfo = document.querySelector(".m-main-product--info");
        this.mainAddToCart = this.mainProductForm ? this.mainProductForm.querySelector(".m-add-to-cart") : null;
        this.mainDynamicCheckout = this.mainProductForm?.querySelector(this.selectors.buyNowBtn);
        this.disableSelectedVariantDefault = this.mainProduct.dataset.disableSelectedVariantDefault === "true" || false;
        this.domNodes = queryDomNodes(this.selectors, this.container);

        this.init();
      }

      init() {
        if (!this.mainAddToCart) {
          this.container.style.setProperty("--m-translate-y", 0);
          return;
        }

        const headerHeight = MinimogSettings.headerHeight || 66;
        const rootMargin = `${headerHeight}px 0px 0px 0px`;

        if ("IntersectionObserver" in window) {
          this.observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.intersectionRatio !== 1) {
                  this.container.style.setProperty("--m-translate-y", 0);
                } else {
                  this.container.style.setProperty("--m-translate-y", "100%");
                }
                document.documentElement.classList[entry.intersectionRatio !== 1 ? "add" : "remove"]("stick-atc-show");
              });
            },
            { threshold: 1, rootMargin }
          );
        }

        if (this.disableSelectedVariantDefault) {
          this.handleDisableSelectedVariantDefault();
        }

        const { prodTitle, mainImage } = this.domNodes;
        prodTitle.addEventListener("click", () => __scrollToTop());
        mainImage.addEventListener("click", () => __scrollToTop());

        this.handleCustomFields();

        this.setObserveTarget();

        this.heightObserver = new ResizeObserver(() => this.setStickyAddToCartHeight());
        this.heightObserver.observe(this.container);
        this.setStickyAddToCartHeight();

        this.domNodes.picker?.addEventListener("change", ({ target }) => {
          const optionId = target.dataset.optionValueId;
          if (!optionId) return;

          const picker = this.mainProduct.variantPicker;
          const input = picker?.querySelector(`input[data-option-value-id="${optionId}"]`);
          if (!input) return;

          this.querySelector(this.selectors.variantIdSelect).value = "";
          this.toggleAddButton(true);
          input.checked = true;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }

      disconnectedCallback() {
        this.heightObserver?.disconnect();
        this.observer?.disconnect();
      }

      setObserveTarget() {
        if (this.observer) {
          this.observer.observe(this.mainProductForm);
          this.observeTarget = this.mainProductForm;
        }
      }

      setUnavailable() {
        const productForm = this.querySelector('.m-product-form');
        const addButton = productForm.querySelector('[name="add"]');

        if (addButton) {
          this.toggleAddButton(true, window.MinimogStrings.unavailable);
        }
      }

      toggleAddButton(disable = true, text, modifyClass = true) {
        const productForm = this.querySelector('.m-product-form');
        if (!productForm) return;
        const addButton = productForm.querySelector('[name="add"]');
        const addButtonText = productForm.querySelector('[name="add"] > span.m-add-to-cart--text');
        if (!addButton) return;

        if (disable) {
          addButton.setAttribute('disabled', 'disabled');
          if (text) addButtonText.textContent = text;
        } else {
          addButton.removeAttribute('disabled');
          addButtonText.innerHTML = window.MinimogStrings.addToCart;
        }

        if (!modifyClass) return;
      }

      handleDisableSelectedVariantDefault() {
        let urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("variant")) return;

        this.querySelector(this.selectors.variantIdSelect).value = '';
        this.domNodes.picker?.querySelectorAll('input:checked').forEach((input) => {
          input.checked = false;
        });
        this.setUnavailable();
      }

      setStickyAddToCartHeight() {
        const height = this.container.offsetHeight;
        document.documentElement.style.setProperty("--f-sticky-atc-bar-height", height + "px");
        window.MinimogSettings.stickyAddToCartHeight = height;
      }

      updateVariant(variant, html) {
        const variantInput = this.querySelector(this.selectors.variantIdSelect);
        const picker = this.domNodes.picker;
        const renderedPicker = html.querySelector(this.selectors.picker);
        if (picker && renderedPicker) {
          const focusedInput = document.activeElement;
          const focusedId = picker.contains(focusedInput) ? focusedInput.id : null;
          picker.replaceChildren(...renderedPicker.cloneNode(true).children);
          if (focusedId) document.getElementById(focusedId)?.focus({ preventScroll: true });
          this.setStickyAddToCartHeight();
        }
        variantInput.value = variant?.id ?? '';
        this.toggleAddButton(!variant?.available, variant ? window.MinimogStrings.soldOut : window.MinimogStrings.unavailable);
      }

      handleCustomFields() {
        if (!this.hasCustomFields) return;

        const { addToCart, buyNowBtn, foxkitBtn } = this.domNodes;

        let hasCustomFieldRequired = false;
        const customFields = document.querySelectorAll(".m-main-product--info .m-product-custom-field");
        let customFieldFirst = customFields[0];
        customFields &&
          customFields.forEach((item) => {
            const field = item.querySelector(".form-field");
            if (field.value == "" && field.hasAttribute("required")) {
              hasCustomFieldRequired = true;
            }
          });

        hasCustomFieldRequired &&
          addToCart.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            __scrollToTop(this.mainProductInfo, () => this.mainAddToCart.click());
          });
        if (buyNowBtn) {
          buyNowBtn.addEventListener(
            "click",
            (e) => {
              const missing = validateForm(this.mainProductInfo);
              if (missing.length > 0) {
                e.preventDefault();
                e.stopPropagation();
                __scrollToTop(this.mainProductInfo, () => this.mainDynamicCheckout.click());
              }
            },
            true
          );
        }
        if (foxkitBtn) {
          foxkitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            __scrollToTop(this.mainProductInfo, () => this.mainAddToCart.click());
          });
        }
      }
    }
  );
}
