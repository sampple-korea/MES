const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const repoRoot = path.resolve(__dirname, '..');
const scriptFile = process.env.MES_SCRIPT_FILE || 'MES.js';
const scriptText = fs.readFileSync(path.join(repoRoot, scriptFile), 'utf8');

function buildLexicalGmScript(storage) {
  const serializedStorage = JSON.stringify(storage || {}).replace(/</g, '\\u003c');
  return `(() => {
    const __mesGmStore = new Map(Object.entries(${serializedStorage}));
    const GM_getValue = (key, defaultValue) => __mesGmStore.has(key) ? __mesGmStore.get(key) : defaultValue;
    const GM_setValue = (key, value) => { __mesGmStore.set(key, value); };
    const GM_setClipboard = () => {};
    ${scriptText}
  })();`;
}

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
  const scriptContent = viewportOptions.lexicalGmStorage ? buildLexicalGmScript(viewportOptions.lexicalGmStorage) : scriptText;
  await page.addScriptTag({ content: scriptContent });
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

  const lowPowerNotice = await page.locator('#settings-low-power-note').innerText();
  if (!lowPowerNotice.includes('차단 성능')) throw new Error(`low power warning was not shown: ${lowPowerNotice}`);
  await page.locator('#settings-low-power').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('mobileElementSelectorSettings_v1_2') || '{}').lowPowerMode === true, null, { timeout: 5000 });
  const lowPowerSettings = await page.evaluate(() => JSON.parse(localStorage.getItem('mobileElementSelectorSettings_v1_2')));
  if (!lowPowerSettings.lowPowerMode) throw new Error(`low power mode was not saved: ${JSON.stringify(lowPowerSettings)}`);

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

