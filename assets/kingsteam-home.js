(() => {
  const rootSelector = "[data-ks-home-editorial]";

  document.addEventListener("click", event => {
    const navigationLink = event.target.closest(".ks-shop-nav-mobile a[href^='#']");
    const drawer = navigationLink?.closest("#m-menu-drawer.open");
    if (drawer && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      drawer.querySelector(".m-menu-drawer__backdrop").click();
      window.setTimeout(() => {
        if (window.location.hash === navigationLink.hash) {
          document.getElementById(navigationLink.hash.slice(1))?.scrollIntoView();
        } else {
          window.location.hash = navigationLink.hash;
        }
      });
      return;
    }

    const root = event.target.closest(rootSelector);
    if (!root) return;

    const trigger = event.target.closest("[data-open]");
    if (trigger) {
      const dialog = root.querySelector(`dialog[id="${trigger.dataset.open}"]`);
      if (dialog) {
        trigger.closest("dialog")?.close();
        dialog.showModal();
      }
      return;
    }

    const dialog = event.target.closest("dialog");
    if (dialog && (event.target === dialog || event.target.closest(".close"))) {
      dialog.close();
      return;
    }

    const option = event.target.closest("[data-finish]");
    if (option) {
      for (const choice of root.querySelectorAll("[data-finish]")) {
        choice.setAttribute("aria-pressed", String(choice === option));
      }
      const template = root.querySelector(`template[id="finish-${option.dataset.finish}"]`);
      root.querySelector("#routine-result").replaceChildren(template.content.cloneNode(true));
    }
  });
})();
