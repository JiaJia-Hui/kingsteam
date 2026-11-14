(function () {
  'use strict';

  const config = document.getElementById('kingsteam-curla');
  const player = window.CurlyGuideMotion;
  if (!config || !player) return;

  const {stage, cartCount, poster, idle, wave, point, beg, pat} = config.dataset;
  const activatorSelector = 'button[part~="activator"]';
  const floatingSelector = '.floating-input-launcher__field';
  let host, runtime, button, scope;
  const shadowChanges = new MutationObserver(bindLauncher);
  const runtimeChanges = new MutationObserver(bindLauncher);

  function bindLauncher() {
    const shell = host?.shadowRoot;
    // Inbox replaces the lightweight initial button with a nested runtime on first open.
    const nextRuntime = shell?.querySelector('.agent-shell__runtime');
    if (nextRuntime !== runtime) {
      runtimeChanges.disconnect();
      runtime = nextRuntime;
      if (runtime?.shadowRoot) {
        runtimeChanges.observe(runtime.shadowRoot, {childList: true, subtree: true});
      }
    }
    const launcher = runtime?.shadowRoot?.querySelector(activatorSelector) ||
      shell?.querySelector(floatingSelector) || shell?.querySelector(activatorSelector);
    if (launcher === button) return;
    scope?.abort();
    button = launcher;
    if (!button) return;

    scope = new AbortController();
    const {signal} = scope;
    const art = document.createElement('span');
    art.className = 'curla-inbox-art';
    art.setAttribute('aria-hidden', 'true');
    const hint = document.createElement('span');
    hint.className = 'curla-inbox-hint';
    hint.textContent = 'Ask';
    hint.setAttribute('aria-hidden', 'true');
    hint.hidden = true;
    const root = launcher.getRootNode();
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = config.dataset.styles;
    art.hidden = true;
    launcher.prepend(art, hint);
    player.mount(art, button, signal, {}, {
      stage: stage === 'cart' && Number(cartCount) === 0 ? 'idle' : stage,
      assets: {poster, idle, wave, point, beg, pat}
    });

    // The original icon remains the fallback until both resources are ready.
    const image = art.querySelector('img');
    let stylesReady = false;
    let shellStylesheet;
    function decorate() {
      if (signal.aborted || !stylesReady || !image.naturalWidth) return;
      art.hidden = false;
      hint.hidden = false;
      launcher.setAttribute('data-curla-inbox', '');
      if (root === runtime?.shadowRoot) {
        // A message-bar launcher may briefly remain in the shell during the swap.
        shellStylesheet ||= stylesheet.cloneNode();
        if (!shellStylesheet.isConnected) shell.append(shellStylesheet);
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
      launcher.removeAttribute('data-curla-inbox');
      art.remove();
      hint.remove();
      stylesheet.remove();
      shellStylesheet?.remove();
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