async function runLanguageFlow(browser) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin: 0; font-family: system-ui, sans-serif; background: #f6f7f9; }
        main { padding: 20px; display: grid; gap: 14px; }
        .content-card { padding: 24px; border-radius: 12px; background: white; }
      </style>
    </head>
    <body><main><section class="content-card">Language target</section></main></body>
  </html>`;

  {
    const { context, page } = await openMesPage(browser, html, {});
    await page.locator('#mobile-block-toggleBtn').click();
    await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });
    const defaultPickerLabel = await page.locator('#blocker-info-label').innerText();
    if (!defaultPickerLabel.includes('선택된 요소')) throw new Error(`default language should be Korean: ${defaultPickerLabel}`);
    await page.locator('#blocker-more').click();
    await page.waitForSelector('#blocker-secondary-actions.visible', { timeout: 5000 });
    await page.locator('#blocker-settings').click();
    await page.waitForSelector('#mobile-settings-panel.visible', { timeout: 5000 });
    const activeLanguage = await page.locator('.language-option-btn.active').getAttribute('data-ui-language');
    if (activeLanguage !== 'ko') throw new Error(`default active language should be ko: ${activeLanguage}`);
    await assertNoClippedText(page, '#mobile-settings-panel .language-option-btn', 'language buttons default');
    await page.locator('[data-ui-language="en"]').click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('mobileElementSelectorSettings_v1_2') || '{}').uiLanguage === 'en', null, { timeout: 5000 });
    const savedLanguage = await page.evaluate(() => JSON.parse(localStorage.getItem('mobileElementSelectorSettings_v1_2') || '{}').uiLanguage);
    if (savedLanguage !== 'en') throw new Error(`language setting was not saved: ${savedLanguage}`);
    await context.close();
  }

  {
    const { context, page } = await openMesPage(browser, html, { uiLanguage: 'invalid-language' });
    await page.locator('#mobile-block-toggleBtn').click();
    await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });
    const normalizedPickerLabel = await page.locator('#blocker-info-label').innerText();
    if (!normalizedPickerLabel.includes('선택된 요소')) {
      throw new Error(`invalid language should normalize to Korean: ${normalizedPickerLabel}`);
    }
    await page.locator('#blocker-more').click();
    await page.waitForSelector('#blocker-secondary-actions.visible', { timeout: 5000 });
    await page.locator('#blocker-settings').click();
    await page.waitForSelector('#mobile-settings-panel.visible', { timeout: 5000 });
    const normalizedActiveLanguage = await page.locator('.language-option-btn.active').getAttribute('data-ui-language');
    if (normalizedActiveLanguage !== 'ko') {
      throw new Error(`invalid language active button should normalize to ko: ${normalizedActiveLanguage}`);
    }
    await context.close();
  }

  const languageExpectations = [
    { code: 'en', pickerLabel: 'Selected Element', settingsTitle: 'Settings', note: 'Blocking performance' },
    { code: 'zh', pickerLabel: '已选元素', settingsTitle: '设置', note: '屏蔽性能' },
    { code: 'ja', pickerLabel: '選択した要素', settingsTitle: '設定', note: 'ブロック性能' }
  ];

  for (const expectation of languageExpectations) {
    const { context, page } = await openMesPage(browser, html, { uiLanguage: expectation.code });
    await page.locator('#mobile-block-toggleBtn').click();
    await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });
    const pickerLabel = await page.locator('#blocker-info-label').innerText();
    if (!pickerLabel.includes(expectation.pickerLabel)) {
      throw new Error(`${expectation.code} picker label mismatch: ${pickerLabel}`);
    }
    await page.locator('#blocker-more').click();
    await page.waitForSelector('#blocker-secondary-actions.visible', { timeout: 5000 });
    await page.locator('#blocker-settings').click();
    await page.waitForSelector('#mobile-settings-panel.visible', { timeout: 5000 });
    const settingsTitle = await page.locator('#mobile-settings-panel .mb-panel-title').innerText();
    if (settingsTitle.trim() !== expectation.settingsTitle) {
      throw new Error(`${expectation.code} settings title mismatch: ${settingsTitle}`);
    }
    const activeLanguage = await page.locator('.language-option-btn.active').getAttribute('data-ui-language');
    if (activeLanguage !== expectation.code) {
      throw new Error(`${expectation.code} active language mismatch: ${activeLanguage}`);
    }
    const lowPowerNotice = await page.locator('#settings-low-power-note').innerText();
    if (!lowPowerNotice.includes(expectation.note)) {
      throw new Error(`${expectation.code} low power notice mismatch: ${lowPowerNotice}`);
    }
    await assertNoClippedText(page, '#mobile-settings-panel .mb-btn', `localized settings controls ${expectation.code}`);
    await context.close();
  }
}

async function runHideStrategyNoticeFlow(browser) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin: 0; font-family: system-ui, sans-serif; background: #f6f7f9; }
        main { padding: 20px; display: grid; gap: 14px; }
        .content-card { padding: 24px; border-radius: 12px; background: white; }
      </style>
    </head>
    <body><main><section class="content-card">Hide strategy target</section></main></body>
  </html>`;

  const { context, page } = await openMesPage(browser, html, { hideStrategy: 'stylesheet' });
  await page.locator('#mobile-block-toggleBtn').click();
  await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });
  await page.locator('#blocker-more').click();
  await page.waitForSelector('#blocker-secondary-actions.visible', { timeout: 5000 });
  await page.locator('#blocker-settings').click();
  await page.waitForSelector('#mobile-settings-panel.visible', { timeout: 5000 });

  const expectations = [
    { strategy: 'stylesheet', text: ['장점', 'CSS', '동적 페이지'] },
    { strategy: 'display', text: ['장점', '빈 공간', 'display'] },
    { strategy: 'visibility', text: ['장점', '공간', 'pointer-events'] },
    { strategy: 'opacity', text: ['장점', '투명', '공간'] }
  ];

  for (const expectation of expectations) {
    await page.locator(`[data-hide-strategy="${expectation.strategy}"]`).click();
    await page.waitForFunction(strategy => {
      const settings = JSON.parse(localStorage.getItem('mobileElementSelectorSettings_v1_2') || '{}');
      return settings.hideStrategy === strategy;
    }, expectation.strategy, { timeout: 5000 });
    const activeStrategy = await page.locator('.hide-strategy-btn.active').getAttribute('data-hide-strategy');
    if (activeStrategy !== expectation.strategy) {
      throw new Error(`hide strategy active button mismatch: ${activeStrategy}`);
    }
    const note = await page.locator('#settings-hide-strategy-note').innerText();
    for (const text of expectation.text) {
      if (!note.includes(text)) throw new Error(`hide strategy notice missing "${text}" for ${expectation.strategy}: ${note}`);
    }
  }

  await context.close();
}

