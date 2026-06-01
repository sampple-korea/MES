const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const repoRoot = path.resolve(__dirname, '..');
const scriptText = fs.readFileSync(path.join(repoRoot, 'MES.js'), 'utf8');

async function openMesPage(browser, html, settings = {}, extraStorage = {}, viewportOptions = {}) {
  const viewport = {
    width: viewportOptions.width || 390,
    height: viewportOptions.height || 844
  };
  const context = await browser.newContext({
    viewport,
    isMobile: viewportOptions.isMobile ?? true,
    hasTouch: viewportOptions.hasTouch ?? true,
    deviceScaleFactor: viewportOptions.deviceScaleFactor || 2
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
  await page.evaluate(({ settings, extraStorage }) => {
    localStorage.setItem('mobileElementSelectorSettings_v1_2', JSON.stringify(settings));
    Object.entries(extraStorage).forEach(([key, value]) => {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
  }, { settings, extraStorage });
  await page.addScriptTag({ content: scriptText });
  await page.waitForSelector('#mobile-block-toggleBtn', { state: 'visible', timeout: 5000 });
  return { context, page, pageErrors };
}

async function assertNoClippedText(page, selector, label) {
  const clipped = await page.locator(selector).evaluateAll(nodes => nodes
    .filter(node => {
      const text = (node.textContent || node.getAttribute('aria-label') || '').trim();
      if (!text) return false;
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || !node.getClientRects().length) return false;
      return node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1;
    })
    .map(node => (node.textContent || node.getAttribute('aria-label') || node.id || node.className).trim().replace(/\s+/g, ' ')));
  if (clipped.length) throw new Error(`${label} text clipped: ${clipped.join(', ')}`);
}

async function dragByTouch(page, selector, deltaX, deltaY) {
  const inlineTransition = await page.locator(selector).evaluate((el, { deltaX, deltaY }) => {
    const rect = el.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    function touchAt(x, y) {
      return {
        identifier: 1,
        target: el,
        clientX: x,
        clientY: y,
        pageX: x + window.scrollX,
        pageY: y + window.scrollY,
        screenX: x,
        screenY: y,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 0.5
      };
    }

    function send(type, x, y, active) {
      const event = new Event(type, { bubbles: true, cancelable: true });
      const changedTouch = touchAt(x, y);
      Object.defineProperty(event, 'touches', { value: active ? [changedTouch] : [] });
      Object.defineProperty(event, 'targetTouches', { value: active ? [changedTouch] : [] });
      Object.defineProperty(event, 'changedTouches', { value: [changedTouch] });
      el.dispatchEvent(event);
    }

    send('touchstart', startX, startY, true);
    send('touchmove', startX + deltaX, startY + deltaY, true);
    send('touchend', startX + deltaX, startY + deltaY, false);
    return el.style.transition;
  }, { deltaX, deltaY });
  await page.waitForTimeout(260);
  return inlineTransition;
}

async function fireLauncherGesture(page, fingerCount, tapCount) {
  await page.evaluate(({ fingerCount, tapCount }) => {
    function touchAt(index) {
      const x = 80 + index * 34;
      const y = 120;
      return {
        identifier: index + 1,
        target: document.body,
        clientX: x,
        clientY: y,
        pageX: x + window.scrollX,
        pageY: y + window.scrollY,
        screenX: x,
        screenY: y,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 0.5
      };
    }

    function send(type, touches) {
      const event = new Event(type, { bubbles: true, cancelable: true });
      const activeTouches = type === 'touchend' ? [] : touches;
      Object.defineProperty(event, 'touches', { value: activeTouches });
      Object.defineProperty(event, 'targetTouches', { value: activeTouches });
      Object.defineProperty(event, 'changedTouches', { value: touches });
      document.body.dispatchEvent(event);
    }

    for (let tap = 0; tap < tapCount; tap += 1) {
      const touches = Array.from({ length: fingerCount }, (_, index) => touchAt(index));
      send('touchstart', touches);
      send('touchend', touches);
    }
  }, { fingerCount, tapCount });
  await page.waitForTimeout(120);
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
        .ad-inner { display: block; margin-top: 74px; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.45); }
      </style>
    </head>
    <body>
      <main>
        <section class="hero">Hero</section>
        <section class="ad-banner promoted-slot" data-testid="ad-banner">Ad <span class="ad-inner">Nested marker</span></section>
        <section class="content-card">Content</section>
      </main>
    </body>
  </html>`;

  const { context, page, pageErrors } = await openMesPage(browser, html, {
    compactPickerMode: true,
    hideStrategy: 'stylesheet'
  });

  await page.locator('#mobile-block-toggleBtn').click();
  await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });
  const compactOnStart = await page.locator('#mobile-block-panel').evaluate(panel => panel.classList.contains('compact-picker'));
  if (compactOnStart) throw new Error('picker should not start in compact mode');
  const clippedPrimaryLabels = await page.locator('#mobile-block-panel .primary-action-grid .btn-label').evaluateAll(labels => labels
    .filter(label => label.offsetParent !== null && (label.scrollWidth > label.clientWidth + 1 || label.scrollHeight > label.clientHeight + 1))
    .map(label => label.textContent.trim()));
  if (clippedPrimaryLabels.length) throw new Error(`primary action labels are clipped: ${clippedPrimaryLabels.join(', ')}`);
  await page.locator('#blocker-more').click();
  await page.waitForSelector('#blocker-secondary-actions.visible', { timeout: 5000 });
  await page.locator('#blocker-settings').click();
  await page.waitForSelector('#mobile-settings-panel.visible', { timeout: 5000 });

  const importHiddenWithoutSource = await page.locator('#settings-legacy-import-item').evaluate(el => el.hidden);
  if (!importHiddenWithoutSource) throw new Error('legacy import menu should stay hidden without source data');

  const gestureDetailHidden = await page.locator('#gesture-detail-settings').evaluate(el => !el.classList.contains('visible'));
  if (!gestureDetailHidden) throw new Error('gesture details should be hidden in button launcher mode');
  await page.locator('[data-launcher-mode="gesture"]').click();
  await page.waitForFunction(() => document.querySelector('#gesture-detail-settings')?.classList.contains('visible'), null, { timeout: 5000 });
  await page.locator('[data-gesture-fingers="3"]').click();
  await page.locator('[data-gesture-taps="3"]').click();
  const gestureSettings = await page.evaluate(() => JSON.parse(localStorage.getItem('mobileElementSelectorSettings_v1_2')));
  if (!gestureSettings.hideToggleButton || gestureSettings.gestureFingerCount !== 3 || gestureSettings.gestureTapCount !== 3) {
    throw new Error(`gesture settings were not saved: ${JSON.stringify(gestureSettings)}`);
  }
  await page.locator('#settings-close').click();
  await page.waitForTimeout(250);
  await page.locator('#blocker-cancel').click();
  await page.waitForTimeout(200);
  await fireLauncherGesture(page, 3, 2);
  const openedTooEarly = await page.locator('#mobile-block-panel').evaluate(panel => panel.classList.contains('visible'));
  if (openedTooEarly) throw new Error('three-tap gesture opened after two taps');
  await fireLauncherGesture(page, 3, 1);
  await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });
  const gestureOpenedCompact = await page.locator('#mobile-block-panel').evaluate(panel => panel.classList.contains('compact-picker'));
  if (gestureOpenedCompact) throw new Error('gesture-opened picker should not start in compact mode');
  const selectedAfterGesture = await page.locator('#blocker-info').innerText();
  if (selectedAfterGesture.trim()) throw new Error(`gesture launch selected an element: ${selectedAfterGesture}`);
  await page.waitForTimeout(300);

  const targetBox = await page.locator('[data-testid="ad-banner"]').boundingBox();
  await page.touchscreen.tap(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
  await page.waitForTimeout(250);
  await page.waitForSelector('#mobile-block-panel.visible.compact-picker', { timeout: 5000 });
  const compactSliderBox = await page.locator('#mobile-block-panel.compact-picker #blocker-slider').boundingBox();
  if (!compactSliderBox || compactSliderBox.width < 80 || compactSliderBox.height < 24) {
    throw new Error(`compact navigation slider is not usable: ${JSON.stringify(compactSliderBox)}`);
  }
  const compactMoreVisible = await page.locator('#mobile-block-panel.compact-picker #blocker-more').evaluate(button => {
    const style = getComputedStyle(button);
    const rect = button.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width >= 28 && rect.height >= 26;
  });
  if (!compactMoreVisible) throw new Error('compact picker should keep the more action reachable');
  const navMax = await page.locator('#blocker-slider').evaluate(slider => Number(slider.max));
  if (navMax < 2) throw new Error(`navigation slider did not include descendant candidates: max=${navMax}`);
  await page.locator('#blocker-parent').click();
  await page.waitForTimeout(100);
  const parentSummary = await page.locator('#blocker-compact-summary').innerText();
  if (!parentSummary.includes('상위')) throw new Error(`compact parent navigation summary was not updated: ${parentSummary}`);
  await page.locator('#blocker-child').click();
  await page.locator('#blocker-child').click();
  await page.waitForTimeout(100);
  const childSummary = await page.locator('#blocker-compact-summary').innerText();
  if (!childSummary.includes('하위')) throw new Error(`compact child navigation summary was not updated: ${childSummary}`);
  await page.locator('#blocker-parent').click();
  await page.waitForTimeout(100);
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
  await page.locator('.mes-toast-action', { hasText: '되돌리기' }).last().click();
  await page.waitForTimeout(500);
  const rulesAfterUndo = await page.evaluate(() => JSON.parse(localStorage.getItem('mobileBlockedSelectors_v2') || '[]'));
  if (rulesAfterUndo.length) throw new Error(`undo did not remove saved rule: ${JSON.stringify(rulesAfterUndo)}`);
  const restoredAfterUndo = await page.locator('[data-testid="ad-banner"]').first().evaluate(el => getComputedStyle(el).display !== 'none');
  if (!restoredAfterUndo) throw new Error('undo did not restore the original matching element');
  const dynamicRestoredAfterUndo = await page.locator('.late-ad-slot').evaluate(el => getComputedStyle(el).display !== 'none');
  if (!dynamicRestoredAfterUndo) throw new Error('undo did not restore the dynamic matching element');
  if (pageErrors.length) throw new Error(`page errors: ${pageErrors.join(' | ')}`);
  await context.close();
}

async function runResponsiveClippingFlow(browser) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin: 0; font-family: system-ui, sans-serif; background: #f6f7f9; }
        main { padding: 16px; display: grid; gap: 12px; }
        .ad-card { min-height: 96px; padding: 18px; border-radius: 12px; background: #fff2d8; border: 1px solid #ffd48a; }
        .content-card { padding: 18px; border-radius: 12px; background: #fff; }
      </style>
    </head>
    <body>
      <main>
        <section class="ad-card promoted-slot" data-testid="responsive-ad">Responsive target</section>
        <section class="content-card">Content</section>
      </main>
    </body>
  </html>`;

  for (const viewport of [
    { width: 320, height: 844 },
    { width: 360, height: 844 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 }
  ]) {
    const { width, height } = viewport;
    const { context, page } = await openMesPage(browser, html, { compactPickerMode: true }, {}, { width, height });
    await page.locator('#mobile-block-toggleBtn').click();
    await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });
    await assertNoClippedText(page, '#mobile-block-panel .mb-btn, #mobile-block-panel .btn-label', `main panel ${width}px`);

    const targetBox = await page.locator('[data-testid="responsive-ad"]').boundingBox();
    await page.touchscreen.tap(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
    await page.waitForSelector('#mobile-block-panel.visible.compact-picker', { timeout: 5000 });
    await assertNoClippedText(page, '#mobile-block-panel .mb-btn, #mobile-block-panel .btn-label', `compact panel ${width}px`);

    await page.locator('#blocker-compact-toggle').click();
    await page.waitForFunction(() => !document.querySelector('#mobile-block-panel')?.classList.contains('compact-picker'), null, { timeout: 5000 });
    await page.locator('#blocker-more').click();
    await page.waitForSelector('#blocker-secondary-actions.visible', { timeout: 5000 });
    await assertNoClippedText(page, '#mobile-block-panel .mb-btn, #mobile-block-panel .btn-label', `expanded actions ${width}px`);

    await page.locator('#blocker-settings').click();
    await page.waitForSelector('#mobile-settings-panel.visible', { timeout: 5000 });
    const settingsPanelBox = await page.locator('#mobile-settings-panel').boundingBox();
    const launcherBox = await page.locator('.launcher-mode-grid').boundingBox();
    if (!settingsPanelBox || !launcherBox || launcherBox.y < settingsPanelBox.y || launcherBox.y > settingsPanelBox.y + settingsPanelBox.height - 44) {
      throw new Error(`launcher mode controls are not visible near the top at ${width}px: ${JSON.stringify({ settingsPanelBox, launcherBox })}`);
    }
    await page.locator('[data-launcher-mode="gesture"]').click();
    await page.waitForFunction(() => document.querySelector('#gesture-detail-settings')?.classList.contains('visible'), null, { timeout: 5000 });
    await assertNoClippedText(page, '#mobile-settings-panel .mb-btn', `settings controls ${width}px`);
    await page.locator('#settings-close').click();
    await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });

    const actionsVisible = await page.locator('#blocker-secondary-actions').evaluate(el => el.classList.contains('visible'));
    if (!actionsVisible) await page.locator('#blocker-more').click();
    await page.waitForSelector('#blocker-secondary-actions.visible', { timeout: 5000 });
    await page.locator('#blocker-inspect').click();
    await page.waitForSelector('#mobile-inspector-panel.visible', { timeout: 5000 });
    await page.waitForSelector('.selector-candidate-row', { timeout: 5000 });
    await assertNoClippedText(page, '#mobile-inspector-panel .mb-btn, #mobile-inspector-panel .selector-candidate-actions .mb-btn', `inspector controls ${width}px`);

    await context.close();
  }
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
  await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });
  const advancedCompactOnStart = await page.locator('#mobile-block-panel').evaluate(panel => panel.classList.contains('compact-picker'));
  if (advancedCompactOnStart) throw new Error('advanced picker should not start in compact mode');

  const topBox = await page.locator('.top-card').boundingBox();
  await page.touchscreen.tap(topBox.x + topBox.width / 2, topBox.y + topBox.height / 2);
  await page.waitForTimeout(250);
  await page.waitForSelector('#mobile-block-panel.visible.compact-picker', { timeout: 5000 });
  const topDockedBottom = await page.locator('#mobile-block-panel').evaluate(panel => panel.classList.contains('dock-bottom'));
  if (!topDockedBottom) throw new Error('top target did not keep picker docked bottom');

  const bottomBox = await page.locator('.bottom-card').boundingBox();
  await page.touchscreen.tap(bottomBox.x + bottomBox.width / 2, bottomBox.y + bottomBox.height / 2);
  await page.waitForTimeout(250);
  const bottomDockedTop = await page.locator('#mobile-block-panel').evaluate(panel => panel.classList.contains('dock-top'));
  if (!bottomDockedTop) throw new Error('bottom target did not move picker to top');

  const topTransition = await dragByTouch(page, '#mobile-block-panel', 0, -520);
  if (!/left|top|transform/.test(topTransition)) {
    throw new Error(`snap transition was not applied: ${topTransition}`);
  }
  const topSnap = await page.locator('#mobile-block-panel').evaluate(panel => {
    const rect = panel.getBoundingClientRect();
    return {
      anchor: panel.dataset.snapAnchor,
      top: rect.top,
      centerOffset: Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2),
      inlineTransition: panel.style.transition
    };
  });
  if (topSnap.anchor !== 'top-center' || topSnap.top > 24 || topSnap.centerOffset > 2) {
    throw new Error(`panel did not snap to top center: ${JSON.stringify(topSnap)}`);
  }
  if (topSnap.inlineTransition) throw new Error(`snap transition was not cleared: ${topSnap.inlineTransition}`);

  const bottomTransition = await dragByTouch(page, '#mobile-block-panel', 0, 720);
  if (!/left|top|transform/.test(bottomTransition)) {
    throw new Error(`bottom snap transition was not applied: ${bottomTransition}`);
  }
  const bottomSnap = await page.locator('#mobile-block-panel').evaluate(panel => {
    const rect = panel.getBoundingClientRect();
    return {
      anchor: panel.dataset.snapAnchor,
      bottomGap: window.innerHeight - rect.bottom,
      centerOffset: Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2),
      inlineTransition: panel.style.transition
    };
  });
  if (bottomSnap.anchor !== 'bottom-center' || bottomSnap.bottomGap > 24 || bottomSnap.centerOffset > 2) {
    throw new Error(`panel did not snap to bottom center: ${JSON.stringify(bottomSnap)}`);
  }
  if (bottomSnap.inlineTransition) throw new Error(`bottom snap transition was not cleared: ${bottomSnap.inlineTransition}`);

  await page.evaluate(() => {
    document.querySelector('#mobile-block-toggleBtn').remove();
    document.querySelector('#mobile-block-panel').remove();
    document.querySelector('#mes-ui-style').remove();
  });
  await page.waitForFunction(() => {
    const button = document.querySelector('#mobile-block-toggleBtn');
    const panel = document.querySelector('#mobile-block-panel');
    const style = document.querySelector('#mes-ui-style');
    return button && panel && style && style.textContent.includes('#mobile-block-toggleBtn') &&
      panel.classList.contains('visible') &&
      button.classList.contains('mobile-block-ui') &&
      panel.classList.contains('mobile-block-ui');
  }, null, { timeout: 5000 });
  await page.evaluate(() => {
    const button = document.querySelector('#mobile-block-toggleBtn');
    const panel = document.querySelector('#mobile-block-panel');
    const uiStyle = document.querySelector('#mes-ui-style');
    button.id = 'broken-toggle';
    button.className = '';
    button.hidden = true;
    button.style.setProperty('display', 'none', 'important');
    panel.id = 'broken-panel';
    panel.className = '';
    panel.hidden = true;
    panel.style.setProperty('display', 'none', 'important');
    uiStyle.id = 'broken-style';
    uiStyle.textContent = '';
  });
  await page.waitForFunction(() => {
    const button = document.querySelector('#mobile-block-toggleBtn');
    const panel = document.querySelector('#mobile-block-panel');
    const style = document.querySelector('#mes-ui-style');
    if (!button || !panel || !style) return false;
    const buttonStyle = getComputedStyle(button);
    const panelStyle = getComputedStyle(panel);
    return !button.hidden &&
      !panel.hidden &&
      button.classList.contains('mobile-block-ui') &&
      panel.classList.contains('mobile-block-ui') &&
      panel.classList.contains('visible') &&
      style.textContent.includes('#mobile-block-toggleBtn') &&
      buttonStyle.display !== 'none' &&
      panelStyle.display !== 'none';
  }, null, { timeout: 5000 });

  await context.close();
}

