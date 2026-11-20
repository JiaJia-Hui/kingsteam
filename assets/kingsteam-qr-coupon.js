(() => {
  const url = new URL(window.location.href);
  if (url.searchParams.get('coupon') !== 'scan5') return;

  const template = document.getElementById('KingSteamQrCouponTemplate');
  if (!template) return;
  const dialog = template.content.firstElementChild.cloneNode(true);
  document.body.append(dialog);

  const status = dialog.querySelector('[data-status]');
  const signIn = dialog.querySelector('[data-sign-in]');
  const claim = dialog.querySelector('[data-claim]');
  const retry = dialog.querySelector('[data-retry]');
  const codeBox = dialog.querySelector('[data-code-box]');
  const code = dialog.querySelector('[data-code]');
  const copy = dialog.querySelector('[data-copy]');
  const apply = dialog.querySelector('[data-apply]');
  const actions = [signIn, claim, retry, codeBox, apply];
  const login = new URL(dialog.dataset.login || '/customer_authentication/login', url.origin);
  login.searchParams.set('return_to', url.pathname + url.search);
  signIn.href = login.href;
  let token;
  let busy = false;

  function show(result) {
    actions.forEach(node => { node.hidden = true; });
    code.textContent = '';
    apply.removeAttribute('href');
    if (result.state === 'claimed' && /^KS5-[A-F0-9]{24}$/.test(result.code)) {
      const expiry = new Date(result.expiresAt);
      status.textContent = `Your $5 coupon is ready. Expires ${expiry.toLocaleString('en-US', {
        dateStyle: 'medium', timeStyle: 'short',
      })}.`;
      code.textContent = result.code;
      codeBox.hidden = false;
      apply.hidden = false;
      const destination = dialog.dataset.shop || '/collections/all';
      apply.href = `/discount/${encodeURIComponent(result.code)}?redirect=${encodeURIComponent(destination)}`;
      return;
    }
    switch (result.state) {
      case 'ready':
        token = result.token;
        status.textContent = 'Claim a one-time $5 discount for your next KingSteam order.';
        claim.hidden = false;
        break;
      case 'sign_in':
        status.textContent = 'Sign in with your email to claim and save your coupon to your account.';
        signIn.hidden = false;
        break;
      case 'sold_out':
        status.textContent = 'All 2,000 coupons have been claimed.';
        break;
      case 'expired':
        status.textContent = 'Your coupon has expired.';
        break;
      case 'closed':
        status.textContent = 'Coupon claims are closed.';
        break;
      default:
        status.textContent = 'We couldn’t check your coupon. Please try again.';
        retry.hidden = false;
    }
  }

  async function requestCoupon(method) {
    if (busy) return;
    busy = true;
    claim.disabled = true;
    retry.disabled = true;
    status.textContent = method === 'POST' ? 'Claiming your coupon…' : 'Checking coupon availability…';
    try {
      const response = await fetch('/apps/kingsteam-gifts/qr-coupon?campaign=scan5', {
        method,
        credentials: 'same-origin',
        cache: 'no-store',
        ...(method === 'POST' ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        } : {}),
      });
      show(await response.json());
    } catch {
      show({ state: 'retry' });
    } finally {
      busy = false;
      claim.disabled = false;
      retry.disabled = false;
    }
  }

  claim.addEventListener('click', () => requestCoupon('POST'));
  retry.addEventListener('click', () => requestCoupon('GET'));
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      copy.textContent = 'Copied';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    url.searchParams.delete('coupon');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  });
  dialog.showModal();
  requestCoupon('GET');
})();