async function runSelectionCaptureFlow(browser) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin: 0; min-height: 1200px; font-family: system-ui, sans-serif; background: #f6f7f9; }
        main { padding: 20px; display: grid; gap: 14px; }
        .content-card { padding: 24px; border-radius: 12px; background: white; }
        .sticky-ad-link {
          position: fixed;
          left: 18px;
          right: 18px;
          top: 112px;
          z-index: 2147483647;
          display: block;
          min-height: 120px;
          padding: 22px;
          border-radius: 14px;
          background: #fff2d8;
          color: #4a2d00;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <main>
        <section class="content-card">Content</section>
        <a class="sticky-ad-link" href="#ad-clicked">Sticky ad link</a>
      </main>
      <script>
        window.__activationEvents = [];
        const ad = document.querySelector('.sticky-ad-link');
        ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach(type => {
          ad.addEventListener(type, () => window.__activationEvents.push('ad:' + type));
        });
        document.body.addEventListener('click', event => {
          if (event.target.closest('.sticky-ad-link')) window.__activationEvents.push('body:click');
        });
      </script>
    </body>
  </html>`;

  const { context, page, pageErrors } = await openMesPage(browser, html, {
    compactPickerMode: false,
    hideStrategy: 'stylesheet'
  });

  await page.locator('#mobile-block-toggleBtn').click();
  await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });
  await page.waitForSelector('#mes-selection-capture-layer.active', { timeout: 5000 });
  const captureBox = await page.locator('#mes-selection-capture-layer').boundingBox();
  if (!captureBox || captureBox.width < 300 || captureBox.height < 600) {
    throw new Error(`selection capture layer is not covering the viewport: ${JSON.stringify(captureBox)}`);
  }
  const targetBox = await page.locator('.sticky-ad-link').boundingBox();
  await page.touchscreen.tap(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
  await page.waitForTimeout(350);
  const activationEvents = await page.evaluate(() => window.__activationEvents);
  if (activationEvents.length) throw new Error(`selection mode leaked page activation events: ${activationEvents.join(', ')}`);
  const hash = await page.evaluate(() => location.hash);
  if (hash) throw new Error(`selection mode allowed link navigation: ${hash}`);
  const selected = await page.locator('#blocker-info').innerText();
  if (!selected.includes('sticky-ad-link')) throw new Error(`sticky ad was not selected: ${selected}`);
  await context.close();
  if (pageErrors.length) throw new Error(`selection capture flow page errors: ${pageErrors.join('\\n')}`);
}

async function runFrameWorkerFlow(browser) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin: 0; font-family: system-ui, sans-serif; background: #f6f7f9; }
        main { padding: 20px; display: grid; gap: 14px; }
        iframe { width: 100%; height: 220px; border: 1px solid #ddd; border-radius: 12px; background: white; }
      </style>
    </head>
    <body>
      <main>
        <section class="content-card">Top content</section>
        <iframe id="ad-frame" srcdoc='<!doctype html>
          <html>
            <head>
              <style>
                body { margin: 0; font-family: system-ui, sans-serif; }
                .frame-ad { min-height: 120px; margin: 18px; padding: 20px; background: #fff2d8; border: 1px solid #ffd48a; }
                .frame-content { margin: 18px; padding: 20px; background: #fff; }
              </style>
            </head>
            <body>
              <section class="frame-ad">Frame ad</section>
              <section class="frame-content">Frame content</section>
            </body>
          </html>'></iframe>
      </main>
    </body>
  </html>`;

  const { context, page, pageErrors } = await openMesPage(browser, html, {
    hideStrategy: 'stylesheet',
    observeDomChanges: true
  });
  const frame = await page.waitForFunction(() => {
    const iframe = document.querySelector('#ad-frame');
    return iframe?.contentWindow?.document?.readyState === 'complete';
  }, null, { timeout: 5000 }).then(() => page.frames().find(candidate => candidate.parentFrame() === page.mainFrame()));
  if (!frame) throw new Error('iframe was not available for frame worker test');

  const frameScript = buildLexicalGmScript({
    mobileElementSelectorSettings_v1_2: JSON.stringify({
      hideStrategy: 'stylesheet',
      observeDomChanges: true
    }),
    mobileBlockedSelectors_v2: JSON.stringify(['##.frame-ad', '##.late-frame-ad'])
  });
  await frame.addScriptTag({ content: frameScript });
  await frame.waitForFunction(() => !document.querySelector('#mobile-block-toggleBtn') && !document.querySelector('#mobile-block-panel') && !document.querySelector('#mes-ui-style'), null, { timeout: 5000 });
  await frame.waitForFunction(() => getComputedStyle(document.querySelector('.frame-ad')).display === 'none', null, { timeout: 5000 });
  await frame.evaluate(() => {
    const node = document.createElement('section');
    node.className = 'late-frame-ad';
    node.textContent = 'Late frame ad';
    document.body.appendChild(node);
  });
  await frame.waitForFunction(() => getComputedStyle(document.querySelector('.late-frame-ad')).display === 'none', null, { timeout: 6000 });

  await context.close();
  if (pageErrors.length) throw new Error(`frame worker flow page errors: ${pageErrors.join('\\n')}`);
}

