if (!customElements.get('kingsteam-jy162-intro')) {
  customElements.define('kingsteam-jy162-intro', class extends HTMLElement {
    connectedCallback() {
      const navigation = this.querySelector('nav');
      const links = Array.from(navigation.querySelectorAll('a'));
      const panels = links.map(link => document.getElementById(link.hash.substring(1)));
      const header = document.querySelector('m-header');
      const headerWrapper = header?.querySelector('.m-header__wrapper');
      const controller = new AbortController();
      const { signal } = controller;
      this.events = controller;
      let pendingFrame;

      const update = () => {
        pendingFrame = undefined;
        const headerHeight = headerWrapper?.offsetHeight ?? 0;
        const hasVisibleStickyHeader = header?.classList.contains('header-sticky-always')
          || (header?.classList.contains('stuck') && !header.classList.contains('scroll-down'));
        this.style.setProperty('--ks-jy162-header-height', headerHeight + 'px');
        this.style.setProperty('--ks-jy162-header-offset', (hasVisibleStickyHeader ? headerHeight : 0) + 'px');

        const cutoff = headerHeight + navigation.offsetHeight + 28;
        let selected = 0;
        panels.forEach((panel, index) => {
          if (panel.getBoundingClientRect().top <= cutoff) selected = index;
        });
        links.forEach((link, index) => {
          if (index === selected) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      };

      const scheduleUpdate = () => {
        if (pendingFrame === undefined) pendingFrame = requestAnimationFrame(update);
      };

      signal.addEventListener('abort', () => {
        if (pendingFrame !== undefined) cancelAnimationFrame(pendingFrame);
      });
      window.addEventListener('scroll', scheduleUpdate, { passive: true, signal });
      window.addEventListener('resize', scheduleUpdate, { signal });
      window.addEventListener('hashchange', scheduleUpdate, { signal });
      headerWrapper?.addEventListener('transitionend', scheduleUpdate, { signal });
      update();
    }

    disconnectedCallback() {
      this.events?.abort();
    }
  });
}