async function runBlockingGuardFlow(browser) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin: 0; font-family: system-ui, sans-serif; background: #f6f7f9; }
        .guard-ad, .inline-guard { min-height: 80px; margin: 12px; padding: 16px; background: #fff2d8; }
      </style>
    </head>
    <body>
      <section class="guard-ad">Stylesheet guarded target</section>
      <section class="inline-guard">Inline guarded target</section>
      <section class="class-watch">Class attribute target</section>
      <section class="id-watch">Id attribute target</section>
      <section class="hidden-watch hidden-ad" hidden>Hidden attribute target</section>
    </body>
  </html>`;

  const { context: stylesheetContext, page: stylesheetPage } = await openMesPage(
    browser,
    html,
    { observeDomChanges: true, hideStrategy: 'stylesheet' },
    { mobileBlockedSelectors_v2: ['mes.test##.guard-ad'] }
  );
  await stylesheetPage.waitForFunction(() => getComputedStyle(document.querySelector('.guard-ad')).display === 'none', null, { timeout: 5000 });
  await stylesheetPage.evaluate(() => {
    if (document.adoptedStyleSheets.length) {
      document.adoptedStyleSheets = [];
      return;
    }
    document.querySelectorAll('style#mes-rule-style[data-mes-style-owner="blocking"]').forEach(node => node.remove());
  });
  await stylesheetPage.waitForFunction(() => getComputedStyle(document.querySelector('.guard-ad')).display !== 'none', null, { timeout: 5000 });
  await stylesheetPage.waitForFunction(() => getComputedStyle(document.querySelector('.guard-ad')).display === 'none', null, { timeout: 6000 });
  await stylesheetContext.close();

  const { context: inlineContext, page: inlinePage } = await openMesPage(
    browser,
    html,
    { observeDomChanges: true, hideStrategy: 'display' },
    { mobileBlockedSelectors_v2: ['mes.test##.inline-guard', 'mes.test##.dynamic-class-ad', 'mes.test###dynamic-id-ad', 'mes.test##.hidden-ad:not([hidden])'] }
  );
  await inlinePage.waitForFunction(() => getComputedStyle(document.querySelector('.inline-guard')).display === 'none', null, { timeout: 5000 });
  await inlinePage.evaluate(() => {
    document.querySelector('.inline-guard').style.setProperty('display', 'block', 'important');
  });
  await inlinePage.waitForFunction(() => getComputedStyle(document.querySelector('.inline-guard')).display !== 'none', null, { timeout: 5000 });
  await inlinePage.waitForFunction(() => getComputedStyle(document.querySelector('.inline-guard')).display === 'none', null, { timeout: 5000 });
  await inlinePage.evaluate(() => {
    document.querySelector('.class-watch').classList.add('dynamic-class-ad');
    document.querySelector('.id-watch').id = 'dynamic-id-ad';
  });
  await inlinePage.waitForFunction(() => getComputedStyle(document.querySelector('.dynamic-class-ad')).display === 'none', null, { timeout: 5000 });
  await inlinePage.waitForFunction(() => getComputedStyle(document.querySelector('#dynamic-id-ad')).display === 'none', null, { timeout: 5000 });
  await inlinePage.evaluate(() => {
    document.querySelector('.hidden-watch').removeAttribute('hidden');
  });
  await inlinePage.waitForFunction(() => getComputedStyle(document.querySelector('.hidden-watch')).display === 'none', null, { timeout: 5000 });
  await inlineContext.close();
}

async function runLegacyImportFlow(browser) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin: 0; font-family: system-ui, sans-serif; background: #f6f7f9; }
        main { padding: 20px; display: grid; gap: 14px; }
        .legacy-ad { min-height: 96px; padding: 20px; border-radius: 12px; background: #fff2d8; }
      </style>
    </head>
    <body>
      <main>
        <section class="legacy-ad">Imported rule target</section>
        <section>Content</section>
      </main>
    </body>
  </html>`;

  const legacyKey = ['pi', 'cky_blocked_rules'].join('');
  const { context, page } = await openMesPage(browser, html, { compactPickerMode: true }, {
    [legacyKey]: {
      'mes.test': ['.legacy-ad', '.legacy-ad'],
      'other.example': ['.global-ad']
    },
    mobileBlockedSelectors_v2: ['other.example##.global-ad', 'mes.test##.stale-ad']
  });
  page.on('dialog', dialog => dialog.accept());

  await page.locator('#mobile-block-toggleBtn').click();
  await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });
  const importCompactOnStart = await page.locator('#mobile-block-panel').evaluate(panel => panel.classList.contains('compact-picker'));
  if (importCompactOnStart) throw new Error('import flow picker should not start in compact mode');
  await page.locator('#blocker-more').click();
  await page.waitForSelector('#blocker-secondary-actions.visible', { timeout: 5000 });
  await page.locator('#blocker-settings').click();
  await page.waitForSelector('#mobile-settings-panel.visible', { timeout: 5000 });
  await page.waitForFunction(() => {
    const item = document.querySelector('#settings-legacy-import-item');
    return item && !item.hidden;
  }, null, { timeout: 5000 });

  const summary = await page.locator('#legacy-import-summary').innerText();
  if (!summary.includes('새 규칙 1개')) throw new Error(`legacy import summary mismatch: ${summary}`);
  await page.locator('#settings-legacy-import').click();
  await page.waitForTimeout(500);

  const importedRules = await page.evaluate(() => JSON.parse(localStorage.getItem('mobileBlockedSelectors_v2')));
  if (!importedRules.includes('mes.test##.legacy-ad') || !importedRules.includes('other.example##.global-ad') || !importedRules.includes('mes.test##.stale-ad')) {
    throw new Error(`legacy rule was not imported: ${JSON.stringify(importedRules)}`);
  }
  if (importedRules.filter(rule => rule === 'other.example##.global-ad').length !== 1) {
    throw new Error(`pre-existing rule was duplicated: ${JSON.stringify(importedRules)}`);
  }
  const hidden = await page.locator('.legacy-ad').evaluate(el => getComputedStyle(el).display === 'none');
  if (!hidden) throw new Error('imported legacy rule was not applied');
  const importDisabled = await page.locator('#settings-legacy-import').evaluate(button => button.disabled);
  if (!importDisabled) throw new Error('legacy import button should be disabled after importing all rules');
  await page.locator('#settings-close').click();
  await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });
  const secondaryVisible = await page.locator('#blocker-secondary-actions').evaluate(el => el.classList.contains('visible'));
  if (!secondaryVisible) await page.locator('#blocker-more').click();
  await page.locator('#blocker-list').click();
  await page.waitForSelector('#mobile-blocklist-panel.visible', { timeout: 5000 });
  const legacyRow = await page.locator('.blocklist-item').filter({ hasText: '.legacy-ad' }).innerText();
  if (!legacyRow.includes('현재 사이트') || !legacyRow.includes('1개 매칭')) {
    throw new Error(`legacy rule impact chips missing: ${legacyRow}`);
  }
  const otherRow = await page.locator('.blocklist-item').filter({ hasText: '.global-ad' }).innerText();
  if (!otherRow.includes('다른 사이트')) {
    throw new Error(`other-site rule scope chip missing: ${otherRow}`);
  }
  const staleRow = await page.locator('.blocklist-item').filter({ hasText: '.stale-ad' }).innerText();
  if (!staleRow.includes('매칭 없음')) {
    throw new Error(`stale rule chip missing: ${staleRow}`);
  }
  await page.locator('.blocklist-item').filter({ hasText: '.legacy-ad' }).locator('.blocklist-rule').click();
  await page.locator('.mes-toast-action', { hasText: '해제' }).last().waitFor({ timeout: 5000 });
  const previewVisible = await page.locator('.legacy-ad').evaluate(el => getComputedStyle(el).display !== 'none' && el.classList.contains('mes-selector-candidate-match'));
  if (!previewVisible) throw new Error('saved rule preview did not reveal and mark matching elements');
  await page.locator('.mes-toast-action', { hasText: '해제' }).last().click();
  await page.waitForTimeout(350);
  const previewCleared = await page.locator('.legacy-ad').evaluate(el => getComputedStyle(el).display === 'none' && !el.classList.contains('mes-selector-candidate-match'));
  if (!previewCleared) throw new Error('saved rule preview did not restore blocking after clearing');
  await page.locator('#blocklist-prune-stale').click();
  await page.waitForTimeout(500);
  const prunedRules = await page.evaluate(() => JSON.parse(localStorage.getItem('mobileBlockedSelectors_v2')));
  if (prunedRules.includes('mes.test##.stale-ad') || !prunedRules.includes('mes.test##.legacy-ad') || !prunedRules.includes('other.example##.global-ad')) {
    throw new Error(`stale cleanup removed wrong rules: ${JSON.stringify(prunedRules)}`);
  }

  await context.close();
}