async function runUiFrontGuardFlow(browser) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin: 0; min-height: 100vh; font-family: system-ui, sans-serif; background: #f6f7f9; }
        main { padding: 20px; }
        .content-card { padding: 24px; border-radius: 12px; background: white; }
      </style>
    </head>
    <body>
      <main><section class="content-card">Top guard target</section></main>
    </body>
  </html>`;

  const { context, page, pageErrors } = await openMesPage(browser, html, {});
  await page.waitForSelector('#mobile-block-toggleBtn', { timeout: 5000 });
  await page.evaluate(() => {
    const button = document.querySelector('#mobile-block-toggleBtn');
    const rect = button.getBoundingClientRect();
    const host = document.createElement('div');
    host.id = 'external-root-host';
    Object.assign(host.style, {
      all: 'initial',
      position: 'fixed',
      top: '0',
      left: '0',
      width: '0',
      height: '0',
      zIndex: '2147483647',
      pointerEvents: 'none'
    });
    const blocker = document.createElement('button');
    blocker.id = 'external-root-overlay';
    blocker.textContent = 'external';
    Object.assign(blocker.style, {
      position: 'fixed',
      left: `${rect.left - 6}px`,
      top: `${rect.top - 6}px`,
      width: `${rect.width + 12}px`,
      height: `${rect.height + 12}px`,
      zIndex: '2147483647',
      border: '0',
      pointerEvents: 'auto',
      background: 'rgba(255,0,0,0.2)'
    });
    host.appendChild(blocker);
    document.documentElement.appendChild(host);
  });
  await page.waitForFunction(() => {
    const button = document.querySelector('#mobile-block-toggleBtn');
    if (!button) return false;
    const rect = button.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === button || button.contains(hit);
  }, null, { timeout: 5000 });
  await page.waitForFunction(() => {
    const root = Array.from(document.querySelectorAll('#mes-ui-root'))
      .find(node => node.getAttribute('data-mes-owner') === 'ui-root');
    return root && document.documentElement.lastElementChild === root;
  }, null, { timeout: 5000 });
  const hostState = await page.evaluate(() => {
    const root = Array.from(document.querySelectorAll('#mes-ui-root'))
      .find(node => node.getAttribute('data-mes-owner') === 'ui-root');
    return {
      rootIsDocumentTop: document.documentElement.lastElementChild === root,
      rootPointerEvents: root ? getComputedStyle(root).pointerEvents : '',
      rootChildren: root ? Array.from(root.children).map(node => node.id) : []
    };
  });
  const expectedOrder = [
    'mes-selection-capture-layer',
    'mobile-block-panel',
    'mobile-blocklist-panel',
    'mobile-inspector-panel',
    'mobile-settings-panel',
    'mobile-block-toggleBtn',
    'mes-toast-container'
  ];
  if (!hostState.rootIsDocumentTop) {
    throw new Error('MES UI root does not own the documentElement top slot');
  }
  if (hostState.rootPointerEvents !== 'none') {
    throw new Error(`MES UI root should not block page hit testing outside children: ${hostState.rootPointerEvents}`);
  }
  if (hostState.rootChildren.join('|') !== expectedOrder.join('|')) {
    throw new Error(`MES UI root child order is wrong: ${hostState.rootChildren.join(', ')}`);
  }
  await page.evaluate(() => {
    const hostileStyle = document.createElement('style');
    hostileStyle.id = 'external-hide-mes-style';
    hostileStyle.textContent = `
      #mes-ui-root { display: none !important; z-index: 1 !important; visibility: hidden !important; }
      html > #mes-ui-root[data-mes-owner="ui-root"] #mobile-block-toggleBtn {
        display: none !important;
        visibility: hidden !important;
        z-index: 1 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(hostileStyle);
  });
  await page.waitForFunction(() => {
    const root = document.querySelector('#mes-ui-root');
    const button = document.querySelector('#mobile-block-toggleBtn');
    if (!root) return false;
    const computed = getComputedStyle(root);
    const buttonComputed = button ? getComputedStyle(button) : null;
    return computed.display !== 'none' &&
      computed.visibility === 'visible' &&
      computed.zIndex === '2147483647' &&
      buttonComputed &&
      buttonComputed.display !== 'none' &&
      buttonComputed.visibility === 'visible' &&
      buttonComputed.zIndex === '2147483647' &&
      buttonComputed.pointerEvents !== 'none' &&
      document.head.lastElementChild?.id === 'mes-ui-style';
  }, null, { timeout: 5000 });
  await page.evaluate(() => {
    const button = document.querySelector('#mobile-block-toggleBtn');
    const rect = button.getBoundingClientRect();
    const dialog = document.createElement('dialog');
    dialog.id = 'external-modeless-dialog';
    dialog.textContent = 'modeless';
    Object.assign(dialog.style, {
      position: 'fixed',
      left: `${rect.left - 8}px`,
      top: `${rect.top - 8}px`,
      width: `${rect.width + 16}px`,
      height: `${rect.height + 16}px`,
      margin: '0',
      padding: '0',
      border: '0',
      zIndex: '2147483647',
      background: 'rgba(255,128,0,0.22)'
    });
    document.body.appendChild(dialog);
    if (typeof dialog.show === 'function') {
      dialog.show();
    } else {
      dialog.setAttribute('open', '');
    }
  });
  await page.waitForFunction(() => {
    const root = document.querySelector('#mes-ui-root');
    const button = document.querySelector('#mobile-block-toggleBtn');
    if (!root || !button) return false;
    let rootModal = false;
    try {
      rootModal = root.matches(':modal');
    } catch (e) {}
    const rect = button.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return !rootModal && (hit === button || button.contains(hit));
  }, null, { timeout: 5000 });
  await page.evaluate(() => document.querySelector('#external-modeless-dialog')?.remove());
  await page.evaluate(() => {
    const button = document.querySelector('#mobile-block-toggleBtn');
    const rect = button.getBoundingClientRect();
    const popover = document.createElement('button');
    popover.id = 'external-top-layer-popover';
    popover.setAttribute('popover', 'manual');
    popover.textContent = 'popover';
    Object.assign(popover.style, {
      position: 'fixed',
      left: `${rect.left - 8}px`,
      top: `${rect.top - 8}px`,
      width: `${rect.width + 16}px`,
      height: `${rect.height + 16}px`,
      margin: '0',
      padding: '0',
      border: '0',
      background: 'rgba(0,255,128,0.22)'
    });
    document.body.appendChild(popover);
    if (typeof popover.showPopover === 'function') {
      popover.showPopover();
    }
  });
  await page.waitForFunction(() => {
    const root = document.querySelector('#mes-ui-root');
    const button = document.querySelector('#mobile-block-toggleBtn');
    if (!root || !button) return false;
    let rootModal = false;
    try {
      rootModal = root.matches(':modal');
    } catch (e) {}
    const rect = button.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return !rootModal && (hit === button || button.contains(hit));
  }, null, { timeout: 5000 });
  await page.evaluate(() => document.querySelector('#external-top-layer-popover')?.hidePopover?.());
  await page.evaluate(() => {
    const button = document.querySelector('#mobile-block-toggleBtn');
    const rect = button.getBoundingClientRect();
    const dialog = document.createElement('dialog');
    dialog.id = 'external-top-layer-dialog';
    dialog.textContent = 'dialog';
    Object.assign(dialog.style, {
      position: 'fixed',
      left: `${rect.left - 8}px`,
      top: `${rect.top - 8}px`,
      width: `${rect.width + 16}px`,
      height: `${rect.height + 16}px`,
      margin: '0',
      padding: '0',
      border: '0',
      background: 'rgba(0,0,255,0.22)'
    });
    document.body.appendChild(dialog);
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  });
  await page.waitForFunction(() => {
    const button = document.querySelector('#mobile-block-toggleBtn');
    if (!button) return false;
    const rect = button.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === button || button.contains(hit);
  }, null, { timeout: 5000 });
  await page.evaluate(() => document.querySelector('#external-top-layer-dialog')?.close?.());
  await page.evaluate(() => {
    const button = document.querySelector('#mobile-block-toggleBtn');
    const rect = button.getBoundingClientRect();
    const host = document.createElement('div');
    host.id = 'external-shadow-modal-host';
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const dialog = document.createElement('dialog');
    dialog.id = 'external-shadow-dialog';
    dialog.textContent = 'shadow-dialog';
    Object.assign(dialog.style, {
      position: 'fixed',
      left: `${rect.left - 8}px`,
      top: `${rect.top - 8}px`,
      width: `${rect.width + 16}px`,
      height: `${rect.height + 16}px`,
      margin: '0',
      padding: '0',
      border: '0',
      background: 'rgba(128,0,255,0.22)'
    });
    shadow.appendChild(dialog);
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  });
  await page.waitForFunction(() => {
    const button = document.querySelector('#mobile-block-toggleBtn');
    if (!button) return false;
    const rect = button.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === button || button.contains(hit);
  }, null, { timeout: 5000 });
  await page.evaluate(() => document.querySelector('#external-shadow-modal-host')?.shadowRoot?.querySelector('dialog')?.close?.());
  await page.evaluate(() => {
    const root = document.querySelector('#mes-ui-root');
    root.style.setProperty('display', 'none', 'important');
    root.style.setProperty('z-index', '1', 'important');
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('inert', '');
  });
  await page.waitForFunction(() => {
    const root = document.querySelector('#mes-ui-root');
    if (!root) return false;
    const computed = getComputedStyle(root);
    return !root.hidden &&
      !root.hasAttribute('aria-hidden') &&
      !root.hasAttribute('inert') &&
      computed.display !== 'none' &&
      computed.zIndex === '2147483647';
  }, null, { timeout: 5000 });
  await page.evaluate(() => {
    document.querySelector('#mes-ui-root')?.remove();
  });
  await page.waitForFunction(() => {
    const root = document.querySelector('#mes-ui-root');
    const button = document.querySelector('#mobile-block-toggleBtn');
    return root &&
      button &&
      root.contains(button) &&
      document.documentElement.lastElementChild === root &&
      getComputedStyle(button).visibility === 'visible';
  }, null, { timeout: 5000 });
  const recoveredHit = await page.evaluate(() => {
    const button = document.querySelector('#mobile-block-toggleBtn');
    const rect = button.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === button || button.contains(hit);
  });
  if (!recoveredHit) {
    throw new Error('MES UI did not recover front hit testing after root removal');
  }
  await context.close();
  if (pageErrors.length) throw new Error(`ui front guard flow page errors: ${pageErrors.join('\\n')}`);
}

