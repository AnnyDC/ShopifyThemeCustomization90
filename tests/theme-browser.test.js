import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';

const css = readFileSync(new URL('../assets/demo.css', import.meta.url), 'utf8');
const script = readFileSync(new URL('../assets/demo.js', import.meta.url), 'utf8');
const image = readFileSync(new URL('../assets/product-img-1.webp', import.meta.url));
const variants = [ { id: 1, options: ['A','B'], available: true, price: '$30.00', compare: '$40.00', image: 'https://demo.test/image.webp?width=1400', alt: 'Ring', min: 1, step: 1, max: 5 }, { id: 2, options: ['B','A'], available: true, price: '$35.00', compare: null, image: 'https://demo.test/image.webp?width=1400', alt: 'Gold ring', min: 1, step: 1, max: null }, { id: 3, options: ['B','B'], available: false, price: '$36.00', compare: null, image: null, min: 1, step: 1, max: null } ];
const configuration = { root: '/fr/', cart: '/fr/cart', add: 'Add to cart', soldOut: 'Sold out', unavailable: 'Unavailable', added: 'Added', updated: 'Updated', error: 'Check your cart before trying again.' };
function cartMarkup(items, context) {
  return `<div data-cart-content data-section-id="${context}">${items.length ? `<form data-cart-form><ul class="demo-cart-lines">${items.map((item,index) => `<li class="demo-cart-line" data-line-key="${item.key}"><img width="80" height="80" src="/image.webp"><div><a href="/product">Personalized ring</a><p>${item.properties.Engraving || ''}</p><label for="${context}-${index}">Quantity</label><input data-cart-quantity data-key="${item.key}" id="${context}-${index}" name="updates[]" type="number" min="0" value="${item.quantity}"><a href="/remove" data-remove-line data-key="${item.key}">Remove</a></div></li>`).join('')}</ul><p>Subtotal $${items.reduce((sum,item) => sum + item.quantity * 30,0)}</p><button name="checkout">Checkout</button></form>` : '<p>Empty cart</p><a href="/products">Shop</a>'}</div>`;
}
function fixture(items = []) {
  return `<!doctype html><html lang="en"><head><style>${css}</style></head><body class="demo-store"><a class="skip-link" href="#MainContent">Skip to content</a><header class="demo-header demo-width"><a class="demo-brand" href="/">Personal Gifts</a><nav><a href="/products">Shop</a></nav><a href="/cart" data-open-cart>Cart (<span data-cart-count>0</span>)</a></header><main id="MainContent"><demo-product class="demo-product demo-width demo-band"><div class="demo-product-media" data-product-media><img src="/image.webp" width="800" height="800" sizes="(min-width:800px) 50vw,100vw"></div><div><h1>A personalized ring with an exceptionally long title for layout verification</h1><div data-variant-price></div><form><label data-variant-label for="variant">Variant</label><select name="id" id="variant" data-variant-select><option value="1">A/B</option><option value="2">B/A</option><option value="3">B/B</option></select><div data-option-pickers hidden><label for="finish">Finish</label><select id="finish" data-option-index="0"><option>A</option><option>B</option></select><label for="size">Size</label><select id="size" data-option-index="1"><option>A</option><option selected>B</option></select></div><label for="quantity">Quantity</label><input id="quantity" name="quantity" type="number" value="1" min="1" required><label for="engraving">Engraving</label><input id="engraving" name="properties[Engraving]" maxlength="40"><label for="gift">Gift message</label><textarea id="gift" name="properties[Gift message]" maxlength="200"></textarea><button name="add" type="submit">Add to cart</button><p data-product-error role="alert"></p></form></div><script type="application/json" data-variants>${JSON.stringify(variants)}</script></demo-product><section class="demo-width"><h2>Cart page fixture</h2>${cartMarkup(items,'main')}<p data-cart-error role="alert"></p></section></main><dialog id="DemoCartDrawer" class="demo-drawer" aria-labelledby="cartTitle"><div class="demo-drawer-heading"><h2 id="cartTitle">Cart</h2><button data-close-cart aria-label="Close">X</button></div>${cartMarkup(items,'drawer')}<p data-cart-error role="alert"></p></dialog><p id="DemoStatus" role="status" class="visually-hidden"></p><script type="application/json" id="DemoConfiguration">${JSON.stringify(configuration)}</script><script>${script}</script></body></html>`;
}
async function setup(browser, viewport = { width: 1280, height: 900 }) {
  const page = await browser.newPage({ viewport }); const state = { items: [], adds: 0, changes: [], fail: false, nullSections: false };
  const sections = () => Object.fromEntries(['main','drawer'].map((id) => [id, cartMarkup(state.items,id)]));
  await page.route('https://demo.test/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('.webp')) return route.fulfill({ contentType: 'image/webp', body: image });
    if (url.pathname === '/fr/cart/add.js') {
      state.adds++; await new Promise((resolve) => setTimeout(resolve, 60));
      if (state.fail) return route.fulfill({ status: 422, json: { description: 'Inventory changed.' } });
      const request = route.request(); const data = await new Request(request.url(), { method: 'POST', headers: request.headers(), body: request.postDataBuffer() }).formData();
      const properties = { Engraving: data.get('properties[Engraving]') || '' }; const variant = Number(data.get('id'));
      const existing = state.items.find((item) => item.variant === variant && item.properties.Engraving === properties.Engraving);
      if (existing) existing.quantity += Number(data.get('quantity')); else state.items.push({ key: `line-${state.items.length + 1}`, variant, quantity: Number(data.get('quantity')), properties });
      return route.fulfill({ json: { sections: state.nullSections ? { main: null, drawer: null } : sections() } });
    }
    if (url.pathname === '/fr/cart.js') return route.fulfill({ json: { item_count: state.items.reduce((sum,item) => sum + item.quantity,0) } });
    if (url.pathname === '/fr/cart/change.js') { const body = route.request().postDataJSON(); state.changes.push(body); const item = state.items.find((item) => item.key === body.id); item.quantity = body.quantity; state.items = state.items.filter((item) => item.quantity); return route.fulfill({ json: { sections: sections(), item_count: state.items.reduce((sum,item) => sum + item.quantity,0) } }); }
    if (url.searchParams.has('sections')) return route.fulfill({ json: sections() });
    return route.fulfill({ contentType: 'text/html', body: fixture(state.items).replace('<form>', '<form class="demo-product-form">') });
  });
  await page.goto('https://demo.test/fr/products/ring'); return { page, state };
}