async function runSelectorCandidateFlow(browser) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin: 0; font-family: system-ui, sans-serif; background: #f6f7f9; }
        main { padding: 20px; display: grid; gap: 14px; }
        .candidate-ad { min-height: 96px; padding: 20px; border-radius: 12px; background: #fff2d8; }
      </style>
    </head>
    <body>
      <main>
        <section class="candidate-ad sponsored-slot" data-testid="candidate-ad">Candidate target</section>
        ${Array.from({ length: 8 }, (_, index) => `<section class="candidate-ad sponsored-slot">Repeated candidate ${index + 1}</section>`).join('')}
        <section>Content</section>
      </main>
    </body>
  </html>`;

  const { context, page } = await openMesPage(browser, html, { compactPickerMode: true });
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#mobile-block-toggleBtn').click();
  await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });
  const targetBox = await page.locator('[data-testid="candidate-ad"]').boundingBox();
  await page.touchscreen.tap(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
  await page.waitForSelector('#mobile-block-panel.visible.compact-picker', { timeout: 5000 });
  await page.locator('#blocker-compact-toggle').click();
  await page.waitForFunction(() => !document.querySelector('#mobile-block-panel')?.classList.contains('compact-picker'), null, { timeout: 5000 });
  await page.locator('#blocker-more').click();
  await page.waitForSelector('#blocker-secondary-actions.visible', { timeout: 5000 });
  await page.locator('#blocker-inspect').click();
  await page.waitForSelector('#mobile-inspector-panel.visible', { timeout: 5000 });
  await page.waitForSelector('.selector-candidate-row', { timeout: 5000 });

  const candidates = await page.locator('.selector-candidate-row').count();
  if (candidates < 2) throw new Error(`expected selector candidates, got ${candidates}`);
  const riskText = await page.locator('.selector-candidate-row').first().locator('.selector-candidate-analysis').innerText();
  if (!/(안정|정밀|위치 의존|넓음|복잡|확인 필요)/.test(riskText)) {
    throw new Error(`selector candidate risk analysis was not shown: ${riskText}`);
  }
  const candidateRiskTexts = await page.locator('.selector-candidate-analysis').evaluateAll(nodes => nodes.map(node => node.textContent || ''));
  if (!candidateRiskTexts.some(text => text.includes('넓음'))) {
    throw new Error(`broad selector risk was not shown: ${candidateRiskTexts.join(' | ')}`);
  }
  await page.locator('[data-inspector-action="preview-candidate"]').first().click();
  await page.waitForTimeout(150);
  const previewed = await page.locator('[data-testid="candidate-ad"]').evaluate(el => el.classList.contains('mes-selector-candidate-match'));
  if (!previewed) throw new Error('selector candidate preview did not mark matched elements');
  const previewStyle = await page.locator('[data-testid="candidate-ad"]').evaluate(el => {
    const style = getComputedStyle(el);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      backgroundColor: style.backgroundColor
    };
  });
  if (previewStyle.outlineStyle === 'none' || previewStyle.outlineWidth === '0px' || !previewStyle.backgroundColor.includes('52, 199, 89')) {
    throw new Error(`selector candidate preview style was not visible: ${JSON.stringify(previewStyle)}`);
  }
  const previewToast = await page.locator('#mes-toast-container .mes-toast.show').last().innerText();
  if (!previewToast.includes('후보') || !previewToast.includes('표시')) {
    throw new Error(`selector candidate preview toast was not shown: ${previewToast}`);
  }
  await page.locator('[data-inspector-action="save-candidate"]').first().click();
  await page.waitForTimeout(500);
  const previewCleared = await page.locator('[data-testid="candidate-ad"]').evaluate(el => !el.classList.contains('mes-selector-candidate-match'));
  if (!previewCleared) throw new Error('selector candidate preview was not cleared after saving');
  const savedRules = await page.evaluate(() => JSON.parse(localStorage.getItem('mobileBlockedSelectors_v2') || '[]'));
  if (!savedRules.some(rule => rule.startsWith('mes.test##') && rule.includes('candidate-ad'))) {
    throw new Error(`candidate rule was not saved: ${JSON.stringify(savedRules)}`);
  }
  const hidden = await page.locator('[data-testid="candidate-ad"]').evaluate(el => getComputedStyle(el).display === 'none');
  if (!hidden) throw new Error('saved selector candidate was not applied');

  await context.close();
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    await runMainFlow(browser);
    await runResponsiveClippingFlow(browser);
    await runAdvancedFlow(browser);
    await runBlockingGuardFlow(browser);
    await runLegacyImportFlow(browser);
    await runSelectorCandidateFlow(browser);
  } finally {
    await browser.close();
  }
  console.log('MES smoke tests passed');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
