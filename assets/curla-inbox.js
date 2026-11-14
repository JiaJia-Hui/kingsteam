(function () {
  'use strict';

  const config = document.getElementById('kingsteam-curla');
  const player = window.CurlyGuideMotion;
  if (!config || !player) return;

  const {stage, cartCount, poster, idle, wave, point, beg, pat} = config.dataset;
  let host, button, scope;
  const shadowChanges = new MutationObserver(bindLauncher);

  function bindLauncher() {
    const launcher = host?.shadowRoot?.querySelector('button[part~="activator"]');
    if (launcher === button) return;
    scope?.abort();
    button = launcher;
    if (!button) return;

    scope = new AbortController();
    const {signal} = scope;
    const art = document.createElement('span');
    art.className = 'curla-inbox-art';
    art.setAttribute('aria-hidden', 'true');
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = config.dataset.styles;
    art.hidden = true;
    button.prepend(art);
    player.mount(art, button, signal, {}, {
      stage: stage === 'cart' && Number(cartCount) === 0 ? 'idle' : stage,
      assets: {poster, idle, wave, point, beg, pat}
    });

    // The original icon remains the fallback until both resources are ready.
    const image = art.querySelector('img');
    let stylesReady = false;
    function decorate() {
      if (signal.aborted || !stylesReady || !image.naturalWidth) return;
      art.hidden = false;
      launcher.setAttribute('data-curla-inbox', '');
    }
    stylesheet.addEventListener('load', () => {
      stylesReady = true;
      decorate();
    }, {once: true, signal});
    image.addEventListener('load', decorate, {once: true, signal});
    host.shadowRoot.append(stylesheet);
    signal.addEventListener('abort', () => {
      launcher.removeAttribute('data-curla-inbox');
      art.remove();
      stylesheet.remove();
    }, {once: true});
  }

  function bindHost() {
    const next = document.querySelector('shopify-chat');
    if (next === host) return;
    shadowChanges.disconnect();
    host = next;
    if (host?.shadowRoot) shadowChanges.observe(host.shadowRoot, {childList: true, subtree: true});
    bindLauncher();
  }

  customElements.whenDefined('shopify-chat').then(() => {
    bindHost();
    new MutationObserver(bindHost).observe(document.body, {childList: true, subtree: true});
  });
}());
