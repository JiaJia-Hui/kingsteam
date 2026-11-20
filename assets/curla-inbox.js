(function () {
  'use strict';

  const config = document.getElementById('kingsteam-curla');
  const player = window.CurlyGuideMotion;
  if (!config || !player) return;

  const {stage, cartCount, poster, idle, wave, point, beg, pat} = config.dataset;
  const activatorSelector = 'button[part~="activator"]';
  const floatingSelector = '.floating-input-launcher__field';
  const promoSelector = 'shopify-forms-embed#app-embed-container-961213';
  let host, shellRoot, runtimeRoot, button, art, hint, motion, hostScope, scope;
  const shadowChanges = new MutationObserver(bindLauncher);
  const runtimeChanges = new MutationObserver(bindLauncher);

  function bindLauncher() {
    const shell = host?.shadowRoot;
    const standIn = shell?.querySelector('.curla-inbox-stand-in');
    // Inbox replaces the lightweight initial button with a nested runtime on first open.
    const nextRoot = shell?.querySelector('.agent-shell__runtime')?.shadowRoot;
    if (nextRoot !== runtimeRoot) {
      runtimeChanges.disconnect();
      runtimeRoot = nextRoot;
      if (runtimeRoot) {
        runtimeChanges.observe(runtimeRoot, {childList: true, subtree: true});
      }
    }
    const launcher = runtimeRoot?.querySelector(activatorSelector) ||
      shell?.querySelector(floatingSelector) || shell?.querySelector(activatorSelector);
    if (launcher === button) return;
    scope?.abort();
    button = launcher;
    if (!button) return;

    scope = new AbortController();
    const {signal} = scope;
    const root = launcher.getRootNode();
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = config.dataset.styles;
    if (!art) {
      art = document.createElement('span');
      art.className = 'curla-inbox-art';
      art.setAttribute('aria-hidden', 'true');
      art.hidden = true;
      hint = document.createElement('span');
      hint.className = 'curla-inbox-hint';
      hint.textContent = 'Ask';
      hint.setAttribute('aria-hidden', 'true');
      motion = player.mount(art, art, hostScope.signal, {}, {
        stage: stage === 'cart' && Number(cartCount) === 0 ? 'idle' : stage,
        assets: {poster, idle, wave, point, beg, pat}
      });
      const sizeChanges = new ResizeObserver(updatePromoPosition);
      sizeChanges.observe(art);
      window.addEventListener('resize', updatePromoPosition, {signal: hostScope.signal});
      hostScope.signal.addEventListener('abort', () => sizeChanges.disconnect(), {once: true});
    }
    launcher.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && art.dataset.motion === 'idle') motion.play('wave');
    }, {signal});
    launcher.addEventListener('click', () => {
      if (launcher.hasAttribute('data-curla-inbox')) motion.play('pat', {immediate: true});
    }, {capture: true, signal});

    const image = art.querySelector('img');
    let stylesReady = false;
    function decorate() {
      if (signal.aborted || !stylesReady || !image.naturalWidth) return;
      art.hidden = false;
      launcher.prepend(art, hint);
      launcher.setAttribute('data-curla-inbox', '');
      root.host.setAttribute('data-curla-docked', '');
      host.setAttribute('data-curla-docked', '');
      if (standIn) standIn.hidden = false;
      motion.refresh();
      updatePromoPosition();
      if (root === runtimeRoot) {
        // A message-bar launcher may briefly remain in the shell during the swap.
        host.setAttribute('data-curla-runtime-ready', '');
      }
    }
    stylesheet.addEventListener('load', () => {
      stylesReady = true;
      decorate();
    }, {once: true, signal});
    image.addEventListener('load', decorate, {once: true, signal});
    root.append(stylesheet);
    signal.addEventListener('abort', () => {
      shell?.host.removeAttribute('data-curla-runtime-ready');
      if (root !== shell) root.host.removeAttribute('data-curla-docked');
      launcher.removeAttribute('data-curla-inbox');
      // Move the same canvas during startup so the tap reaction keeps playing.
      if (!art.hidden && standIn) standIn.append(art, hint);
      stylesheet.remove();
    }, {once: true});
  }

  function bindHost() {
    const next = document.querySelector('shopify-chat');
    const nextShell = next?.shadowRoot;
    if (next === host && nextShell === shellRoot) return;
    scope?.abort();
    hostScope?.abort();
    host?.removeAttribute('data-curla-docked');
    button = art = hint = motion = undefined;
    shadowChanges.disconnect();
    runtimeChanges.disconnect();
    runtimeRoot = undefined;
    host = next;
    shellRoot = nextShell;
    if (shellRoot) {
      hostScope = new AbortController();
      const standIn = document.createElement('span');
      standIn.className = 'curla-inbox-stand-in';
      standIn.hidden = true;
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = config.dataset.styles;
      shellRoot.append(stylesheet, standIn);
      hostScope.signal.addEventListener('abort', () => {
        stylesheet.remove();
        standIn.remove();
      }, {once: true});
      shadowChanges.observe(shellRoot, {childList: true, subtree: true});
    }
    bindLauncher();
  }

  function updatePromoPosition() {
    const promo = document.querySelector(promoSelector);
    const launcher = art?.getBoundingClientRect();
    if (!promo || !launcher?.height) return;
    promo.style.setProperty('--curla-offer-bottom', `${Math.ceil(window.innerHeight - launcher.top + 12)}px`);
  }

  function bindPromo() {
    const promo = document.querySelector(promoSelector);
    const forms = promo?.shadowRoot;
    if (!forms || forms.querySelector('link[data-curla-promo-styles]')) return;
    promo.setAttribute('data-curla-offer-docked', '');
    updatePromoPosition();
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = config.dataset.styles;
    stylesheet.setAttribute('data-curla-promo-styles', '');
    forms.append(stylesheet);
  }

  function bindWidgets() {
    bindHost();
    bindPromo();
  }

  customElements.whenDefined('shopify-chat').then(() => {
    bindWidgets();
    new MutationObserver(bindWidgets).observe(document.body, {childList: true, subtree: true});
    // A fixed purchase bar can move the launcher without resizing the artwork.
    new MutationObserver(updatePromoPosition).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    customElements.whenDefined('shopify-forms-embed').then(bindPromo);
  });
}());