async function runUiRootCollisionFlow(browser) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>body { margin: 0; min-height: 100vh; }</style>
    </head>
    <body>
      <div id="mes-ui-root" data-page-owned="true">Page-owned element</div>
      <main>Collision target</main>
    </body>
  </html>`;

  const { context, page, pageErrors } = await openMesPage(browser, html, {});
  const collisionState = await page.evaluate(() => {
    const roots = Array.from(document.querySelectorAll('#mes-ui-root'));
    const pageOwned = roots.find(node => node.getAttribute('data-page-owned') === 'true');
    const mesOwned = roots.find(node => node.getAttribute('data-mes-owner') === 'ui-root');
    const button = document.querySelector('#mobile-block-toggleBtn');
    return {
      count: roots.length,
      pageOwnedParent: pageOwned?.parentNode?.tagName || '',
      pageOwnedText: pageOwned?.textContent || '',
      mesOwnedParent: mesOwned?.parentNode?.tagName || '',
      mesOwnedIsTop: document.documentElement.lastElementChild === mesOwned,
      buttonInsideMesRoot: !!(mesOwned && button && mesOwned.contains(button))
    };
  });
  if (collisionState.count < 2 ||
    collisionState.pageOwnedParent !== 'BODY' ||
    !collisionState.pageOwnedText.includes('Page-owned element') ||
    collisionState.mesOwnedParent !== 'HTML' ||
    !collisionState.mesOwnedIsTop ||
    !collisionState.buttonInsideMesRoot) {
    throw new Error(`MES root collision handling failed: ${JSON.stringify(collisionState)}`);
  }
  await context.close();
  if (pageErrors.length) throw new Error(`ui root collision flow page errors: ${pageErrors.join('\\n')}`);
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
    { width: 300, height: 844 },
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
  await stylesheetPage.evaluate(() => {
    const sheets = Array.from(document.adoptedStyleSheets || []);
    const targetSheet = sheets.find(sheet => {
      try {
        return Array.from(sheet.cssRules || []).some(rule => rule.cssText.includes('.guard-ad'));
      } catch (error) {
        return false;
      }
    });
    if (targetSheet) {
      targetSheet.replaceSync('.guard-ad { display: block !important; }');
      return;
    }
    const node = document.querySelector('style#mes-rule-style[data-mes-style-owner="blocking"]');
    if (!node?.sheet) throw new Error('MES blocking stylesheet was not found');
    while (node.sheet.cssRules.length) node.sheet.deleteRule(0);
    node.sheet.insertRule('.guard-ad { display: block !important; }', 0);
  });
  await stylesheetPage.waitForFunction(() => getComputedStyle(document.querySelector('.guard-ad')).display !== 'none', null, { timeout: 5000 });
  await stylesheetPage.waitForFunction(() => getComputedStyle(document.querySelector('.guard-ad')).display === 'none', null, { timeout: 7000 });
  await stylesheetContext.close();

  const { context: inlineContext, page: inlinePage } = await openMesPage(
    browser,
    html,
    { observeDomChanges: true, hideStrategy: 'display' },
    { mobileBlockedSelectors_v2: ['mes.test##.inline-guard', 'mes.test##.dynamic-class-ad', 'mes.test###dynamic-id-ad', 'mes.test##.hidden-ad:not([hidden])'] }
  );
  await inlinePage.waitForFunction(() => getComputedStyle(document.querySelector('.inline-guard')).display === 'none', null, { timeout: 5000 });
  const inlineTamperApplied = await inlinePage.evaluate(() => {
    const target = document.querySelector('.inline-guard');
    target.style.setProperty('display', 'block', 'important');
    return target.style.getPropertyValue('display') === 'block';
  });
  if (!inlineTamperApplied) throw new Error('Inline style tamper was not applied');
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

  const { context: shadowContext, page: shadowPage } = await openMesPage(
    browser,
    html,
    { observeDomChanges: true, shadowDomSupport: true, hideStrategy: 'stylesheet' },
    { mobileBlockedSelectors_v2: ['mes.test##.late-shadow-ad'] }
  );
  await shadowPage.evaluate(() => {
    const host = document.querySelector('.class-watch');
    const root = host.attachShadow({ mode: 'open' });
    const target = document.createElement('div');
    target.className = 'late-shadow-ad';
    target.textContent = 'Late shadow target';
    root.appendChild(target);
  });
  await shadowPage.waitForFunction(() => {
    const target = document.querySelector('.class-watch')?.shadowRoot?.querySelector('.late-shadow-ad');
    return target && getComputedStyle(target).display === 'none';
  }, null, { timeout: 8000 });
  const shadowRuleInjected = await shadowPage.evaluate(() => {
    const root = document.querySelector('.class-watch')?.shadowRoot;
    const adoptedRule = Array.from(root?.adoptedStyleSheets || []).some(sheet => {
      try {
        return Array.from(sheet.cssRules || []).some(rule => rule.cssText.includes('.late-shadow-ad'));
      } catch (error) {
        return false;
      }
    });
    const styleNodeRule = Array.from(root?.querySelectorAll('style#mes-rule-style[data-mes-style-owner="blocking"]') || [])
      .some(node => node.textContent.includes('.late-shadow-ad'));
    return adoptedRule || styleNodeRule;
  });
  if (!shadowRuleInjected) throw new Error('Late shadow stylesheet rule was not injected');
  await shadowContext.close();
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

  const pickyLegacyKey = 'picky_blocked_rules';
  const { context, page } = await openMesPage(browser, html, { compactPickerMode: true }, {
    [pickyLegacyKey]: {
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
  await page.waitForFunction(() => {
    const el = document.querySelector('.legacy-ad');
    return el && getComputedStyle(el).display !== 'none' && el.classList.contains('mes-selector-candidate-match');
  }, null, { timeout: 5000 });
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
  const candidateRows = await page.locator('.selector-candidate-row').evaluateAll(rows => rows.map(row => ({
    title: row.querySelector('.selector-candidate-title')?.textContent || '',
    selector: row.querySelector('.selector-candidate-selector')?.textContent || ''
  })));
  if (!candidateRows.some(row => row.title.includes('고급') && /sponsor|slot/i.test(row.selector))) {
    throw new Error(`advanced block candidate was not shown: ${JSON.stringify(candidateRows)}`);
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

async function runLexicalGmStorageFlow(browser) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin: 0; font-family: system-ui, sans-serif; background: #f6f7f9; }
        main { padding: 20px; display: grid; gap: 14px; }
        .gm-ad { min-height: 96px; padding: 20px; border-radius: 12px; background: #fff2d8; }
      </style>
    </head>
    <body>
      <main>
        <section class="gm-ad">GM storage target</section>
        <section>Content</section>
      </main>
    </body>
  </html>`;
  const lexicalGmStorage = {
    mobileElementSelectorSettings_v1_2: JSON.stringify({ compactPickerMode: true, hideStrategy: 'stylesheet' }),
    mobileBlockedSelectors_v2: JSON.stringify(['mes.test##.gm-ad', 'other.example##.foreign-ad']),
    mobileDisabledSelectors_v1: '[]'
  };
  const { context, page } = await openMesPage(browser, html, {}, {}, { lexicalGmStorage });

  await page.locator('#mobile-block-toggleBtn').click();
  await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });
  await page.locator('#blocker-more').click();
  await page.waitForSelector('#blocker-secondary-actions.visible', { timeout: 5000 });
  await page.locator('#blocker-list').click();
  await page.waitForSelector('#mobile-blocklist-panel.visible', { timeout: 5000 });

  const currentRow = await page.locator('.blocklist-item').filter({ hasText: '.gm-ad' }).innerText();
  if (!currentRow.includes('현재 사이트') || !currentRow.includes('1개 매칭')) {
    throw new Error(`lexical GM current rule was not listed correctly: ${currentRow}`);
  }
  const foreignRow = await page.locator('.blocklist-item').filter({ hasText: '.foreign-ad' }).innerText();
  if (!foreignRow.includes('다른 사이트')) {
    throw new Error(`lexical GM other-site rule was not listed: ${foreignRow}`);
  }
  const localRules = await page.evaluate(() => localStorage.getItem('mobileBlockedSelectors_v2'));
  if (localRules) throw new Error(`lexical GM flow unexpectedly used page localStorage: ${localRules}`);

  await context.close();
}