test('browser product/cart flow: positional options, errors, properties, keys, focus, reload', async () => {
  const browser = await chromium.launch();
  try {
    const { page, state } = await setup(browser);
    await page.locator('#finish').selectOption('B'); assert.equal(await page.locator('[name=add]').innerText(), 'Sold out');
    await page.locator('#size').selectOption('A'); assert.equal(await page.locator('[name=id]').inputValue(), '2'); assert.equal(await page.locator('[data-variant-price]').innerText(), '$35.00');
    await page.locator('#finish').selectOption('A'); assert.equal(await page.locator('[name=add]').innerText(), 'Unavailable');
    await page.locator('#size').selectOption('B'); state.fail = true;
    await page.locator('[name=add]').click(); await page.waitForFunction(() => document.querySelector('[data-product-error]').textContent === 'Inventory changed.');
    assert.equal(await page.locator('[name=add]').isEnabled(), true); state.fail = false; state.nullSections = true;
    await page.locator('#engraving').fill(' Anny ');
    await page.evaluate(() => { document.querySelector('demo-product form').requestSubmit(); document.querySelector('demo-product form').requestSubmit(); });
    await page.waitForFunction(() => document.querySelector('dialog').open);
    assert.equal(state.adds, 2); assert.equal(state.items[0].properties.Engraving, 'Anny');
    for (let index = 0; index < 8; index++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => Boolean(document.activeElement.closest('dialog'))), true); }
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('dialog').open);
    await page.locator('#engraving').fill('Sam'); await page.locator('[name=add]').click(); await page.waitForFunction(() => document.querySelector('[data-cart-count]').textContent === '2');
    assert.equal(state.items.length, 2);
    await page.locator('dialog [data-cart-quantity]').first().fill('3'); await page.locator('dialog [data-cart-quantity]').first().dispatchEvent('change'); await page.waitForFunction(() => document.querySelector('[data-cart-count]').textContent === '4');
    assert.equal(state.changes[0].id, 'line-1'); assert.equal(state.items[1].quantity, 1);
    await page.locator('dialog [data-remove-line]').last().click(); await page.waitForFunction(() => document.querySelector('[data-cart-count]').textContent === '3');
    await page.locator('dialog [data-remove-line]').first().click(); await page.waitForFunction(() => document.querySelector('[data-cart-count]').textContent === '0');
    assert.match(await page.locator('dialog').innerText(), /Empty cart/);
    await page.keyboard.press('Escape'); await page.locator('[data-open-cart]').focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Escape'); assert.equal(await page.locator('[data-open-cart]').evaluate((node) => node === document.activeElement), true);
    // Replacing the section reconnects the custom element without duplicate form handlers.
    await page.evaluate(() => { const node = document.querySelector('demo-product'); node.replaceWith(node.cloneNode(true)); });
    await page.locator('[name=add]').click(); await page.waitForFunction(() => document.querySelector('[data-cart-count]').textContent === '1'); assert.equal(state.adds, 4);
    await page.close();
  } finally { await browser.close(); }
});
test('browser fixture has no horizontal overflow at mobile/tablet/desktop sizes', async () => {
  const browser = await chromium.launch(); mkdirSync(new URL('../test-results/', import.meta.url), { recursive: true });
  try { for (const width of [375,768,1440]) {
    const { page } = await setup(browser,{ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow at ${width}`);
    assert.equal(await page.locator('img').first().evaluate((node) => node.complete && node.naturalWidth > 0), true);
    await page.screenshot({ path: new URL(`../test-results/demo-${width}.png`,import.meta.url).pathname.replace(/^\/(\w:)/,'$1'), fullPage: true });
    await page.locator('[data-open-cart]').click(); assert.equal(await page.locator('dialog').evaluate((node) => node.getBoundingClientRect().width <= innerWidth), true); await page.close();
  } } finally { await browser.close(); }
});
