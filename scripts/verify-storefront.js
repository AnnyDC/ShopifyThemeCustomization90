import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const preview = process.env.PREVIEW_URL || 'https://code-with-anny.myshopify.com/?preview_theme_id=167193444515';
const browser = await chromium.launch(); const context = await browser.newContext(); const page = await context.newPage();
const result = { preview, rendered: false, cartVerified: false, pages: [], blocked: null };
const errors = []; page.on('pageerror',(error) => errors.push(error.message));
mkdirSync('test-results',{recursive:true});
try {
  await page.goto(preview,{waitUntil:'domcontentloaded'});
  if (new URL(page.url()).pathname === '/password') {
    if (!process.env.STOREFRONT_PASSWORD) { result.blocked = 'Storefront password required; configure STOREFRONT_PASSWORD locally, never in chat.'; }
    else { await page.locator('[name=password]').fill(process.env.STOREFRONT_PASSWORD); await page.locator('form[action*="password"] [type=submit]').click(); await page.waitForLoadState('domcontentloaded'); }
  }
  if (!result.blocked) {
    await page.locator('.demo-product-card').first().waitFor();
    assert.equal(await page.locator('main h1').innerText(),'Personalized gifts');
    assert.equal(await page.getByText('Liquid error', { exact:false }).count(),0);
    result.rendered = true;
    const productUrl = await page.locator('.demo-product-card h3 a').first().getAttribute('href');
    const collectionUrl = await page.locator('.demo-text-link').getAttribute('href');
    for (const width of [375,768,1440]) {
      await page.setViewportSize({width,height:900}); await page.screenshot({path:`test-results/shopify-home-${width}.png`,fullPage:true});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,`Home overflow ${width}`);
      result.pages.push({page:'home',width,products:await page.locator('.demo-product-card').count()});
    }
    await page.goto(new URL(collectionUrl,preview).href,{waitUntil:'domcontentloaded'}); await page.locator('.demo-filters').waitFor();
    result.pages.push({page:'collection',heading:await page.locator('main h1').innerText(),filters:await page.locator('.demo-filters details').count()});
    await page.goto(new URL(productUrl,preview).href,{waitUntil:'domcontentloaded'}); await page.locator('demo-product').waitFor();
    const variants = await page.locator('[data-variants]').evaluate((node) => JSON.parse(node.textContent)); const available = variants.find((variant) => variant.available);
    if (!available) result.blocked = 'First catalog product has no available variant; configure stocked demo products.';
    else {
      for (let index=0;index<available.options.length;index++) await page.locator(`[data-option-index="${index}"]`).selectOption(available.options[index]);
      assert.equal(await page.locator('[data-variant-select]').inputValue(),String(available.id));
      for (const width of [375,768,1440]) { await page.setViewportSize({width,height:900}); await page.screenshot({path:`test-results/shopify-product-${width}.png`,fullPage:true}); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,`Product overflow ${width}`); }
      for (const engraving of ['Interview demo A','Interview demo B']) {
        await page.locator('[name="properties[Engraving]"]').fill(engraving); await page.locator('demo-product [name=add]').click(); await page.waitForFunction(() => document.querySelector('#DemoCartDrawer').open); await page.keyboard.press('Escape');
      }
      await page.locator('[data-open-cart]').click(); await page.locator('dialog .demo-cart-line').nth(1).waitFor();
      assert.equal(await page.locator('dialog .demo-cart-line').count(),2);
      const first = page.locator('dialog [data-cart-quantity]').first(); await first.fill('2'); await first.dispatchEvent('change'); await page.waitForFunction(() => document.querySelector('[data-cart-count]').textContent === '3');
      await page.screenshot({path:'test-results/shopify-cart-drawer.png',fullPage:true});
      await page.locator('dialog [data-remove-line]').last().click(); await page.waitForFunction(() => document.querySelector('[data-cart-count]').textContent === '2');
      await page.locator('dialog [data-remove-line]').first().click(); await page.waitForFunction(() => document.querySelector('[data-cart-count]').textContent === '0');
      result.cartVerified = true; result.pages.push({page:'product',heading:await page.locator('main h1').innerText(),variantCount:variants.length});
      await page.goto(new URL('/cart',preview).href,{waitUntil:'domcontentloaded'}); assert.equal(await page.locator('[data-cart-content]').count(),2);
    }
    assert.deepEqual(errors,[]);
  }
} catch (error) { result.blocked = error.message; process.exitCode = 1; }
finally { writeFileSync('docs/storefront-verification.json',JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify(result,null,2)); await browser.close(); }
