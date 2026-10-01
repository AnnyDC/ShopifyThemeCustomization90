(() => {
  if (window.personalizedDemoLoaded) return;
  window.personalizedDemoLoaded = true;
  const configuration = JSON.parse(document.getElementById('DemoConfiguration').textContent);
  const endpoint = (path) => `${configuration.root.replace(/\/$/, '')}/${path}`;
  const announce = (message) => { document.getElementById('DemoStatus').textContent = message; };
  const drawer = () => document.getElementById('DemoCartDrawer');
  let opener;
  let cartBusy = false;
  const openDrawer = () => { const dialog = drawer(); if (!dialog?.showModal) { location.assign(configuration.cart); return; } if (!dialog.open) { opener = document.activeElement; dialog.showModal(); } };
  const sectionIds = () => [...new Set([...document.querySelectorAll('[data-cart-content]')].map((node) => node.dataset.sectionId))];
  async function request(url, options) {
    const response = await fetch(url, options); const result = await response.json();
    if (!response.ok || result.status >= 400) throw new Error(typeof result.description === 'string' ? result.description : configuration.error);
    return result;
  }
  async function refreshCart(sections, count) {
    if (!sections || sectionIds().some((id) => !sections[id])) {
      const url = new URL(location.href); url.searchParams.set('sections', sectionIds().join(','));
      const response = await fetch(url); if (!response.ok) throw new Error(configuration.error); sections = await response.json();
    }
    const replacements = [...document.querySelectorAll('[data-cart-content]')].map((target) => {
      const html = new DOMParser().parseFromString(sections[target.dataset.sectionId] || '', 'text/html');
      const source = html.querySelector('[data-cart-content]'); if (!source) throw new Error(configuration.error);
      return [target, source.innerHTML];
    });
    replacements.forEach(([target, html]) => { target.innerHTML = html; });
    if (count === undefined) count = (await request(endpoint('cart.js'))).item_count;
    document.querySelectorAll('[data-cart-count]').forEach((node) => { node.textContent = count; });
  }
  async function changeLine(key, quantity, source) {
    if (cartBusy) return;
    cartBusy = true;
    const area = source.closest('[data-cart-content]'); const activeId = document.activeElement?.id;
    document.querySelectorAll('[data-cart-content] input,[data-cart-content] button').forEach((control) => { control.disabled = true; });
    area.setAttribute('aria-busy', 'true');
    const errors = source.closest('dialog,section').querySelector('[data-cart-error]'); errors.textContent = '';
    try {
      const cart = await request(endpoint('cart/change.js'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: key, quantity, sections: sectionIds(), sections_url: location.pathname }) });
      await refreshCart(cart.sections, cart.item_count); announce(configuration.updated);
      (document.getElementById(activeId) || (drawer()?.open ? drawer().querySelector('[data-close-cart]') : document.querySelector('[data-cart-content] a')))?.focus();
    } catch (error) { errors.textContent = error.message; source.value = source.defaultValue; }
    finally { area.removeAttribute('aria-busy'); cartBusy = false; document.querySelectorAll('[data-cart-content] input,[data-cart-content] button').forEach((control) => { control.disabled = false; }); }
  }
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-cart]')) { event.preventDefault(); openDrawer(); }
    if (event.target.closest('[data-close-cart]')) drawer().close();
    const remove = event.target.closest('[data-remove-line]'); if (remove) { event.preventDefault(); changeLine(remove.dataset.key, 0, remove); }
  });
  document.addEventListener('change', (event) => { const input = event.target.closest('[data-cart-quantity]'); if (input && input.reportValidity()) changeLine(input.dataset.key, Number(input.value), input); });
  document.addEventListener('submit', (event) => { if (cartBusy && event.target.matches('[data-cart-form]')) event.preventDefault(); });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || !drawer()?.open) return;
    const controls = [...drawer().querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')].filter((node) => !node.disabled && node.getClientRects().length);
    const first = controls[0]; const last = controls.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (!drawer().contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  // Close does not bubble. Delegation survives theme-editor section replacements.
  document.addEventListener('close', (event) => { if (event.target.id === 'DemoCartDrawer') { if (opener?.isConnected) opener.focus(); else document.querySelector('[data-open-cart]')?.focus(); } }, true);
  document.addEventListener('click', (event) => { if (event.target === drawer()) { const rect = drawer().getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) drawer().close(); } });
  if (!customElements.get('demo-product')) customElements.define('demo-product', class extends HTMLElement {
    connectedCallback() {
      this.abort?.abort(); this.abort = new AbortController();
      this.form = this.querySelector('form'); this.variants = JSON.parse(this.querySelector('[data-variants]').textContent);
      this.select = this.querySelector('[data-variant-select]'); this.button = this.form.querySelector('[name=add]');
      this.options = [...this.querySelectorAll('[data-option-index]')];
      const initial = this.variants.find((variant) => String(variant.id) === this.select.value);
      if (initial) this.options.forEach((option, index) => { option.value = initial.options[index]; });
      this.select.hidden = true; this.querySelector('[data-variant-label]').hidden = true; this.querySelector('[data-option-pickers]').hidden = false;
      const signal = this.abort.signal;
      this.addEventListener('change', (event) => { if (event.target.matches('[data-option-index]')) this.updateVariant(); }, { signal });
      this.form.addEventListener('submit', (event) => this.add(event), { signal });
      this.updateVariant(false);
    }
    disconnectedCallback() { this.abort?.abort(); }
    updateVariant(updateUrl = true) {
      const variant = this.variants.find((candidate) => candidate.options.every((value, index) => value === this.options[index].value));
      this.variant = variant; this.select.value = variant ? String(variant.id) : ''; this.select.disabled = !variant;
      this.button.disabled = this.busy || !variant?.available; this.button.textContent = variant ? (variant.available ? configuration.add : configuration.soldOut) : configuration.unavailable;
      const price = this.querySelector('[data-variant-price]'); price.replaceChildren();
      if (variant) {
        const current = document.createElement('span'); current.textContent = variant.price; price.append(current);
        if (variant.compare) { const compare = document.createElement('s'); compare.textContent = variant.compare; price.append(' ', compare); }
        const quantity = this.form.elements.quantity; quantity.min = variant.min; quantity.step = variant.step; if (variant.max === null) quantity.removeAttribute('max'); else quantity.max = variant.max;
        if (!quantity.checkValidity()) quantity.value = variant.min;
        const image = this.querySelector('[data-product-media] img'); if (image && variant.image) { image.src = variant.image; image.srcset = [400,700,1000,1400].map((width) => { const url = new URL(variant.image, location.origin); url.searchParams.set('width', width); return `${url} ${width}w`; }).join(','); image.alt = variant.alt || ''; }
      }
      if (updateUrl) { const url = new URL(location.href); if (variant) url.searchParams.set('variant', variant.id); else url.searchParams.delete('variant'); history.replaceState({}, '', url); }
    }
    async add(event) {
      event.preventDefault(); if (this.busy || cartBusy || !this.variant?.available || !this.form.reportValidity()) return;
      this.busy = true; cartBusy = true; this.button.disabled = true; this.form.setAttribute('aria-busy', 'true');
      const errors = this.querySelector('[data-product-error]'); errors.textContent = '';
      const data = new FormData(this.form);
      for (const [name, value] of [...data.entries()]) if (name.startsWith('properties[') && typeof value === 'string') { if (value.trim()) data.set(name, value.trim()); else data.delete(name); }
      data.set('sections', sectionIds().join(',')); data.set('sections_url', location.pathname);
      try { const result = await request(endpoint('cart/add.js'), { method: 'POST', body: data }); await refreshCart(result.sections); announce(configuration.added); openDrawer(); }
      catch (error) { errors.textContent = error.message; }
      finally { this.busy = false; cartBusy = false; this.form.removeAttribute('aria-busy'); this.button.disabled = !this.variant?.available; }
    }
  });
})();