async function runLocalFallbackMigrationFlow(browser) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin: 0; font-family: system-ui, sans-serif; background: #f6f7f9; }
        main { padding: 20px; display: grid; gap: 14px; }
        .fallback-ad { min-height: 96px; padding: 20px; border-radius: 12px; background: #fff2d8; }
      </style>
    </head>
    <body>
      <main>
        <section class="fallback-ad">Fallback storage target</section>
        <section>Content</section>
      </main>
    </body>
  </html>`;
  const { context, page } = await openMesPage(
    browser,
    html,
    { compactPickerMode: true, hideStrategy: 'stylesheet' },
    {
      mobileBlockedSelectors_v2: ['mes.test##.fallback-ad', 'other.example##.fallback-foreign'],
      mobileDisabledSelectors_v1: ['mes.test##.fallback-ad']
    },
    {
      lexicalGmStorage: {
        mobileBlockedSelectors_v2: '[]',
        mobileDisabledSelectors_v1: '[]'
      }
    }
  );

  await page.locator('#mobile-block-toggleBtn').click();
  await page.waitForSelector('#mobile-block-panel.visible', { timeout: 5000 });
  await page.locator('#blocker-more').click();
  await page.waitForSelector('#blocker-secondary-actions.visible', { timeout: 5000 });
  await page.locator('#blocker-list').click();
  await page.waitForSelector('#mobile-blocklist-panel.visible', { timeout: 5000 });

  const currentRow = await page.locator('.blocklist-item').filter({ hasText: '.fallback-ad' }).innerText();
  if (!currentRow.includes('현재 사이트') || !currentRow.includes('꺼짐')) {
    throw new Error(`fallback current rule was not migrated with disabled state: ${currentRow}`);
  }
  const foreignRow = await page.locator('.blocklist-item').filter({ hasText: '.fallback-foreign' }).innerText();
  if (!foreignRow.includes('다른 사이트')) {
    throw new Error(`fallback other-site rule was not migrated: ${foreignRow}`);
  }
  const remainingLocalValues = await page.evaluate(() => [
    localStorage.getItem('mobileElementSelectorSettings_v1_2'),
    localStorage.getItem('mobileBlockedSelectors_v2'),
    localStorage.getItem('mobileDisabledSelectors_v1')
  ]);
  if (remainingLocalValues.some(value => value !== null)) {
    throw new Error(`fallback storage keys were not cleared: ${JSON.stringify(remainingLocalValues)}`);
  }

  await context.close();
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    await runMainFlow(browser);
    await runLanguageFlow(browser);
    await runHideStrategyNoticeFlow(browser);
    await runSelectionCaptureFlow(browser);
    await runFrameWorkerFlow(browser);
    await runUiFrontGuardFlow(browser);
    await runUiRootCollisionFlow(browser);
    await runResponsiveClippingFlow(browser);
    await runAdvancedFlow(browser);
    await runBlockingGuardFlow(browser);
    await runLegacyImportFlow(browser);
    await runSelectorCandidateFlow(browser);
    await runLexicalGmStorageFlow(browser);
    await runLocalFallbackMigrationFlow(browser);
  } finally {
    await browser.close();
  }
  console.log('MES smoke tests passed');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
