const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const repoRoot = path.resolve(__dirname, '..');
const scriptText = fs.readFileSync(path.join(repoRoot, 'MES.js'), 'utf8');

async function openMesPage(browser, html, settings = {}) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', msg => {
    if (msg.type() === 'error') pageErrors.push(msg.text());
  });
  await page.route('http://mes.test/', route => route.fulfill({
    contentType: 'text/html',
    body: html
  }));
  await page.goto('http://mes.test/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(value => {
    localStorage.setItem('mobileElementSelectorSettings_v1_2', JSON.stringify(value));
  }, settings);
  await page.addScriptTag({ content: scriptText });
  await page.waitForSelector('#mobile-block-toggleBtn', { state: 'visible', timeout: 5000 });
  return { context, page, pageErrors };
}

async function runMainFlow(browser) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin: 0; font-family: system-ui, sans-serif; background: #f6f7f9; }
        main { padding: 20px; display: grid; gap: 14px; }
        .hero, .ad-banner, .content-card { padding: 24px; border-radius: 12px; background: white; }
        .ad-banner { background: #fff2d8; border: 1px solid #ffd48a; min-height: 110px; }
      </style>
    </head>
    <body>
      <main>
        <section class="hero">Hero</section>
        <section class="ad-banner promoted-slot" data-testid="ad-banner">Ad</section>
        <section class="content-card">Content</section>
      </main>
    </body>
  </html>`;

  const { context, page, pageErrors } = await openMesPage(browser, html, {
    compactPickerMode: true,
    hideStrategy: 'stylesheet'
  });

  await page.locator('#mobile-block-toggleBtn').click();
  await page.waitForSelector('#mobile-block-panel.visible.compact-picker', { timeout: 5000 });
  await page.locator('#blocker-more').click();
  await page.waitForSelector('#blocker-secondary-actions.visible', { timeout: 5000 });
  await page.locator('#blocker-settings').click();
  await page.waitForSelector('#mobile-settings-panel.visible', { timeout: 5000 });
  await page.locator('#settings-close').click();
  await page.waitForTimeout(250);

  const targetBox = await page.locator('[data-testid="ad-banner"]').boundingBox();
  await page.touchscreen.tap(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
  await page.waitForTimeout(250);
  const selected = await page.locator('#blocker-info').innerText();
  if (!selected.trim()) throw new Error('touch selection did not populate selector');

  await page.locator('#blocker-add-block').click();
  await page.waitForTimeout(350);
  await page.evaluate(() => {
    const node = document.createElement('section');
    node.className = 'ad-banner late-ad-slot';
    node.dataset.testid = 'ad-banner';
    node.textContent = 'Late dynamic ad';
    document.querySelector('main').appendChild(node);
  });
  await page.waitForTimeout(700);
  const dynamicHidden = await page.locator('.late-ad-slot').evaluate(el => getComputedStyle(el).display === 'none');
  if (!dynamicHidden) throw new Error('dynamic stylesheet blocking did not hide a later matching element');
  if (pageErrors.length) throw new Error(`page errors: ${pageErrors.join(' | ')}`);
  await context.close();
}

async function runAdvancedFlow(browser) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin: 0; font-family: system-ui, sans-serif; background: #f6f7f9; min-height: 844px; }
        .top-card { position: fixed; top: 80px; left: 20px; right: 20px; padding: 24px; border-radius: 12px; background: white; }
        .bottom-card { position: fixed; bottom: 120px; left: 20px; right: 20px; padding: 24px; border-radius: 12px; background: white; }
      </style>
    </head>
    <body>
      <section class="top-card">Top target</section>
      <section class="bottom-card">Bottom target</section>
    </body>
  </html>`;

  const { context, page } = await openMesPage(browser, html, { compactPickerMode: true });
  await page.locator('#mobile-block-toggleBtn').click();
  await page.waitForSelector('#mobile-block-panel.visible.compact-picker', { timeout: 5000 });

  const topBox = await page.locator('.top-card').boundingBox();
  await page.touchscreen.tap(topBox.x + topBox.width / 2, topBox.y + topBox.height / 2);
  await page.waitForTimeout(250);
  const topDockedBottom = await page.locator('#mobile-block-panel').evaluate(panel => panel.classList.contains('dock-bottom'));
  if (!topDockedBottom) throw new Error('top target did not keep picker docked bottom');

  const bottomBox = await page.locator('.bottom-card').boundingBox();
  await page.touchscreen.tap(bottomBox.x + bottomBox.width / 2, bottomBox.y + bottomBox.height / 2);
  await page.waitForTimeout(250);
  const bottomDockedTop = await page.locator('#mobile-block-panel').evaluate(panel => panel.classList.contains('dock-top'));
  if (!bottomDockedTop) throw new Error('bottom target did not move picker to top');

  await page.evaluate(() => {
    document.querySelector('#mobile-block-toggleBtn').remove();
    document.querySelector('#mobile-block-panel').remove();
    document.querySelector('#mes-ui-style').remove();
  });
  await page.waitForFunction(() => {
    const button = document.querySelector('#mobile-block-toggleBtn');
    const panel = document.querySelector('#mobile-block-panel');
    const style = document.querySelector('#mes-ui-style');
    return button && panel && style && style.textContent.includes('#mobile-block-toggleBtn');
  }, null, { timeout: 5000 });

  await context.close();
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    await runMainFlow(browser);
    await runAdvancedFlow(browser);
  } finally {
    await browser.close();
  }
  console.log('MES smoke tests passed');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
