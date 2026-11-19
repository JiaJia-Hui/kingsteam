const giftDialog = document.querySelector('#ks-gift-dialog');

if (giftDialog) {
  const form = giftDialog.querySelector('[data-gift-form]');
  const heading = giftDialog.querySelector('h2');
  const status = giftDialog.querySelector('[data-gift-status]');
  const submit = giftDialog.querySelector('[data-gift-checkout]');
  const linkField = giftDialog.querySelector('#ks-gift-share-link');
  const resume = giftDialog.querySelector('[data-gift-resume]');
  const storageKey = 'kingsteam.gift.purchase';
  const recovered = /^#ks-gift-([a-f0-9]{64})$/.exec(location.hash)?.[1];
  let purchase = recovered || sessionStorage.getItem(storageKey);
  let busy = false;

  function view(name, title) {
    heading.textContent = title;
    for (const panel of giftDialog.querySelectorAll('[data-gift-view]')) {
      panel.hidden = panel.dataset.giftView !== name;
    }
    heading.focus({ preventScroll: true });
  }

  async function request(action, data) {
    const response = await fetch(`${giftDialog.dataset.proxy}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || 'Please try again.');
    return result;
  }

  function checkoutUrl(value) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password ||
        !(url.hostname === location.hostname || /(^|\.)(shopify\.com|myshopify\.com|kingsteam\.com)$/.test(url.hostname))) {
      throw new Error('Checkout is temporarily unavailable.');
    }
    return url.href;
  }

  function sharedGift(value) {
    const url = new URL(value, location.origin);
    if (url.origin !== location.origin ||
        !url.pathname.endsWith('/apps/kingsteam-gifts/claim') ||
        !/^#[a-f0-9]{64}$/.test(url.hash)) throw new Error('Gift link is temporarily unavailable.');
    linkField.value = url.href;
    const text = encodeURIComponent(`I sent you a KingSteam gift card. Claim it here: ${url.href}`);
    giftDialog.querySelector('[data-gift-share="whatsapp"]').href = `https://wa.me/?text=${text}`;
    giftDialog.querySelector('[data-gift-share="email"]').href = `mailto:?subject=KingSteam%20gift%20card&body=${text}`;
    giftDialog.querySelector('[data-gift-share="sms"]').href = `sms:${/iPhone|iPad/.test(navigator.userAgent) ? '&' : '?'}body=${text}`;
    giftDialog.querySelector('[data-gift-action="share"]').hidden = !navigator.share;
    view('share', 'Your gift card is ready');
  }

  async function checkPayment() {
    if (!purchase || busy) return;
    busy = true;
    status.textContent = 'Checking payment…';
    try {
      const result = await request('status', { purchase });
      if (result.link) {
        sharedGift(result.link);
        status.textContent = '';
      } else {
        resume.hidden = !result.checkout;
        if (result.checkout) resume.href = checkoutUrl(result.checkout);
        status.textContent = 'Payment is not confirmed yet.';
      }
    } catch (error) {
      status.textContent = error.message;
    } finally {
      busy = false;
    }
  }

  function openGift() {
    if (!giftDialog.open) giftDialog.showModal();
    status.textContent = '';
    if (purchase) {
      resume.hidden = true;
      view('pending', 'Find your gift card');
      checkPayment();
    } else {
      view('buy', 'Send a gift card');
    }
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-ks-gift-open]')) openGift();
  });

  form.addEventListener('change', () => {
    const amount = new FormData(form).get('gift-amount');
    giftDialog.querySelector('[data-gift-value]').textContent = `$${amount}`;
    submit.textContent = `Continue to checkout · $${amount}`;
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    submit.disabled = true;
    status.textContent = 'Opening Shopify checkout…';
    try {
      const amount = Number(new FormData(form).get('gift-amount'));
      const attemptKey = `kingsteam.gift.attempt.${amount}`;
      const attempt = sessionStorage.getItem(attemptKey) || crypto.randomUUID();
      sessionStorage.setItem(attemptKey, attempt);
      const result = await request('purchase', { amount, attempt });
      if (!/^[a-f0-9]{64}$/.test(result.purchase)) throw new Error('Purchase could not be started.');
      const url = checkoutUrl(result.checkout);
      purchase = result.purchase;
      sessionStorage.setItem(storageKey, purchase);
      sessionStorage.removeItem(attemptKey);
      location.assign(url);
    } catch (error) {
      status.textContent = error.message;
    } finally {
      busy = false;
      submit.disabled = false;
    }
  });

  giftDialog.addEventListener('click', async event => {
    const action = event.target.closest('[data-gift-action]')?.dataset.giftAction;
    if (action === 'close') giftDialog.close();
    if (action === 'check') checkPayment();
    if (action === 'another') {
      purchase = null;
      sessionStorage.removeItem(storageKey);
      status.textContent = '';
      view('buy', 'Send a gift card');
    }
    if (action === 'copy') {
      try {
        await navigator.clipboard.writeText(linkField.value);
        status.textContent = 'Gift link copied.';
      } catch {
        linkField.select();
        status.textContent = 'Select and copy the gift link.';
      }
    }
    if (action === 'share') {
      try {
        await navigator.share({ title: 'KingSteam Gift Card', url: linkField.value });
      } catch (error) {
        if (error.name !== 'AbortError') status.textContent = 'Use Copy link to share your gift.';
      }
    }
  });

  if (recovered) {
    sessionStorage.setItem(storageKey, recovered);
    history.replaceState(null, '', location.pathname + location.search);
    openGift();
  }
}
