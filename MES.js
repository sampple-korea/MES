// ==UserScript==
// @name         Mobile Element Selector (Marteial M3)
// @author       삼플 with Gemini
// @version      1.0.0
// @description  모바일 요소 선택기
// @match        *://*/*
// @license      MIT
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @downloadURL  https://raw.githubusercontent.com/sampple-korea/MES/refs/heads/main/MES.js
// @updateURL    https://raw.githubusercontent.com/sampple-korea/MES/refs/heads/main/MES.js
// ==/UserScript==

(async function() {
    'use strict';
    const SCRIPT_ID = "[MES v1.0.0-M3]"; // Updated version ID
    const ADGUARD_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/AdGuard.svg/500px-AdGuard.svg.png';

    // --- 기본 설정 값 정의 (Updated Defaults) ---
    const DEFAULT_SETTINGS = {
        includeSiteName: true,
        panelOpacity: 0.55, // Default opacity changed to 55%
        toggleSizeScale: 1.0,
        toggleOpacity: 1.0,
        showAdguardLogo: false // Default AdGuard logo changed to OFF
    };

    // --- 설정 값 로드 및 검증 ---
    let includeSiteName, panelOpacity, toggleSizeScale, toggleOpacity, showAdguardLogo;
    try {
        // Load settings individually with try/catch for robustness
        try { includeSiteName = await GM_getValue('includeSiteName', DEFAULT_SETTINGS.includeSiteName); }
        catch (e) { console.warn(SCRIPT_ID, `Error loading includeSiteName, using default: ${DEFAULT_SETTINGS.includeSiteName}`, e); includeSiteName = DEFAULT_SETTINGS.includeSiteName; }
        try { panelOpacity = parseFloat(await GM_getValue('panelOpacity', DEFAULT_SETTINGS.panelOpacity)); }
        catch (e) { console.warn(SCRIPT_ID, `Error loading panelOpacity, using default: ${DEFAULT_SETTINGS.panelOpacity}`, e); panelOpacity = DEFAULT_SETTINGS.panelOpacity; }
        try { toggleSizeScale = parseFloat(await GM_getValue('toggleSizeScale', DEFAULT_SETTINGS.toggleSizeScale)); }
        catch (e) { console.warn(SCRIPT_ID, `Error loading toggleSizeScale, using default: ${DEFAULT_SETTINGS.toggleSizeScale}`, e); toggleSizeScale = DEFAULT_SETTINGS.toggleSizeScale; }
        try { toggleOpacity = parseFloat(await GM_getValue('toggleOpacity', DEFAULT_SETTINGS.toggleOpacity)); }
        catch (e) { console.warn(SCRIPT_ID, `Error loading toggleOpacity, using default: ${DEFAULT_SETTINGS.toggleOpacity}`, e); toggleOpacity = DEFAULT_SETTINGS.toggleOpacity; }
        try { showAdguardLogo = await GM_getValue('showAdguardLogo', DEFAULT_SETTINGS.showAdguardLogo); }
        catch (e) { console.warn(SCRIPT_ID, `Error loading showAdguardLogo, using default: ${DEFAULT_SETTINGS.showAdguardLogo}`, e); showAdguardLogo = DEFAULT_SETTINGS.showAdguardLogo; }

        // Validation
        if (isNaN(panelOpacity)    || panelOpacity    < 0.1 || panelOpacity    > 1.0) panelOpacity    = DEFAULT_SETTINGS.panelOpacity;
        if (isNaN(toggleSizeScale) || toggleSizeScale < 0.5 || toggleSizeScale > 2.0) toggleSizeScale = DEFAULT_SETTINGS.toggleSizeScale;
        if (isNaN(toggleOpacity)   || toggleOpacity   < 0.1 || toggleOpacity   > 1.0) toggleOpacity   = DEFAULT_SETTINGS.toggleOpacity;

    } catch(e) {
        console.error(SCRIPT_ID, "Critical error during settings processing, using all defaults.", e);
        includeSiteName = DEFAULT_SETTINGS.includeSiteName;
        panelOpacity    = DEFAULT_SETTINGS.panelOpacity;
        toggleSizeScale = DEFAULT_SETTINGS.toggleSizeScale;
        toggleOpacity   = DEFAULT_SETTINGS.toggleOpacity;
        showAdguardLogo = DEFAULT_SETTINGS.showAdguardLogo;
    }

    const BLOCKED_SELECTORS_KEY = 'mobileBlockedSelectors_v2';

    // --- M3 Inspired CSS ---
    const style = document.createElement('style');
    style.textContent = `
/* ==== Root Variables ==== */
:root {
    /* M3 Dark Theme Color Palette */
    --md-sys-color-primary: #a0c9ff; --md-sys-color-on-primary: #00325a;
    --md-sys-color-primary-container: #004880; --md-sys-color-on-primary-container: #d1e4ff;
    --md-sys-color-secondary: #bdc7dc; --md-sys-color-on-secondary: #283141;
    --md-sys-color-secondary-container: #3e4758; --md-sys-color-on-secondary-container: #dae2f9;
    --md-sys-color-tertiary: #e0bddd; --md-sys-color-on-tertiary: #402843;
    --md-sys-color-tertiary-container: #583e5a; --md-sys-color-on-tertiary-container: #fdd9fa;
    --md-sys-color-error: #ffb4ab; --md-sys-color-on-error: #690005;
    --md-sys-color-error-container: #93000a; --md-sys-color-on-error-container: #ffdad6;
    --md-sys-color-background: #1a1c1e; --md-sys-color-on-background: #e3e2e6;
    --md-sys-color-surface: #1a1c1e; --md-sys-color-on-surface: #e3e2e6;
    --md-sys-color-surface-variant: #43474e; --md-sys-color-on-surface-variant: #c3c6cf;
    --md-sys-color-outline: #8d9199; --md-sys-color-shadow: #000000;
    --md-sys-color-inverse-surface: #e3e2e6; --md-sys-color-inverse-on-surface: #2f3033;
    --md-sys-color-surface-container-high: rgba(227, 226, 230, 0.16);
    --md-sys-color-success: #90ee90; --md-sys-color-success-container: rgba(144, 238, 144, 0.1);
    --md-sys-color-warning: #ffcc80;

    /* Opacity and Size Variables */
    --panel-opacity: ${panelOpacity}; /* Updated default applied here */
    --toggle-size: ${56 * toggleSizeScale}px;
    --toggle-opacity: ${toggleOpacity};

    /* Base Font */
    --md-ref-typeface-plain: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    --md-sys-typescale-body-large-font-family: var(--md-ref-typeface-plain);
    --md-sys-typescale-body-large-font-size: 16px;
    --md-sys-typescale-label-large-font-size: 14px;
    --md-sys-typescale-label-medium-font-size: 12px;
    --md-sys-typescale-label-small-font-size: 11px;
    --md-sys-typescale-title-medium-font-size: 18px;
}

/* ==== Base UI ==== */
.mobile-block-ui { z-index: 2147483646 !important; touch-action: manipulation !important; font-family: var(--md-sys-typescale-body-large-font-family); box-sizing: border-box; position: fixed !important; visibility: visible !important; color: var(--md-sys-color-on-surface); -webkit-tap-highlight-color: transparent !important; }

/* ==== Panels ==== */
#mobile-block-panel, #mobile-settings-panel, #mobile-blocklist-panel {
    background-color: rgba(40, 43, 48, var(--panel-opacity)) !important; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    color: var(--md-sys-color-on-surface); border-radius: 20px !important;
    box-shadow: 0 12px 17px 2px rgba(0,0,0,0.14), 0 5px 22px 4px rgba(0,0,0,0.12), 0 7px 8px -4px rgba(0,0,0,0.20) !important;
    border: 1px solid rgba(255, 255, 255, 0.12); padding: 18px 20px; width: calc(100% - 40px); max-width: 380px;
    /* Use display none, opacity/transform handled by .visible */
    display: none;
    opacity: 0;
    backface-visibility: hidden; -webkit-backface-visibility: hidden; overflow: hidden;
    transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}
#mobile-block-panel { bottom: 20px; left: 50%; transform: translateX(-50%) translateY(50px); z-index: 2147483645 !important; }
#mobile-settings-panel, #mobile-blocklist-panel { top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.9); z-index: 2147483647 !important; max-width: 340px; }

/* Panel Visible State */
#mobile-block-panel.visible, #mobile-settings-panel.visible, #mobile-blocklist-panel.visible {
    opacity: 1;
}
#mobile-block-panel.visible { transform: translateX(-50%) translateY(0); }
#mobile-settings-panel.visible, #mobile-blocklist-panel.visible { transform: translate(-50%, -50%) scale(1); }

.mb-panel-title { font-size: var(--md-sys-typescale-title-medium-font-size); font-weight: 500; color: var(--md-sys-color-on-surface); text-align: center; margin: 0 0 24px 0; }

/* ==== Slider ==== */
.mb-slider { width: 100%; margin: 15px 0; -webkit-appearance: none; appearance: none; background: var(--md-sys-color-surface-variant); height: 5px; border-radius: 3px; outline: none; cursor: pointer; transition: background 0.3s ease; }
.mb-slider:hover { background: var(--md-sys-color-outline); }
.mb-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; background: var(--md-sys-color-primary); border-radius: 50%; cursor: pointer; border: none; box-shadow: 0 1px 3px rgba(0,0,0,0.4); transition: background 0.3s ease, box-shadow 0.3s ease; }
.mb-slider::-moz-range-thumb { width: 22px; height: 22px; background: var(--md-sys-color-primary); border-radius: 50%; cursor: pointer; border: none; box-shadow: 0 1px 3px rgba(0,0,0,0.4); transition: background 0.3s ease, box-shadow 0.3s ease; }
.mb-slider:active::-webkit-slider-thumb { box-shadow: 0 0 0 10px rgba(var(--md-sys-color-primary-rgb, 160, 201, 255), 0.25); }
.mb-slider:active::-moz-range-thumb { box-shadow: 0 0 0 10px rgba(var(--md-sys-color-primary-rgb, 160, 201, 255), 0.25); }

/* ==== Selected Element Highlight ==== */
.selected-element { background-color: rgba(255, 82, 82, 0.35) !important; outline: 2px dashed var(--md-sys-color-error) !important; outline-offset: 2px; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.25); z-index: 2147483644 !important; transition: background-color 0.1s ease, outline 0.1s ease, box-shadow 0.1s ease; pointer-events: none; }

/* ==== Toggle Button (FAB) ==== */
#mobile-block-toggleBtn {
    bottom: 20px !important; right: 20px !important; top: auto !important; left: auto !important;
    z-index: 2147483646 !important; background-color: var(--md-sys-color-primary-container) !important; color: var(--md-sys-color-on-primary-container) !important;
    opacity: var(--toggle-opacity) !important; width: var(--toggle-size) !important; height: var(--toggle-size) !important; border-radius: 18px !important; border: none !important; cursor: pointer !important;
    box-shadow: 0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12), 0 3px 5px -1px rgba(0,0,0,0.20) !important;
    transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease, opacity 0.3s ease;
    display: flex !important; align-items: center !important; justify-content: center !important; overflow: hidden !important; backface-visibility: hidden; -webkit-backface-visibility: hidden; position: fixed !important; -webkit-tap-highlight-color: transparent !important;
}
#mobile-block-toggleBtn:active { transform: scale(0.95); box-shadow: 0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12) !important; }
#mobile-block-toggleBtn.selecting { background-color: var(--md-sys-color-primary) !important; color: var(--md-sys-color-on-primary) !important; box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.20) !important; }
#mobile-block-toggleBtn .toggle-icon { width: 55%; height: 55%; display: block; margin: auto; background-color: currentColor; mask-size: contain; mask-repeat: no-repeat; mask-position: center; -webkit-mask-size: contain; -webkit-mask-repeat: no-repeat; -webkit-mask-position: center; }
#mobile-block-toggleBtn .toggle-icon-plus { mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>'); -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>'); }
#mobile-block-toggleBtn .toggle-icon-adguard { background-image: url('${ADGUARD_LOGO_URL}'); background-size: contain; background-repeat: no-repeat; background-position: center; background-color: transparent !important; mask-image: none; -webkit-mask-image: none; width: 60%; height: 60%; }

/* ==== Buttons ==== */
.mb-btn { padding: 10px 24px; border: none; border-radius: 20px !important; font-size: var(--md-sys-typescale-label-large-font-size); font-weight: 500; cursor: pointer; transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease; text-align: center; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15); min-width: 64px; min-height: 40px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; opacity: 1 !important; -webkit-tap-highlight-color: transparent !important; line-height: 1.5; display: inline-flex; align-items: center; justify-content: center; }
.mb-btn:hover { box-shadow: 0 1px 2px 0 rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15); }
.mb-btn:active { transform: scale(0.97); box-shadow: none; }
.mb-btn.primary { background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
.mb-btn.primary:hover { background-color: #b0d3ff; } .mb-btn.primary:active { background-color: #c0daff; }
.mb-btn.secondary { background-color: var(--md-sys-color-secondary); color: var(--md-sys-color-on-secondary); }
.mb-btn.secondary:hover { background-color: #cad7eb; } .mb-btn.secondary:active { background-color: #dbe7fb; }
.mb-btn.tertiary { background-color: var(--md-sys-color-tertiary); color: var(--md-sys-color-on-tertiary); }
.mb-btn.tertiary:hover { background-color: #f0cde7; } .mb-btn.tertiary:active { background-color: #ffddf0; }
.mb-btn.error { background-color: var(--md-sys-color-error); color: var(--md-sys-color-on-error); }
.mb-btn.error:hover { background-color: #ffc4bc; } .mb-btn.error:active { background-color: #ffd4cc; }
.mb-btn.surface { background-color: var(--md-sys-color-surface-variant); color: var(--md-sys-color-on-surface-variant); }
.mb-btn.surface:hover { background-color: #53575e; } .mb-btn.surface:active { background-color: #63676e; }

/* ==== Layout & Info Panel ==== */
.button-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 12px; margin-top: 24px; }
#blocker-info-wrapper { margin-bottom: 15px; padding: 10px 14px; background-color: var(--md-sys-color-surface-variant); border-radius: 12px; border: 1px solid var(--md-sys-color-outline); }
#blocker-info-label { display: block; font-size: var(--md-sys-typescale-label-medium-font-size); color: var(--md-sys-color-on-surface-variant); margin-bottom: 6px; font-weight: 500; }
#blocker-info { display: block; color: var(--md-sys-color-on-surface); font-size: var(--md-sys-typescale-label-large-font-size); line-height: 1.45; word-break: break-all; min-height: 1.45em; font-family: 'Consolas', 'Monaco', monospace; max-height: 6em; overflow-y: auto; }
#blocker-info:empty::after { content: '없음'; color: var(--md-sys-color-on-surface-variant); font-style: italic; }
label[for="blocker-slider"] { display: block; font-size: var(--md-sys-typescale-label-medium-font-size); color: var(--md-sys-color-on-surface-variant); margin-bottom: 5px; margin-top: 10px; }

/* ==== Settings Panel ==== */
.settings-item { margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px; }
.settings-item label { display: flex; justify-content: space-between; align-items: center; font-size: var(--md-sys-typescale-label-large-font-size); color: var(--md-sys-color-on-surface-variant); }
.settings-item label .settings-label-text { flex-grow: 1; margin-right: 10px; }
.settings-value { color: var(--md-sys-color-on-surface); font-weight: 500; font-size: var(--md-sys-typescale-label-medium-font-size); padding-left: 10px; }
#settings-toggle-site, #settings-adguard-logo { min-width: 70px; padding: 8px 14px; font-size: var(--md-sys-typescale-label-medium-font-size); flex-shrink: 0; }
#settings-toggle-site.active, #settings-adguard-logo.active { background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
#settings-toggle-site:not(.active), #settings-adguard-logo:not(.active) { background-color: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
#settings-close { width: 100%; margin-top: 20px; }

/* ==== Blocklist Panel ==== */
#blocklist-container { max-height: calc(70vh - 150px); overflow-y: auto; margin: 20px 0; padding-right: 8px; display: flex; flex-direction: column; gap: 10px; }
.blocklist-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background-color: rgba(var(--md-sys-color-surface-variant-rgb, 67, 71, 78), 0.5); border-radius: 12px; border: 1px solid transparent; transition: background-color 0.2s, border-color 0.2s; }
.blocklist-item:hover { background-color: rgba(var(--md-sys-color-surface-variant-rgb, 67, 71, 78), 0.7); border-color: var(--md-sys-color-outline); }
.blocklist-item span { flex: 1; word-break: break-all; margin-right: 12px; font-size: var(--md-sys-typescale-label-medium-font-size); color: var(--md-sys-color-on-surface-variant); font-family: 'Consolas', 'Monaco', monospace; }
.blocklist-controls { display: flex; gap: 6px; flex-shrink: 0; }
.blocklist-btn { padding: 6px 10px; min-width: auto; min-height: 32px; font-size: var(--md-sys-typescale-label-small-font-size); border-radius: 16px !important; }
.blocklist-btn-delete { background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
.blocklist-btn-copy { background-color: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }

/* ==== Toast Notifications (Snackbar) ==== */
#mes-toast-container { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 2147483647 !important; display: flex; flex-direction: column; align-items: center; gap: 10px; pointer-events: none; width: max-content; max-width: 90%; }
.mes-toast { background-color: var(--md-sys-color-inverse-surface); color: var(--md-sys-color-inverse-on-surface); padding: 14px 20px; border-radius: 8px; box-shadow: 0 3px 5px -1px rgba(0,0,0,0.2), 0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12); font-size: var(--md-sys-typescale-label-large-font-size); opacity: 0; transform: translateY(20px); transition: opacity 0.3s ease, transform 0.3s ease; pointer-events: all; max-width: 100%; text-align: center; }
.mes-toast.show { opacity: 1; transform: translateY(0); }
.mes-toast.info { background-color: #2196F3; color: white; }
.mes-toast.success { background-color: #4CAF50; color: white; }
.mes-toast.error { background-color: #f44336; color: white; }
.mes-toast.warning { background-color: #ff9800; color: white; }
    `;
    document.head.appendChild(style);

    // --- UI 요소 생성 ---
    let panel, settingsPanel, toggleBtn, listPanel, toastContainer;
    function createUIElements() {
        toastContainer = document.createElement('div'); toastContainer.id = 'mes-toast-container'; toastContainer.className = 'mobile-block-ui'; document.body.appendChild(toastContainer);
        panel = document.createElement('div'); panel.id = 'mobile-block-panel'; panel.className = 'mobile-block-ui';
        panel.innerHTML = `<div id="blocker-info-wrapper"><span id="blocker-info-label">선택된 요소 (CSS 선택자)</span><div id="blocker-info"></div></div><label for="blocker-slider" style="display: block; font-size: var(--md-sys-typescale-label-medium-font-size); color: var(--md-sys-color-on-surface-variant); margin-bottom: 5px;">상위 요소 선택 레벨:</label><input type="range" id="blocker-slider" class="mb-slider" min="0" max="10" value="0" aria-label="Parent Level Selector"><div class="button-grid"><button id="blocker-copy" class="mb-btn secondary">복사</button><button id="blocker-preview" class="mb-btn secondary">미리보기</button><button id="blocker-add-block" class="mb-btn primary">규칙 저장</button><button id="blocker-list" class="mb-btn tertiary">목록</button><button id="blocker-settings" class="mb-btn tertiary">설정</button><button id="blocker-cancel" class="mb-btn surface">취소</button></div>`;
        document.body.appendChild(panel);
        listPanel = document.createElement('div'); listPanel.id = 'mobile-blocklist-panel'; listPanel.className = 'mobile-block-ui';
        listPanel.innerHTML = `<h3 class="mb-panel-title">저장된 차단 규칙</h3><div id="blocklist-container"></div><button id="blocklist-close" class="mb-btn surface">닫기</button>`;
        document.body.appendChild(listPanel);
        settingsPanel = document.createElement('div'); settingsPanel.id = 'mobile-settings-panel'; settingsPanel.className = 'mobile-block-ui';
        settingsPanel.innerHTML = `<h3 class="mb-panel-title">설정</h3><div class="settings-item"><label><span class="settings-label-text">규칙에 사이트명 포함</span><button id="settings-toggle-site" class="mb-btn ${includeSiteName ? 'active' : ''}">${includeSiteName ? "ON" : "OFF"}</button></label></div><div class="settings-item"><label><span class="settings-label-text">토글 버튼 AdGuard 로고</span><button id="settings-adguard-logo" class="mb-btn ${showAdguardLogo ? 'active' : ''}">${showAdguardLogo ? "ON" : "OFF"}</button></label></div><div class="settings-item"><label for="settings-panel-opacity"><span class="settings-label-text">패널 투명도</span><span id="opacity-value" class="settings-value">${panelOpacity.toFixed(2)}</span></label><input id="settings-panel-opacity" type="range" class="mb-slider" min="0.1" max="1.0" step="0.05" value="${panelOpacity}" aria-label="Panel Opacity"></div><div class="settings-item"><label for="settings-toggle-size"><span class="settings-label-text">토글 버튼 크기</span><span id="toggle-size-value" class="settings-value">${toggleSizeScale.toFixed(1)}x</span></label><input id="settings-toggle-size" type="range" class="mb-slider" min="0.5" max="2.0" step="0.1" value="${toggleSizeScale}" aria-label="Toggle Button Size"></div><div class="settings-item"><label for="settings-toggle-opacity"><span class="settings-label-text">토글 버튼 투명도</span><span id="toggle-opacity-value" class="settings-value">${toggleOpacity.toFixed(2)}</span></label><input id="settings-toggle-opacity" type="range" class="mb-slider" min="0.1" max="1.0" step="0.05" value="${toggleOpacity}" aria-label="Toggle Button Opacity"></div><button id="settings-close" class="mb-btn surface">닫기</button>`;
        document.body.appendChild(settingsPanel);
        toggleBtn = document.createElement('button'); toggleBtn.id = 'mobile-block-toggleBtn'; toggleBtn.className = 'mobile-block-ui'; toggleBtn.setAttribute('aria-label', 'Toggle Element Selector');
        updateToggleIcon(); // Set initial icon based on new default
        document.body.appendChild(toggleBtn);
        initRefsAndEvents(); applyBlocking();
    }

    // --- Toast Notification Function ---
    function showToast(message, type = 'info', duration = 3000) {
        if (!toastContainer) return; const toast = document.createElement('div'); toast.className = `mes-toast ${type}`; toast.textContent = message; toastContainer.appendChild(toast);
        requestAnimationFrame(() => { requestAnimationFrame(() => { toast.classList.add('show'); }); });
        setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => { try { toast.remove(); } catch(e){} }, { once: true }); setTimeout(() => { try { toast.remove(); } catch(e){} }, 500); }, duration);
    }

    // --- 전역 변수 ---
    let selecting = false; let selectedEl = null; let initialTouchedElement = null; let touchStartX = 0, touchStartY = 0, touchMoved = false; const moveThreshold = 15;

    // --- 함수: 차단목록 불러오기/저장 (Corrected with try/catch) ---
    async function loadBlockedSelectors() {
        let stored = '[]'; try { stored = await GM_getValue(BLOCKED_SELECTORS_KEY, '[]'); } catch (e) { console.error(SCRIPT_ID, "Error calling GM_getValue:", e); }
        try { const parsed = JSON.parse(stored); return Array.isArray(parsed) ? parsed : []; }
        catch (e) { console.error(SCRIPT_ID, "Error parsing blocked selectors, resetting.", e); try { await GM_setValue(BLOCKED_SELECTORS_KEY, '[]'); } catch (resetError) {} return []; }
    }
    async function saveBlockedSelectors(list) {
        const selectorsToSave = Array.isArray(list) ? list : [];
        try { await GM_setValue(BLOCKED_SELECTORS_KEY, JSON.stringify(selectorsToSave)); } catch(e) { console.error(SCRIPT_ID, "Error saving blocked selectors to GM:", e); showToast('❌ 설정을 저장하지 못했습니다!', 'error'); }
    }

    // --- 함수: 차단 목록 적용 ---
    async function applyBlocking() {
        console.log(SCRIPT_ID, "Applying block rules..."); const blockedSelectors = await loadBlockedSelectors(); let count = 0;
        blockedSelectors.forEach(selector => { if (typeof selector === 'string' && selector.includes('##')) { const parts = selector.split('##'); const domain = parts[0]; const cssSelector = parts[1]; if (domain && location.hostname !== domain && domain !== '*') return; if (!cssSelector) return; try { document.querySelectorAll(cssSelector).forEach(el => { if (el.style.display !== 'none' || !el.hasAttribute('data-mes-hidden')) { el.style.setProperty('display', 'none', 'important'); el.setAttribute('data-mes-hidden', 'true'); count++; } }); } catch (e) { console.warn(SCRIPT_ID, `Invalid CSS selector "${cssSelector}" in rule:`, selector, e); } } else { console.warn(SCRIPT_ID, "Skipping invalid block rule format:", selector); } });
        if (count > 0) console.log(SCRIPT_ID, `Applied ${blockedSelectors.length} rules, hid ${count} new elements.`); else console.log(SCRIPT_ID, `Applied ${blockedSelectors.length} rules, no new elements hidden.`);
    }

    // --- 함수: 토글 버튼 아이콘 업데이트 ---
    function updateToggleIcon() {
        if (!toggleBtn) return; if (showAdguardLogo) toggleBtn.innerHTML = `<span class="toggle-icon toggle-icon-adguard" aria-hidden="true"></span>`; else toggleBtn.innerHTML = `<span class="toggle-icon toggle-icon-plus" aria-hidden="true"></span>`; toggleBtn.classList.toggle('selecting', selecting);
    }

    // --- 초기화: 참조 및 이벤트 리스너 설정 ---
    function initRefsAndEvents() {
        const infoLabel = panel.querySelector('#blocker-info-label'); const info = panel.querySelector('#blocker-info'); const slider = panel.querySelector('#blocker-slider'); const copyBtn = panel.querySelector('#blocker-copy'); const previewBtn = panel.querySelector('#blocker-preview'); const addBtn = panel.querySelector('#blocker-add-block'); const listBtn = panel.querySelector('#blocker-list'); const settingsBtn = panel.querySelector('#blocker-settings'); const cancelBtn = panel.querySelector('#blocker-cancel'); const listContainer = listPanel.querySelector('#blocklist-container'); const listClose = listPanel.querySelector('#blocklist-close'); const toggleSiteBtn = settingsPanel.querySelector('#settings-toggle-site'); const adguardLogoToggleBtn = settingsPanel.querySelector('#settings-adguard-logo'); const panelOpacitySlider = settingsPanel.querySelector('#settings-panel-opacity'); const panelOpacityValue = settingsPanel.querySelector('#opacity-value'); const toggleSizeSlider = settingsPanel.querySelector('#settings-toggle-size'); const toggleSizeValue = settingsPanel.querySelector('#toggle-size-value'); const toggleOpacitySlider = settingsPanel.querySelector('#settings-toggle-opacity'); const toggleOpacityValue = settingsPanel.querySelector('#toggle-opacity-value'); const settingsClose = settingsPanel.querySelector('#settings-close');
        let isPreviewHidden = false; let previewedElement = null;

        function removeSelectionHighlight() { if (selectedEl) { selectedEl.classList.remove('selected-element'); selectedEl = null; initialTouchedElement = null; if (slider) slider.value = 0; } if (info) info.textContent = ''; }
        function resetPreview() { if (isPreviewHidden && previewedElement) { try { const originalDisplay = previewedElement.dataset._original_display; if (originalDisplay === 'unset') previewedElement.style.removeProperty('display'); else if (originalDisplay !== undefined) previewedElement.style.setProperty('display', originalDisplay); delete previewedElement.dataset._original_display; } catch (e) {} previewBtn.textContent = '미리보기'; previewBtn.classList.remove('tertiary'); previewBtn.classList.add('secondary'); isPreviewHidden = false; previewedElement = null; } else if (previewBtn) { previewBtn.textContent = '미리보기'; previewBtn.classList.remove('tertiary'); previewBtn.classList.add('secondary'); } }
        function updateInfo() { if (!info) return; const selectorText = selectedEl ? generateSelector(selectedEl) : ''; info.textContent = selectorText; infoLabel.style.display = 'block'; }
        function setPanelVisibility(panelElement, visible) { if (!panelElement) return; console.log(`[setPanelVisibility] Setting ${panelElement.id} to visible: ${visible}`); if (visible) { panelElement.style.display = 'block'; requestAnimationFrame(() => { requestAnimationFrame(() => { panelElement.classList.add('visible'); }); }); } else { panelElement.classList.remove('visible'); setTimeout(() => { if (!panelElement.classList.contains('visible')) { console.log(`[setPanelVisibility] Hiding ${panelElement.id} via setTimeout`); panelElement.style.display = 'none'; } }, 350); } }
        function generateSelector(el) { if (!el || el.nodeType !== 1 || el.closest('.mobile-block-ui')) return ''; if (el.id && !/\d/.test(el.id) && !el.id.includes(':') && document.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1) return `#${CSS.escape(el.id)}`; const parts = []; let current = el; const maxDepth = 7; for (let depth = 0; current && current.tagName && depth < maxDepth; depth++) { const tagName = current.tagName.toLowerCase(); if (tagName === 'body' || tagName === 'html') break; if (current.closest('.mobile-block-ui')) { current = current.parentElement; continue; } let part = tagName; const stableClasses = Array.from(current.classList).filter(c => c && !/^[a-z]{1,2}$/i.test(c) && !/\d/.test(c) && !/active|select|focus|hover|disabled|open|closed/i.test(c) && !['selected-element', 'mobile-block-ui'].some(uiClass => c.includes(uiClass)) && !/^[A-Z0-9]{4,}$/.test(c)).slice(0, 2); if (stableClasses.length > 0) { part += '.' + stableClasses.map(c => CSS.escape(c)).join('.'); } else if (current.parentElement && !current.parentElement.closest('.mobile-block-ui')) { const siblings = Array.from(current.parentElement.children); const sameTagSiblings = siblings.filter(sib => sib.tagName === current.tagName && !sib.closest('.mobile-block-ui')); if (sameTagSiblings.length > 1) { const index = sameTagSiblings.indexOf(current) + 1; if (index > 0) part = `${tagName}:nth-of-type(${index})`; } } parts.unshift(part); if (current.id && !/\d/.test(current.id) && !current.id.includes(':') && document.querySelectorAll(`#${CSS.escape(current.id)}`).length === 1) { parts.length = 0; parts.unshift(`#${CSS.escape(current.id)}`); break; } current = current.parentElement; } let finalSelector = parts.join(' > '); if (finalSelector.length > 200) finalSelector = parts.slice(-3).join(' > '); if (!finalSelector || finalSelector === 'body' || finalSelector === 'html') return ''; try { if (document.querySelectorAll(finalSelector).length === 0) return ''; } catch (e) { return ''; } return finalSelector; }
        async function addBlockRule(selector) { console.log('[addBlockRule] Attempting for selector:', selector); if (!selector) return { success: false, message: '유효하지 않은 선택자입니다.' }; let fullSelector = "##" + selector; if (includeSiteName) { const hostname = location.hostname; if (!hostname) return { success: false, message: '호스트 이름을 가져올 수 없습니다.' }; fullSelector = hostname + fullSelector; } try { const blockedSelectors = await loadBlockedSelectors(); if (!blockedSelectors.includes(fullSelector)) { blockedSelectors.push(fullSelector); await saveBlockedSelectors(blockedSelectors); console.log(SCRIPT_ID, "Rule added:", fullSelector); return { success: true, rule: fullSelector }; } else { console.log(SCRIPT_ID, "Rule already exists:", fullSelector); return { success: false, message: '이미 저장된 규칙입니다.' }; } } catch (error) { console.error(SCRIPT_ID, "Error in addBlockRule load/save:", error); return { success: false, message: `규칙 추가 중 오류: ${error.message}` }; } }
        async function showList() { console.log('[showList] Function called'); try { const arr = await loadBlockedSelectors(); console.log(`[showList] Loaded ${arr.length} rules.`); listContainer.innerHTML = ''; if (arr.length === 0) { listContainer.innerHTML = '<p style="text-align:center; color: var(--md-sys-color-on-surface-variant); padding: 20px 0;">저장된 규칙이 없습니다.</p>'; } else { arr.forEach((rule, i) => { const item = document.createElement('div'); item.className = 'blocklist-item'; const span = document.createElement('span'); span.textContent = rule; span.title = rule; const controlsDiv = document.createElement('div'); controlsDiv.className = 'blocklist-controls'; const copyButton = document.createElement('button'); copyButton.className = 'mb-btn blocklist-btn blocklist-btn-copy'; copyButton.textContent = '복사'; copyButton.title = '규칙 복사'; copyButton.addEventListener('click', () => { try { GM_setClipboard(rule); showToast('✅ 규칙 복사됨', 'success', 2000); } catch (copyError) { console.error(SCRIPT_ID, "Error copying to clipboard:", copyError); showToast('❌ 클립보드 복사 실패', 'error'); } }); const deleteButton = document.createElement('button'); deleteButton.className = 'mb-btn blocklist-btn blocklist-btn-delete'; deleteButton.textContent = '삭제'; deleteButton.title = '규칙 삭제'; deleteButton.addEventListener('click', async () => { console.log('[showList] Delete button clicked for rule:', rule); try { arr.splice(i, 1); await saveBlockedSelectors(arr); item.style.transition = 'opacity 0.3s ease, transform 0.3s ease'; item.style.opacity = '0'; item.style.transform = 'translateX(20px)'; setTimeout(() => { showList(); applyBlocking(); showToast('🗑️ 규칙 삭제됨', 'info', 2000); }, 300); } catch (deleteError) { console.error(SCRIPT_ID, "Error deleting rule:", deleteError); showToast('❌ 규칙 삭제 실패', 'error'); } }); controlsDiv.append(copyButton, deleteButton); item.append(span, controlsDiv); listContainer.append(item); }); } console.log('[showList] Rendering list panel.'); setPanelVisibility(listPanel, true); setPanelVisibility(panel, false); setPanelVisibility(settingsPanel, false); } catch (error) { console.error(SCRIPT_ID, "Error in showList:", error); showToast('❌ 목록 표시 중 오류 발생', 'error'); } }
        function setBlockMode(enabled) { if (!toggleBtn || !panel) return; selecting = enabled; toggleBtn.classList.toggle('selecting', enabled); updateToggleIcon(); setPanelVisibility(panel, enabled); if (settingsPanel) setPanelVisibility(settingsPanel, false); if (listPanel) setPanelVisibility(listPanel, false); if (!enabled) { removeSelectionHighlight(); resetPreview(); } else { updateInfo(); } console.log(SCRIPT_ID, "Selection mode:", enabled ? "ON" : "OFF"); }

        console.log(SCRIPT_ID, 'Attaching event listeners...');
        toggleBtn.addEventListener('click', () => { setBlockMode(!selecting); });
        copyBtn.addEventListener('click', () => { if (!selectedEl) { showToast('⚠️ 선택된 요소가 없습니다.', 'warning'); return; } const selector = generateSelector(selectedEl); if (!selector) { showToast('❌ 유효한 선택자를 생성할 수 없습니다.', 'error'); return; } let finalSelector = "##" + selector; if (includeSiteName) finalSelector = location.hostname + finalSelector; try { GM_setClipboard(finalSelector); showToast('✅ 선택자가 복사되었습니다!', 'success'); } catch (err) { console.error(SCRIPT_ID, "Error copying to clipboard:", err); showToast("❌ 클립보드 복사 실패", 'error'); prompt("선택자를 직접 복사하세요:", finalSelector); } });
        previewBtn.addEventListener('click', () => { if (!selectedEl) { showToast('⚠️ 선택된 요소가 없습니다.', 'warning'); return; } if (!isPreviewHidden) { if (window.getComputedStyle(selectedEl).display === 'none') { showToast('ℹ️ 이미 숨겨진 요소입니다.', 'info'); return; } const currentDisplay = selectedEl.style.display; selectedEl.dataset._original_display = currentDisplay === '' ? 'unset' : currentDisplay; selectedEl.style.setProperty('display', 'none', 'important'); previewBtn.textContent = '되돌리기'; previewBtn.classList.remove('secondary'); previewBtn.classList.add('tertiary'); isPreviewHidden = true; previewedElement = selectedEl; selectedEl.classList.remove('selected-element'); console.log(SCRIPT_ID, "Previewing hide for:", selectedEl); } else { if (previewedElement !== selectedEl && previewedElement) { showToast('⚠️ 다른 요소가 미리보기 중입니다.', 'warning'); return; } resetPreview(); if(selectedEl) selectedEl.classList.add('selected-element'); } });
        addBtn.addEventListener('click', async () => { console.log('[addBtn] Clicked'); if (!selectedEl) { showToast('⚠️ 선택된 요소가 없습니다.', 'warning'); return; } try { const selector = generateSelector(selectedEl); console.log('[addBtn] Generated selector:', selector); if (!selector) { showToast('❌ 유효한 선택자를 생성할 수 없습니다.', 'error'); return; } const result = await addBlockRule(selector); console.log('[addBtn] addBlockRule result:', result); if (result.success) { showToast('✅ 규칙 저장됨! 페이지를 새로고침합니다...', 'success', 2500); try { selectedEl.style.setProperty('display', 'none', 'important'); } catch(e){} removeSelectionHighlight(); setPanelVisibility(panel, false); setTimeout(() => { location.reload(); }, 1500); } else { showToast(`ℹ️ ${result.message}`, 'info'); } } catch (error) { console.error(SCRIPT_ID, "Error during Save Rule click:", error); showToast('❌ 규칙 저장 중 예상치 못한 오류 발생', 'error'); } });
        listBtn.addEventListener('click', () => { console.log('[listBtn] Clicked'); showList(); });
        settingsBtn.addEventListener('click', () => { setPanelVisibility(settingsPanel, !settingsPanel.classList.contains('visible')); setPanelVisibility(panel, false); setPanelVisibility(listPanel, false); });
        cancelBtn.addEventListener('click', () => { setBlockMode(false); });
        // --- Modified List Close Listener ---
        listClose.addEventListener('click', () => {
            console.log('[listClose] Clicked'); // Debug log
            setPanelVisibility(listPanel, false);
            // Restore main panel if in selecting mode
            if (selecting) {
                console.log('[listClose] Restoring main panel'); // Debug log
                setPanelVisibility(panel, true);
            }
        });
        // --- Modified Settings Close Listener ---
        settingsClose.addEventListener('click', () => {
             console.log('[settingsClose] Clicked');
             setPanelVisibility(settingsPanel, false);
             // Restore main panel if in selecting mode
             if (selecting) {
                 console.log('[settingsClose] Restoring main panel');
                 setPanelVisibility(panel, true);
             }
        });

        // Settings Panel Listeners (with try/catch for GM_setValue)
        toggleSiteBtn.addEventListener('click', async () => { const newState = !includeSiteName; includeSiteName = newState; toggleSiteBtn.textContent = newState ? 'ON' : 'OFF'; toggleSiteBtn.classList.toggle('active', newState); try { await GM_setValue('includeSiteName', newState); showToast('설정 저장됨', 'info', 1500); } catch(e) { console.error(SCRIPT_ID,"Failed to save includeSiteName",e); showToast('❌ 설정 저장 실패', 'error'); } });
        adguardLogoToggleBtn.addEventListener('click', async () => { const newState = !showAdguardLogo; showAdguardLogo = newState; adguardLogoToggleBtn.textContent = newState ? 'ON' : 'OFF'; adguardLogoToggleBtn.classList.toggle('active', newState); updateToggleIcon(); try { await GM_setValue('showAdguardLogo', newState); showToast('설정 저장됨', 'info', 1500); } catch(e) { console.error(SCRIPT_ID,"Failed to save showAdguardLogo",e); showToast('❌ 설정 저장 실패', 'error'); } });
        panelOpacitySlider.addEventListener('input', e => { const newValue = parseFloat(e.target.value); panelOpacity = newValue; panelOpacityValue.textContent = newValue.toFixed(2); document.documentElement.style.setProperty('--panel-opacity', newValue); document.querySelectorAll('#mobile-block-panel, #mobile-settings-panel, #mobile-blocklist-panel').forEach(p => { p.style.backgroundColor = `rgba(40, 43, 48, ${newValue})`; }); });
        panelOpacitySlider.addEventListener('change', async e => { try { await GM_setValue('panelOpacity', panelOpacity); console.log(SCRIPT_ID, "Panel opacity saved:", panelOpacity); } catch(e) { console.error(SCRIPT_ID,"Failed to save panelOpacity",e); showToast('❌ 설정 저장 실패', 'error'); } });
        toggleSizeSlider.addEventListener('input', e => { const newValue = parseFloat(e.target.value); toggleSizeScale = newValue; toggleSizeValue.textContent = newValue.toFixed(1) + 'x'; document.documentElement.style.setProperty('--toggle-size', `${56 * newValue}px`); });
        toggleSizeSlider.addEventListener('change', async e => { try { await GM_setValue('toggleSizeScale', toggleSizeScale); console.log(SCRIPT_ID, "Toggle size saved:", toggleSizeScale); } catch(e) { console.error(SCRIPT_ID,"Failed to save toggleSizeScale",e); showToast('❌ 설정 저장 실패', 'error'); } });
        toggleOpacitySlider.addEventListener('input', e => { const newValue = parseFloat(e.target.value); toggleOpacity = newValue; toggleOpacityValue.textContent = newValue.toFixed(2); document.documentElement.style.setProperty('--toggle-opacity', newValue); if(toggleBtn) toggleBtn.style.setProperty('opacity', newValue, 'important'); });
        toggleOpacitySlider.addEventListener('change', async e => { try { await GM_setValue('toggleOpacity', toggleOpacity); console.log(SCRIPT_ID, "Toggle opacity saved:", toggleOpacity); } catch(e) { console.error(SCRIPT_ID,"Failed to save toggleOpacity",e); showToast('❌ 설정 저장 실패', 'error'); } });

        // --- Element Selection Logic (Touch Events - Refined Fix) ---
        document.addEventListener('touchstart', e => { if (!selecting) return; const touch = e.touches[0]; if (touch.target.closest('.mobile-block-ui')) { initialTouchedElement = null; return; } touchStartX = touch.clientX; touchStartY = touch.clientY; touchMoved = false; const potentialTarget = document.elementFromPoint(touchStartX, touchStartY); if (potentialTarget && !potentialTarget.closest('.mobile-block-ui') && potentialTarget.tagName !== 'BODY' && potentialTarget.tagName !== 'HTML') initialTouchedElement = potentialTarget; else initialTouchedElement = null; }, { passive: true });
        document.addEventListener('touchmove', e => { if (!selecting || touchMoved || !e.touches[0] || !initialTouchedElement) return; const touch = e.touches[0]; const dx = touch.clientX - startX; const dy = touch.clientY - startY; if (Math.sqrt(dx * dx + dy * dy) > moveThreshold) { touchMoved = true; if (selectedEl) selectedEl.classList.remove('selected-element'); initialTouchedElement = null; } }, { passive: true });
        document.addEventListener('touchend', e => { if (!selecting) return; const touchEndTarget = e.target; if (touchEndTarget.closest('.mobile-block-ui .mb-btn')) { console.log(SCRIPT_ID, 'touchend on UI button, letting click event handle.'); if (touchMoved) touchMoved = false; return; } if (touchEndTarget.closest('.mobile-block-ui')) { if (touchMoved && selectedEl) selectedEl.classList.add('selected-element'); touchMoved = false; return; } if (touchMoved) { touchMoved = false; return; } try { e.preventDefault(); e.stopImmediatePropagation(); } catch (err) {} const touch = e.changedTouches[0]; if (!touch) return; const targetEl = initialTouchedElement || document.elementFromPoint(touch.clientX, touch.clientY); if (targetEl && !targetEl.closest('.mobile-block-ui') && targetEl.tagName !== 'BODY' && targetEl.tagName !== 'HTML') { removeSelectionHighlight(); resetPreview(); selectedEl = targetEl; initialTouchedElement = selectedEl; selectedEl.classList.add('selected-element'); slider.value = 0; updateInfo(); } else { removeSelectionHighlight(); resetPreview(); updateInfo(); initialTouchedElement = null; } }, { capture: true, passive: false });
        // --- Slider Logic ---
        slider.addEventListener('input', (e) => { if (!initialTouchedElement) { if (selectedEl) initialTouchedElement = selectedEl; else return; } resetPreview(); const level = parseInt(e.target.value, 10); let current = initialTouchedElement; for (let i = 0; i < level && current.parentElement; i++) { if (['body', 'html'].includes(current.parentElement.tagName.toLowerCase()) || current.parentElement.closest('.mobile-block-ui')) break; current = current.parentElement; } if (selectedEl !== current) { if (selectedEl) selectedEl.classList.remove('selected-element'); selectedEl = current; selectedEl.classList.add('selected-element'); updateInfo(); } });
        // --- Draggable UI ---
        function makeDraggable(el) { if (!el) return; let startX, startY, dragStartX, dragStartY; let dragging = false, moved = false; const handleTouchStart = (e) => { let interactiveTarget = e.target.closest('button, input, select, textarea, .blocklist-item'); if (interactiveTarget && el.contains(interactiveTarget)) { dragging = false; return; } if (e.target.closest('#blocklist-container, #blocker-info')) { const scrollTarget = e.target.closest('#blocklist-container, #blocker-info'); if (scrollTarget && scrollTarget.scrollHeight > scrollTarget.clientHeight) { dragging = false; return; } } if (dragging) return; dragging = true; moved = false; const touch = e.touches[0]; startX = touch.clientX; startY = touch.clientY; const rect = el.getBoundingClientRect(); dragStartX = rect.left; dragStartY = rect.top; el.style.transition = 'none'; el.style.cursor = 'grabbing'; }; const handleTouchMove = (e) => { if (!dragging) return; moved = true; try { e.preventDefault(); } catch {} const touch = e.touches[0]; const dx = touch.clientX - startX; const dy = touch.clientY - startY; let newX = dragStartX + dx; let newY = dragStartY + dy; const elWidth = el.offsetWidth; const elHeight = el.offsetHeight; const parentWidth = window.innerWidth; const parentHeight = window.innerHeight; newX = Math.max(0, Math.min(newX, parentWidth - elWidth)); newY = Math.max(0, Math.min(newY, parentHeight - elHeight)); el.style.left = '0px'; el.style.top = '0px'; el.style.right = 'auto'; el.style.bottom = 'auto'; el.style.transform = `translate(${newX}px, ${newY}px)`; }; const handleTouchEnd = (e) => { if (!dragging) return; dragging = false; el.style.transition = ''; el.style.cursor = ''; if (moved) { try { e.preventDefault(); e.stopPropagation(); } catch {} } moved = false; }; el.addEventListener('touchstart', handleTouchStart, { passive: true }); el.addEventListener('touchmove', handleTouchMove, { passive: false }); el.addEventListener('touchend', handleTouchEnd, { passive: false }); el.addEventListener('touchcancel', handleTouchEnd, { passive: false }); }
        makeDraggable(panel); makeDraggable(settingsPanel); makeDraggable(toggleBtn); makeDraggable(listPanel);

        console.log(SCRIPT_ID, 'Initialization complete.');
    } // End of initRefsAndEvents

    // --- 스크립트 실행 시작 ---
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createUIElements);
    else createUIElements();

})();
