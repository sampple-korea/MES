// ==UserScript==
// @name         MES(Mobile Element Selector)
// @author       삼플 with Gemini
// @version      1.1.1
// @description  Material M3의 진보한 디자인, 아름다운 애니메이션, 완벽한 기능을 가진 모바일 요소 선택기
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
    const SCRIPT_ID = "[MES v1.1.0 M3]";
    const ADGUARD_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/AdGuard.svg/500px-AdGuard.svg.png';

    // --- I18N Strings (Preparation for multi-language support) ---
    const STRINGS = {
        panelTitle: '요소 차단',
        settingsTitle: 'MES by 삼플',
        listTitle: '저장된 차단 규칙',
        selectedElementLabel: '선택된 요소 (CSS 선택자)',
        parentLevelLabel: '상위 요소 선택 레벨:',
        copy: '복사',
        preview: '미리보기',
        restorePreview: '되돌리기',
        saveRule: '규칙 저장',
        list: '목록',
        settings: '설정',
        cancel: '취소',
        close: '닫기',
        includeSiteNameLabel: '규칙에 사이트명 포함',
        useAdguardLogoLabel: '토글 버튼 AdGuard 로고',
        panelOpacityLabel: '패널 투명도',
        toggleSizeLabel: '토글 버튼 크기',
        toggleOpacityLabel: '토글 버튼 투명도',
        tempDisableLabel: '모든 규칙 임시 비활성화',
        backupLabel: '규칙 백업 (JSON)',
        restoreLabel: '규칙 복원 (JSON)',
        on: 'ON',
        off: 'OFF',
        noRules: '저장된 규칙이 없습니다.',
        noElementSelected: '⚠️ 선택된 요소가 없습니다.',
        cannotGenerateSelector: '❌ 유효한 선택자를 생성할 수 없습니다.',
        selectorCopied: '✅ 선택자가 복사되었습니다!',
        clipboardError: '❌ 클립보드 복사 실패',
        promptCopy: '선택자를 직접 복사하세요:',
        alreadyHidden: 'ℹ️ 이미 숨겨진 요소입니다.',
        previewDifferentElement: '⚠️ 다른 요소가 미리보기 중입니다.',
        ruleSavedReloading: '✅ 규칙 저장됨! 적용 중...',
        ruleSavedApplyFailed: '⚠️ 규칙은 저장했으나 즉시 적용 실패.',
        ruleAddError: '❌ 규칙 추가 중 오류:',
        ruleExists: 'ℹ️ 이미 저장된 규칙입니다.',
        listShowError: '❌ 목록 표시 중 오류 발생',
        ruleCopied: '✅ 규칙 복사됨',
        ruleDeleted: '🗑️ 규칙 삭제됨',
        ruleDeleteError: '❌ 규칙 삭제 실패',
        settingsSaved: '✅ 설정 저장됨',
        settingsSaveError: '❌ 설정 저장 실패',
        backupStarting: '💾 규칙 백업 파일 다운로드를 시작합니다.',
        backupError: '❌ 규칙 백업 실패',
        restorePrompt: '📁 복원할 JSON 파일을 선택하세요.',
        restoreSuccess: '✅ 규칙 복원 완료! 적용 중...',
        restoreErrorInvalidFile: '❌ 잘못된 파일 형식 또는 내용입니다.',
        restoreErrorGeneral: '❌ 규칙 복원 실패',
        blockingApplied: (count) => `✅ ${count}개의 규칙 적용됨`,
        blockingApplyError: '❌ 규칙 적용 중 오류 발생',
        tempBlockingOn: '🚫 모든 규칙 임시 비활성화됨',
        tempBlockingOff: '✅ 규칙 다시 활성화됨'
    };

    // --- 기본 설정 값 정의 ---
    const DEFAULT_SETTINGS = {
        includeSiteName: true,
        panelOpacity: 0.65, // Slightly less transparent default
        toggleSizeScale: 1.0,
        toggleOpacity: 1.0,
        showAdguardLogo: false,
        tempBlockingDisabled: false // New setting for temporary disable
    };

    // --- 설정 값 로드 및 검증 ---
    let settings = {};
    const SETTINGS_KEY = 'mobileElementSelectorSettings_v1'; // Key for storing settings object
    const BLOCKED_SELECTORS_KEY = 'mobileBlockedSelectors_v2'; // Updated key for rules (includes version implicitly)

    async function loadSettings() {
        let storedSettings = {};
        try {
            const storedValue = await GM_getValue(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
            storedSettings = JSON.parse(storedValue || '{}');
        } catch (e) {
            console.error(SCRIPT_ID, `Error loading settings from GM_getValue('${SETTINGS_KEY}'), using defaults.`, e);
            storedSettings = { ...DEFAULT_SETTINGS }; // Use defaults on error
        }

        // Apply defaults for missing keys and validate existing ones
        settings = { ...DEFAULT_SETTINGS, ...storedSettings };

        // Validation
        settings.panelOpacity = parseFloat(settings.panelOpacity);
        if (isNaN(settings.panelOpacity) || settings.panelOpacity < 0.1 || settings.panelOpacity > 1.0) {
            settings.panelOpacity = DEFAULT_SETTINGS.panelOpacity;
        }
        settings.toggleSizeScale = parseFloat(settings.toggleSizeScale);
        if (isNaN(settings.toggleSizeScale) || settings.toggleSizeScale < 0.5 || settings.toggleSizeScale > 2.0) {
            settings.toggleSizeScale = DEFAULT_SETTINGS.toggleSizeScale;
        }
        settings.toggleOpacity = parseFloat(settings.toggleOpacity);
        if (isNaN(settings.toggleOpacity) || settings.toggleOpacity < 0.1 || settings.toggleOpacity > 1.0) {
            settings.toggleOpacity = DEFAULT_SETTINGS.toggleOpacity;
        }
        settings.includeSiteName = typeof settings.includeSiteName === 'boolean' ? settings.includeSiteName : DEFAULT_SETTINGS.includeSiteName;
        settings.showAdguardLogo = typeof settings.showAdguardLogo === 'boolean' ? settings.showAdguardLogo : DEFAULT_SETTINGS.showAdguardLogo;
        settings.tempBlockingDisabled = typeof settings.tempBlockingDisabled === 'boolean' ? settings.tempBlockingDisabled : DEFAULT_SETTINGS.tempBlockingDisabled;

        console.log(SCRIPT_ID, "Settings loaded:", settings);
    }

    async function saveSettings() {
        try {
            await GM_setValue(SETTINGS_KEY, JSON.stringify(settings));
            console.log(SCRIPT_ID, "Settings saved:", settings);
        } catch (e) {
            console.error(SCRIPT_ID, `Error saving settings to GM_setValue('${SETTINGS_KEY}')`, e);
            showToast(STRINGS.settingsSaveError, 'error');
        }
    }

    // --- M3 Inspired CSS ---
    const style = document.createElement('style');
    // (Keep the same CSS as before, just update variables based on loaded settings)
    function updateCSSVariables() {
        document.documentElement.style.setProperty('--panel-opacity', settings.panelOpacity);
        document.documentElement.style.setProperty('--toggle-size', `${56 * settings.toggleSizeScale}px`);
        document.documentElement.style.setProperty('--toggle-opacity', settings.toggleOpacity);

        // Update panel background explicitly if already created
        document.querySelectorAll('#mobile-block-panel, #mobile-settings-panel, #mobile-blocklist-panel').forEach(p => {
            p.style.setProperty('background-color', `rgba(40, 43, 48, ${settings.panelOpacity})`, 'important');
        });
        // Update toggle button size/opacity explicitly if already created
        if (toggleBtn) {
            toggleBtn.style.setProperty('width', `var(--toggle-size)`, 'important');
            toggleBtn.style.setProperty('height', `var(--toggle-size)`, 'important');
            toggleBtn.style.setProperty('opacity', `var(--toggle-opacity)`, 'important');
        }
    }

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

    /* Opacity and Size Variables - Initial values set by JS */
    --panel-opacity: ${DEFAULT_SETTINGS.panelOpacity};
    --toggle-size: ${56 * DEFAULT_SETTINGS.toggleSizeScale}px;
    --toggle-opacity: ${DEFAULT_SETTINGS.toggleOpacity};

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
    display: none; /* Managed by JS */
    opacity: 0;
    backface-visibility: hidden; -webkit-backface-visibility: hidden; overflow: hidden;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out;
    will-change: transform, opacity; /* Performance hint */
}

/* Panel Positioning */
#mobile-block-panel { bottom: 20px; left: 50%; transform: translateX(-50%) translateY(100px) scale(0.95); z-index: 2147483645 !important; }
#mobile-settings-panel, #mobile-blocklist-panel { top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.9); z-index: 2147483647 !important; max-width: 340px; }

/* Panel Visible State */
#mobile-block-panel.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
}
#mobile-settings-panel.visible, #mobile-blocklist-panel.visible {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
}

.mb-panel-title { font-size: var(--md-sys-typescale-title-medium-font-size); font-weight: 500; color: var(--md-sys-color-on-surface); text-align: center; margin: 0 0 24px 0; }

/* ==== Slider ==== */
.mb-slider { width: 100%; margin: 15px 0; -webkit-appearance: none; appearance: none; background: var(--md-sys-color-surface-variant); height: 5px; border-radius: 3px; outline: none; cursor: pointer; transition: background 0.3s ease; }
.mb-slider:hover { background: var(--md-sys-color-outline); }
.mb-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; background: var(--md-sys-color-primary); border-radius: 50%; cursor: pointer; border: none; box-shadow: 0 1px 3px rgba(0,0,0,0.4); transition: background 0.3s ease, box-shadow 0.3s ease; }
.mb-slider::-moz-range-thumb { width: 22px; height: 22px; background: var(--md-sys-color-primary); border-radius: 50%; cursor: pointer; border: none; box-shadow: 0 1px 3px rgba(0,0,0,0.4); transition: background 0.3s ease, box-shadow 0.3s ease; }
.mb-slider:active::-webkit-slider-thumb { box-shadow: 0 0 0 10px rgba(var(--md-sys-color-primary-rgb, 160, 201, 255), 0.25); }
.mb-slider:active::-moz-range-thumb { box-shadow: 0 0 0 10px rgba(var(--md-sys-color-primary-rgb, 160, 201, 255), 0.25); }

/* ==== Selected Element Highlight ==== */
.selected-element {
    outline: 3px solid var(--md-sys-color-error) !important;
    outline-offset: 2px;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45) !important; /* Darker overlay */
    background-color: rgba(255, 82, 82, 0.15) !important; /* Subtle bg tint */
    z-index: 2147483644 !important;
    transition: background-color 0.1s ease, outline 0.1s ease, box-shadow 0.1s ease;
    pointer-events: none;
}

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
#mobile-block-toggleBtn.selecting { /* Selection Mode Active Style */
    background-color: var(--md-sys-color-primary) !important;
    color: var(--md-sys-color-on-primary) !important;
    box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.20) !important;
}
#mobile-block-toggleBtn .toggle-icon { width: 55%; height: 55%; display: block; margin: auto; background-color: currentColor; mask-size: contain; mask-repeat: no-repeat; mask-position: center; -webkit-mask-size: contain; -webkit-mask-repeat: no-repeat; -webkit-mask-position: center; }
#mobile-block-toggleBtn .toggle-icon-plus { mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>'); -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>'); }
/* New icon for selection active */
#mobile-block-toggleBtn.selecting .toggle-icon-plus { mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>'); -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>'); }
#mobile-block-toggleBtn .toggle-icon-adguard { background-image: url('${ADGUARD_LOGO_URL}'); background-size: contain; background-repeat: no-repeat; background-position: center; background-color: transparent !important; mask-image: none; -webkit-mask-image: none; width: 60%; height: 60%; }

/* ==== Buttons ==== */
.mb-btn { padding: 10px 24px; border: none; border-radius: 20px !important; font-size: var(--md-sys-typescale-label-large-font-size); font-weight: 500; cursor: pointer; transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease; text-align: center; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15); min-width: 64px; min-height: 40px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; opacity: 1 !important; -webkit-tap-highlight-color: transparent !important; line-height: 1.5; display: inline-flex; align-items: center; justify-content: center; }
.mb-btn:hover { box-shadow: 0 1px 2px 0 rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15); }
.mb-btn:active { transform: scale(0.97); box-shadow: none; }
.mb-btn.primary { background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
.mb-btn.primary:hover { background-color: #b0d3ff; } .mb-btn.primary:active { background-color: #c0daff; }
.mb-btn.secondary { background-color: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); } /* Updated Secondary */
.mb-btn.secondary:hover { background-color: #545d6e; } .mb-btn.secondary:active { background-color: #6a7385; }
.mb-btn.tertiary { background-color: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container); } /* Updated Tertiary */
.mb-btn.tertiary:hover { background-color: #6f5471; } .mb-btn.tertiary:active { background-color: #866a89; }
.mb-btn.error { background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); } /* Updated Error */
.mb-btn.error:hover { background-color: #b12025; } .mb-btn.error:active { background-color: #c83c40; }
.mb-btn.surface { background-color: var(--md-sys-color-surface-variant); color: var(--md-sys-color-on-surface-variant); }
.mb-btn.surface:hover { background-color: #53575e; } .mb-btn.surface:active { background-color: #63676e; }
.mb-btn.outline { background-color: transparent; color: var(--md-sys-color-primary); border: 1px solid var(--md-sys-color-outline); box-shadow: none; } /* New Outline Style */
.mb-btn.outline:hover { background-color: rgba(var(--md-sys-color-primary-rgb, 160, 201, 255), 0.08); }
.mb-btn.outline:active { background-color: rgba(var(--md-sys-color-primary-rgb, 160, 201, 255), 0.12); }

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
#settings-toggle-site, #settings-adguard-logo, #settings-temp-disable { min-width: 70px; padding: 8px 14px; font-size: var(--md-sys-typescale-label-medium-font-size); flex-shrink: 0; }
#settings-toggle-site.active, #settings-adguard-logo.active, #settings-temp-disable.active { background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
#settings-toggle-site:not(.active), #settings-adguard-logo:not(.active), #settings-temp-disable:not(.active) { background-color: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
#settings-close, #settings-backup, #settings-restore { width: 100%; margin-top: 10px; }
#settings-restore-input { display: none; } /* Hide file input */

/* ==== Blocklist Panel ==== */
#blocklist-container { max-height: calc(70vh - 150px); overflow-y: auto; margin: 20px 0; padding-right: 8px; display: flex; flex-direction: column; gap: 10px; }
.blocklist-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background-color: rgba(var(--md-sys-color-surface-variant-rgb, 67, 71, 78), 0.5); border-radius: 12px; border: 1px solid transparent; transition: background-color 0.2s, border-color 0.2s, opacity 0.3s ease, transform 0.3s ease; }
.blocklist-item:hover { background-color: rgba(var(--md-sys-color-surface-variant-rgb, 67, 71, 78), 0.7); border-color: var(--md-sys-color-outline); }
.blocklist-item span { flex: 1; word-break: break-all; margin-right: 12px; font-size: var(--md-sys-typescale-label-medium-font-size); color: var(--md-sys-color-on-surface-variant); font-family: 'Consolas', 'Monaco', monospace; }
.blocklist-controls { display: flex; gap: 6px; flex-shrink: 0; }
.blocklist-btn { padding: 6px 10px; min-width: auto; min-height: 32px; font-size: var(--md-sys-typescale-label-small-font-size); border-radius: 16px !important; }
.blocklist-btn-delete { background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
.blocklist-btn-copy { background-color: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
#blocklist-empty { text-align:center; color: var(--md-sys-color-on-surface-variant); padding: 20px 0; }

/* ==== Toast Notifications (Snackbar) ==== */
#mes-toast-container { position: fixed; bottom: 90px; /* Adjusted position */ left: 50%; transform: translateX(-50%); z-index: 2147483647 !important; display: flex; flex-direction: column-reverse; /* Show newest at bottom */ align-items: center; gap: 10px; pointer-events: none; width: max-content; max-width: 90%; }
.mes-toast { background-color: var(--md-sys-color-inverse-surface); color: var(--md-sys-color-inverse-on-surface); padding: 14px 20px; border-radius: 8px; box-shadow: 0 3px 5px -1px rgba(0,0,0,0.2), 0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12); font-size: var(--md-sys-typescale-label-large-font-size); opacity: 0; transform: translateY(20px); transition: opacity 0.3s ease, transform 0.3s ease, background-color 0.3s ease; pointer-events: all; max-width: 100%; text-align: center; }
.mes-toast.show { opacity: 1; transform: translateY(0); }
/* Semantic Colors for Toasts */
.mes-toast.info { background-color: #333; color: white; } /* Default M3 Snackbar */
.mes-toast.success { background-color: var(--md-sys-color-success-container); color: var(--md-sys-color-success); }
.mes-toast.error { background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
.mes-toast.warning { background-color: #4d3a00; color: var(--md-sys-color-warning); }
    `;
    document.head.appendChild(style);

    // --- UI 요소 생성 ---
    let panel, settingsPanel, toggleBtn, listPanel, toastContainer;
    function createUIElements() {
        // Toast Container (Must be first for other elements to potentially use it)
        toastContainer = document.createElement('div');
        toastContainer.id = 'mes-toast-container';
        toastContainer.className = 'mobile-block-ui';
        document.body.appendChild(toastContainer);

        // Main Blocker Panel (Bottom)
        panel = document.createElement('div');
        panel.id = 'mobile-block-panel';
        panel.className = 'mobile-block-ui';
        panel.innerHTML = `
            <div id="blocker-info-wrapper">
                <span id="blocker-info-label">${STRINGS.selectedElementLabel}</span>
                <div id="blocker-info"></div>
            </div>
            <label for="blocker-slider" style="display: block; font-size: var(--md-sys-typescale-label-medium-font-size); color: var(--md-sys-color-on-surface-variant); margin-bottom: 5px;">${STRINGS.parentLevelLabel}</label>
            <input type="range" id="blocker-slider" class="mb-slider" min="0" max="10" value="0" aria-label="Parent Level Selector">
            <div class="button-grid">
                <button id="blocker-copy" class="mb-btn secondary">${STRINGS.copy}</button>
                <button id="blocker-preview" class="mb-btn secondary">${STRINGS.preview}</button>
                <button id="blocker-add-block" class="mb-btn primary">${STRINGS.saveRule}</button>
                <button id="blocker-list" class="mb-btn tertiary">${STRINGS.list}</button>
                <button id="blocker-settings" class="mb-btn tertiary">${STRINGS.settings}</button>
                <button id="blocker-cancel" class="mb-btn surface">${STRINGS.cancel}</button>
            </div>`;
        document.body.appendChild(panel);

        // Block List Panel (Center Modal)
        listPanel = document.createElement('div');
        listPanel.id = 'mobile-blocklist-panel';
        listPanel.className = 'mobile-block-ui';
        listPanel.innerHTML = `
            <h3 class="mb-panel-title">${STRINGS.listTitle}</h3>
            <div id="blocklist-container"></div>
            <button id="blocklist-close" class="mb-btn surface" style="width: 100%; margin-top: 15px;">${STRINGS.close}</button>`;
        document.body.appendChild(listPanel);

        // Settings Panel (Center Modal)
        settingsPanel = document.createElement('div');
        settingsPanel.id = 'mobile-settings-panel';
        settingsPanel.className = 'mobile-block-ui';
        settingsPanel.innerHTML = `
            <h3 class="mb-panel-title">${STRINGS.settingsTitle}</h3>
            <div class="settings-item">
                <label><span class="settings-label-text">${STRINGS.includeSiteNameLabel}</span>
                    <button id="settings-toggle-site" class="mb-btn ${settings.includeSiteName ? 'active' : ''}">${settings.includeSiteName ? STRINGS.on : STRINGS.off}</button>
                </label>
            </div>
            <div class="settings-item">
                <label><span class="settings-label-text">${STRINGS.useAdguardLogoLabel}</span>
                    <button id="settings-adguard-logo" class="mb-btn ${settings.showAdguardLogo ? 'active' : ''}">${settings.showAdguardLogo ? STRINGS.on : STRINGS.off}</button>
                </label>
            </div>
             <div class="settings-item">
                <label><span class="settings-label-text">${STRINGS.tempDisableLabel}</span>
                    <button id="settings-temp-disable" class="mb-btn ${settings.tempBlockingDisabled ? 'active error' : 'secondary'}">${settings.tempBlockingDisabled ? STRINGS.on : STRINGS.off}</button>
                </label>
            </div>
            <div class="settings-item">
                <label for="settings-panel-opacity">
                    <span class="settings-label-text">${STRINGS.panelOpacityLabel}</span>
                    <span id="opacity-value" class="settings-value">${settings.panelOpacity.toFixed(2)}</span>
                </label>
                <input id="settings-panel-opacity" type="range" class="mb-slider" min="0.1" max="1.0" step="0.05" value="${settings.panelOpacity}" aria-label="Panel Opacity">
            </div>
            <div class="settings-item">
                <label for="settings-toggle-size">
                    <span class="settings-label-text">${STRINGS.toggleSizeLabel}</span>
                    <span id="toggle-size-value" class="settings-value">${settings.toggleSizeScale.toFixed(1)}x</span>
                </label>
                <input id="settings-toggle-size" type="range" class="mb-slider" min="0.5" max="2.0" step="0.1" value="${settings.toggleSizeScale}" aria-label="Toggle Button Size">
            </div>
            <div class="settings-item">
                <label for="settings-toggle-opacity">
                    <span class="settings-label-text">${STRINGS.toggleOpacityLabel}</span>
                    <span id="toggle-opacity-value" class="settings-value">${settings.toggleOpacity.toFixed(2)}</span>
                </label>
                <input id="settings-toggle-opacity" type="range" class="mb-slider" min="0.1" max="1.0" step="0.05" value="${settings.toggleOpacity}" aria-label="Toggle Button Opacity">
            </div>
            <div class="button-grid" style="margin-top: 20px; grid-template-columns: 1fr 1fr;">
                 <button id="settings-backup" class="mb-btn outline">${STRINGS.backupLabel}</button>
                 <button id="settings-restore" class="mb-btn outline">${STRINGS.restoreLabel}</button>
                 <input type="file" id="settings-restore-input" accept=".json">
            </div>
            <button id="settings-close" class="mb-btn surface" style="width: 100%; margin-top: 20px;">${STRINGS.close}</button>`;
        document.body.appendChild(settingsPanel);

        // Toggle Button (FAB)
        toggleBtn = document.createElement('button');
        toggleBtn.id = 'mobile-block-toggleBtn';
        toggleBtn.className = 'mobile-block-ui';
        toggleBtn.setAttribute('aria-label', 'Toggle Element Selector');
        document.body.appendChild(toggleBtn); // Append early

        // Apply loaded settings to CSS variables and button states
        updateCSSVariables();
        updateToggleIcon(); // Set initial icon based on settings

        // Initialize event listeners and apply initial blocking
        initRefsAndEvents();
        applyBlocking(); // Apply rules on load
    }

    // --- Toast Notification Function ---
    function showToast(message, type = 'info', duration = 3000) {
        if (!toastContainer) {
            console.warn(SCRIPT_ID, "Toast container not ready for message:", message);
            return;
        }
        const toast = document.createElement('div');
        toast.className = `mes-toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast); // Append to container

        // Force reflow for transition
        void toast.offsetWidth;

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                try { toast.remove(); } catch (e) { /* Ignore potential error if already removed */ }
            }, { once: true });
            // Fallback removal in case transitionend doesn't fire
            setTimeout(() => {
                try { toast.remove(); } catch (e) { /* Ignore */ }
            }, 500); // Slightly longer than transition duration
        }, duration);
    }


    // --- 전역 변수 ---
    let selecting = false;
    let selectedEl = null;
    let initialTouchedElement = null; // Element initially touched
    let touchStartX = 0, touchStartY = 0, touchMoved = false;
    const moveThreshold = 15; // Increased threshold
    let blockedSelectorsCache = []; // Cache for loaded rules

    // --- 함수: 차단목록 불러오기/저장 (Improved with try/catch and caching) ---
    async function loadBlockedSelectors() {
        let stored = '[]';
        try {
            stored = await GM_getValue(BLOCKED_SELECTORS_KEY, '[]');
            const parsed = JSON.parse(stored);
            blockedSelectorsCache = Array.isArray(parsed) ? parsed : [];
            console.log(SCRIPT_ID, `Loaded ${blockedSelectorsCache.length} rules from storage.`);
            return blockedSelectorsCache;
        } catch (e) {
            console.error(SCRIPT_ID, `Error parsing blocked selectors from key '${BLOCKED_SELECTORS_KEY}', resetting. Stored value:`, stored, e);
            try {
                await GM_setValue(BLOCKED_SELECTORS_KEY, '[]');
            } catch (resetError) {
                 console.error(SCRIPT_ID, "Failed to reset storage after parse error", resetError);
            }
            blockedSelectorsCache = [];
            return [];
        }
    }

    async function saveBlockedSelectors(list) {
        const selectorsToSave = Array.isArray(list) ? list : [];
        try {
            await GM_setValue(BLOCKED_SELECTORS_KEY, JSON.stringify(selectorsToSave));
            blockedSelectorsCache = [...selectorsToSave]; // Update cache
            console.log(SCRIPT_ID, `Saved ${selectorsToSave.length} rules.`);
        } catch (e) {
            console.error(SCRIPT_ID, "Error saving blocked selectors to GM:", e);
            showToast(STRINGS.settingsSaveError, 'error'); // Use generic save error
        }
    }

    // --- 함수: 차단 규칙 적용/해제 ---
    // Stores original display style for temporary disabling
    const originalDisplayMap = new Map();

    async function applyBlocking(showToastNotification = false) {
        if (settings.tempBlockingDisabled) {
            console.log(SCRIPT_ID, "Blocking temporarily disabled. Skipping application.");
            // Ensure elements hidden by the script are shown if temp disable is active
            disableAllBlocking(false); // Don't show toast here
            return 0; // Indicate 0 rules applied
        }

        console.log(SCRIPT_ID, "Applying block rules...");
        // Ensure cache is populated if empty
        if (blockedSelectorsCache.length === 0) {
            await loadBlockedSelectors();
        }

        let count = 0;
        let appliedCount = 0;
        const currentHostname = location.hostname;

        blockedSelectorsCache.forEach(rule => {
            if (typeof rule !== 'string' || !rule.includes('##')) {
                 console.warn(SCRIPT_ID, "Skipping invalid block rule format:", rule);
                 return;
            }

            const parts = rule.split('##');
            const domain = parts[0];
            const cssSelector = parts[1];

            if (!cssSelector) {
                 console.warn(SCRIPT_ID, "Skipping rule with empty selector:", rule);
                 return;
            }
            // Check domain match
            if (domain && domain !== '*' && currentHostname !== domain) {
                return; // Rule not for this domain
            }

            try {
                // Use more robust querySelectorAll
                const elements = document.querySelectorAll(cssSelector);
                elements.forEach(el => {
                     // Check if element is already hidden by THIS script or naturally
                     const isHiddenByScript = el.style.display === 'none' && el.hasAttribute('data-mes-hidden');
                     const isNaturallyHidden = window.getComputedStyle(el).display === 'none';

                     if (!isHiddenByScript && !isNaturallyHidden) {
                         // Store original display if not already stored
                         if (!originalDisplayMap.has(el)) {
                             originalDisplayMap.set(el, el.style.display || 'unset'); // Store 'unset' if inline style is empty
                         }
                         el.style.setProperty('display', 'none', 'important');
                         el.setAttribute('data-mes-hidden', 'true'); // Mark as hidden by script
                         count++;
                     } else if (isHiddenByScript) {
                        // Ensure map has entry even if already hidden by script on page load
                        if (!originalDisplayMap.has(el)) {
                           originalDisplayMap.set(el, 'unset'); // Assume unset if hidden before we could check
                        }
                     }
                });
                if(elements.length > 0) appliedCount++; // Count rule as applied if it matched any elements

            } catch (e) {
                // Ignore querySelectorAll errors for potentially invalid selectors during runtime
                // console.warn(SCRIPT_ID, `CSS selector error for rule "${rule}":`, e.message);
            }
        });

        if (count > 0) console.log(SCRIPT_ID, `Applied ${appliedCount} rules, hid ${count} new elements.`);
        else console.log(SCRIPT_ID, `Applied ${appliedCount} rules, no new elements needed hiding.`);

        if (showToastNotification && appliedCount > 0 && !settings.tempBlockingDisabled) {
            showToast(STRINGS.blockingApplied(appliedCount), 'success', 2000);
        }
        return appliedCount; // Return number of rules that potentially matched something
    }

    // Function to disable all blocking temporarily
    function disableAllBlocking(showToastNotification = true) {
        console.log(SCRIPT_ID, "Disabling all blocking rules temporarily...");
        let restoredCount = 0;
        document.querySelectorAll('[data-mes-hidden="true"]').forEach(el => {
            const originalDisplay = originalDisplayMap.get(el);
            if (originalDisplay === 'unset') {
                el.style.removeProperty('display');
            } else if (originalDisplay !== undefined) { // Check if we have a stored value
                el.style.setProperty('display', originalDisplay, ''); // Restore original, remove important
            } else {
                 // Fallback if somehow not in map (shouldn't happen often)
                 el.style.removeProperty('display');
            }
            el.removeAttribute('data-mes-hidden');
            restoredCount++;
        });
        console.log(SCRIPT_ID, `Restored display for ${restoredCount} elements.`);
        if (showToastNotification) {
            showToast(STRINGS.tempBlockingOn, 'warning', 2500);
        }
    }

    // Function to re-enable blocking after temporary disable
    async function enableAllBlocking(showToastNotification = true) {
        console.log(SCRIPT_ID, "Re-enabling blocking rules...");
        const appliedCount = await applyBlocking(false); // Re-apply rules without toast
        if (showToastNotification && appliedCount > 0) {
            showToast(STRINGS.tempBlockingOff, 'success', 2000);
        } else if (showToastNotification) {
            showToast(STRINGS.tempBlockingOff, 'info', 1500); // Show info even if 0 applied
        }
    }


    // --- 함수: 토글 버튼 아이콘 업데이트 ---
    function updateToggleIcon() {
        if (!toggleBtn) return;
        if (settings.showAdguardLogo) {
            toggleBtn.innerHTML = `<span class="toggle-icon toggle-icon-adguard" aria-hidden="true"></span>`;
        } else {
            // Use plus icon normally, edit icon when selecting
            toggleBtn.innerHTML = `<span class="toggle-icon toggle-icon-plus" aria-hidden="true"></span>`;
        }
        // Add/remove 'selecting' class which changes background and potentially icon via CSS
        toggleBtn.classList.toggle('selecting', selecting);
    }

    // --- 함수: 고유 CSS 선택자 생성 (개선됨) ---
    function generateSelector(el, maxDepth = 7, requireUnique = true) {
        if (!el || el.nodeType !== 1 || el.closest('.mobile-block-ui')) return '';

        // 1. Prioritize ID if unique and stable
        if (el.id) {
            const id = el.id;
            const escapedId = CSS.escape(id);
            // Basic stability check: not just digits, not overly simple, no common dynamic patterns
            if (!/^\d+$/.test(id) && id.length > 2 && !id.startsWith('ember') && !id.startsWith('react') && !id.includes(':')) {
                try {
                    if (document.querySelectorAll(`#${escapedId}`).length === 1) {
                        return `#${escapedId}`;
                    }
                } catch (e) { /* Invalid ID selector */ }
            }
        }

        // 2. Generate Path with Stable Classes and nth-of-type fallback
        const parts = [];
        let current = el;
        let depth = 0;

        while (current && current.tagName && depth < maxDepth) {
            const tagName = current.tagName.toLowerCase();
            if (tagName === 'body' || tagName === 'html') break;
            if (current.closest('.mobile-block-ui')) { // Stop if we hit our own UI
                current = current.parentElement;
                continue;
            }

            let part = tagName;
            let addedSpecificity = false;

            // Try stable classes
            const stableClasses = Array.from(current.classList)
                .filter(c => c && c.length > 2 && // Minimum length
                              !/^[a-z]{1,2}$/i.test(c) && // Avoid things like 'a', 'b', 'is'
                              !/\d/.test(c) && // Avoid classes with numbers (often dynamic)
                              !/active|select|focus|hover|disabled|open|closed|visible|hidden|js-|ui-/i.test(c) && // Avoid common state classes
                              !/^[A-Z0-9]{4,}$/.test(c) && // Avoid generated-like IDs (heuristic)
                              !c.includes('--') && !c.includes('__') && // Avoid BEM modifiers/elements (can be unstable)
                              !['selected-element', 'mobile-block-ui'].some(uiClass => c.includes(uiClass)))
                .slice(0, 2); // Limit to 2 classes for brevity

            if (stableClasses.length > 0) {
                part += '.' + stableClasses.map(c => CSS.escape(c)).join('.');
                addedSpecificity = true;
            }

            // If no stable classes or still ambiguous among siblings, use nth-of-type
            if (!addedSpecificity || (current.parentElement && !current.parentElement.closest('.mobile-block-ui'))) {
                const siblings = current.parentElement ? Array.from(current.parentElement.children) : [];
                const sameTagSiblings = siblings.filter(sib => sib.tagName === current.tagName && !sib.closest('.mobile-block-ui'));

                if (sameTagSiblings.length > 1) {
                    const index = sameTagSiblings.indexOf(current) + 1;
                    if (index > 0) {
                        // Only add nth-of-type if classes weren't specific enough OR there were no classes
                        part += `:nth-of-type(${index})`;
                        addedSpecificity = true; // Mark that we added something
                    }
                }
            }
            // If no specific class or nth-of-type was added, just use the tag name (already set)

            parts.unshift(part); // Add to beginning

             // Early exit check: Try selector uniqueness after adding a part
             if (requireUnique && parts.length > 0 && depth > 0) { // Check after adding parent info
                 const tempSelector = parts.join(' > ');
                 try {
                     if (document.querySelectorAll(tempSelector).length === 1) {
                         // Found a unique selector early
                          console.log(SCRIPT_ID, `Unique selector found early: ${tempSelector}`);
                         return tempSelector;
                     }
                 } catch (e) { /* Ignore invalid intermediate selectors */ }
             }

            current = current.parentElement;
            depth++;
        }

        let finalSelector = parts.join(' > ');

        // Final uniqueness check if required
        if (requireUnique && finalSelector) {
            try {
                const matches = document.querySelectorAll(finalSelector);
                if (matches.length !== 1) {
                    console.warn(SCRIPT_ID, `Generated selector "${finalSelector}" matches ${matches.length} elements. Trying parent recursively.`);
                    // If not unique, try generating selector for the parent and prepending (limit recursion)
                    if (el.parentElement && !el.parentElement.closest('.mobile-block-ui') && maxDepth > 0) { // Prevent infinite loop
                       const parentSelector = generateSelector(el.parentElement, maxDepth -1, false); // Don't require parent to be unique itself
                       if (parentSelector) {
                           const combinedSelector = parentSelector + " > " + finalSelector;
                           try {
                               if (document.querySelectorAll(combinedSelector).length === 1) {
                                   console.log(SCRIPT_ID, `Using combined unique selector: ${combinedSelector}`);
                                   return combinedSelector;
                               } else {
                                    console.warn(SCRIPT_ID, `Combined selector "${combinedSelector}" still not unique.`);
                               }
                           } catch(e) { /* Ignore combined error */ }
                       }
                    }
                     console.warn(SCRIPT_ID, `Could not guarantee uniqueness for: ${finalSelector}`);
                    // Return the best guess if uniqueness failed
                    return finalSelector;
                }
            } catch (e) {
                 console.error(SCRIPT_ID, `Error validating selector "${finalSelector}":`, e);
                 return ''; // Invalid selector generated
            }
        }

        // Basic validation: ensure selector isn't empty or just body/html
        if (!finalSelector || finalSelector === 'body' || finalSelector === 'html') {
             return '';
        }

        return finalSelector;
    }

    // --- 초기화: 참조 및 이벤트 리스너 설정 ---
    function initRefsAndEvents() {
        // --- Get Element References ---
        const infoLabel = panel.querySelector('#blocker-info-label');
        const info = panel.querySelector('#blocker-info');
        const slider = panel.querySelector('#blocker-slider');
        const copyBtn = panel.querySelector('#blocker-copy');
        const previewBtn = panel.querySelector('#blocker-preview');
        const addBtn = panel.querySelector('#blocker-add-block');
        const listBtn = panel.querySelector('#blocker-list');
        const settingsBtn = panel.querySelector('#blocker-settings');
        const cancelBtn = panel.querySelector('#blocker-cancel');

        const listContainer = listPanel.querySelector('#blocklist-container');
        const listClose = listPanel.querySelector('#blocklist-close');

        const settingsClose = settingsPanel.querySelector('#settings-close');
        const toggleSiteBtn = settingsPanel.querySelector('#settings-toggle-site');
        const adguardLogoToggleBtn = settingsPanel.querySelector('#settings-adguard-logo');
        const tempDisableBtn = settingsPanel.querySelector('#settings-temp-disable');
        const panelOpacitySlider = settingsPanel.querySelector('#settings-panel-opacity');
        const panelOpacityValue = settingsPanel.querySelector('#opacity-value');
        const toggleSizeSlider = settingsPanel.querySelector('#settings-toggle-size');
        const toggleSizeValue = settingsPanel.querySelector('#toggle-size-value');
        const toggleOpacitySlider = settingsPanel.querySelector('#settings-toggle-opacity');
        const toggleOpacityValue = settingsPanel.querySelector('#toggle-opacity-value');
        const backupBtn = settingsPanel.querySelector('#settings-backup');
        const restoreBtn = settingsPanel.querySelector('#settings-restore');
        const restoreInput = settingsPanel.querySelector('#settings-restore-input');

        // --- State Variables ---
        let isPreviewHidden = false;
        let previewedElement = null;

        // --- Helper Functions ---
        function removeSelectionHighlight() {
            if (selectedEl) {
                selectedEl.classList.remove('selected-element');
            }
            selectedEl = null;
            // Keep initialTouchedElement until a new touch starts
            if (slider) slider.value = 0;
            if (info) info.textContent = '';
        }

        function resetPreview() {
            if (isPreviewHidden && previewedElement) {
                try {
                    const originalDisplay = previewedElement.dataset._original_display;
                    if (originalDisplay === 'unset') {
                        previewedElement.style.removeProperty('display');
                    } else if (originalDisplay !== undefined) {
                        previewedElement.style.setProperty('display', originalDisplay, ''); // remove !important
                    }
                    delete previewedElement.dataset._original_display; // Clean up dataset
                    // Re-add highlight if it's the currently selected element
                    if(previewedElement === selectedEl) {
                        previewedElement.classList.add('selected-element');
                    }
                } catch (e) {
                     console.warn(SCRIPT_ID, "Error resetting preview style:", e)
                }
            }
            // Always reset button text/style
            if (previewBtn) {
                previewBtn.textContent = STRINGS.preview;
                previewBtn.classList.remove('tertiary'); // Use correct class
                previewBtn.classList.add('secondary');
            }
            isPreviewHidden = false;
            previewedElement = null;
        }

        function updateInfo() {
            if (!info) return;
            // Generate selector without requiring unique initially for display
            const selectorText = selectedEl ? generateSelector(selectedEl, 7, false) : '';
            info.textContent = selectorText;
            infoLabel.style.display = 'block';
        }

        // Improved Panel Visibility Handling
        let activePanel = null;
        function setPanelVisibility(panelElement, visible) {
            if (!panelElement) return;

            if (visible) {
                // Hide other panels first
                [panel, settingsPanel, listPanel].forEach(p => {
                    if (p && p !== panelElement && p.classList.contains('visible')) {
                        p.classList.remove('visible');
                        // Use transitionend for reliable hiding, with timeout fallback
                        const transitionEndHandler = () => {
                            if (!p.classList.contains('visible')) p.style.display = 'none';
                            p.removeEventListener('transitionend', transitionEndHandler);
                        };
                        p.addEventListener('transitionend', transitionEndHandler);
                        setTimeout(() => { // Fallback
                             if (!p.classList.contains('visible')) p.style.display = 'none';
                             p.removeEventListener('transitionend', transitionEndHandler);
                        }, 350);
                    }
                });

                // Show the target panel
                activePanel = panelElement;
                panelElement.style.display = 'block';
                // Use double requestAnimationFrame for fade-in transition
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        panelElement.classList.add('visible');
                    });
                });
            } else {
                 if (activePanel === panelElement) activePanel = null;
                 panelElement.classList.remove('visible');
                 // Use transitionend for reliable hiding, with timeout fallback
                 const transitionEndHandler = () => {
                     if (!panelElement.classList.contains('visible')) panelElement.style.display = 'none';
                     panelElement.removeEventListener('transitionend', transitionEndHandler);
                 };
                 panelElement.addEventListener('transitionend', transitionEndHandler);
                 setTimeout(() => { // Fallback
                      if (!panelElement.classList.contains('visible')) panelElement.style.display = 'none';
                      panelElement.removeEventListener('transitionend', transitionEndHandler);
                 }, 350);
            }
        }


        async function addBlockRule(selector) {
            console.log('[addBlockRule] Attempting for selector:', selector);
            if (!selector) {
                return { success: false, message: STRINGS.cannotGenerateSelector };
            }

            let fullSelector = "##" + selector;
            if (settings.includeSiteName) {
                const hostname = location.hostname;
                if (!hostname) {
                    console.error(SCRIPT_ID, "Could not get location.hostname");
                    return { success: false, message: '호스트 이름을 가져올 수 없습니다.' }; // Keep original for specific error
                }
                fullSelector = hostname + fullSelector;
            }

            // Use cached rules first
            if (blockedSelectorsCache.includes(fullSelector)) {
                console.log(SCRIPT_ID, "Rule already exists:", fullSelector);
                return { success: false, message: STRINGS.ruleExists };
            }

            // Add to cache and save
            const updatedList = [...blockedSelectorsCache, fullSelector];
            await saveBlockedSelectors(updatedList); // Save triggers cache update

            console.log(SCRIPT_ID, "Rule added:", fullSelector);
            return { success: true, rule: fullSelector };
        }

        async function showList() {
            console.log('[showList] Function called');
            try {
                // Load fresh data in case it changed elsewhere (though unlikely)
                const arr = await loadBlockedSelectors();
                console.log(`[showList] Rendering ${arr.length} rules.`);
                listContainer.innerHTML = ''; // Clear previous list

                if (arr.length === 0) {
                    listContainer.innerHTML = `<p id="blocklist-empty">${STRINGS.noRules}</p>`;
                } else {
                    arr.forEach((rule, index) => { // Use index for reliable deletion
                        const item = document.createElement('div');
                        item.className = 'blocklist-item';

                        const span = document.createElement('span');
                        span.textContent = rule;
                        span.title = rule; // Tooltip for long rules

                        const controlsDiv = document.createElement('div');
                        controlsDiv.className = 'blocklist-controls';

                        // Copy Button
                        const copyButton = document.createElement('button');
                        copyButton.className = 'mb-btn blocklist-btn blocklist-btn-copy';
                        copyButton.textContent = STRINGS.copy;
                        copyButton.title = '규칙 복사';
                        copyButton.addEventListener('click', () => {
                            try {
                                GM_setClipboard(rule);
                                showToast(STRINGS.ruleCopied, 'success', 2000);
                            } catch (copyError) {
                                console.error(SCRIPT_ID, "Error copying rule to clipboard:", copyError);
                                showToast(STRINGS.clipboardError, 'error');
                            }
                        });

                        // Delete Button
                        const deleteButton = document.createElement('button');
                        deleteButton.className = 'mb-btn blocklist-btn blocklist-btn-delete';
                        deleteButton.textContent = '삭제'; // Use text instead of icon for clarity
                        deleteButton.title = '규칙 삭제';
                        deleteButton.addEventListener('click', async () => {
                            console.log('[showList] Delete button clicked for rule:', rule);
                            try {
                                // Find the actual index in the current cache just in case
                                const currentIndex = blockedSelectorsCache.indexOf(rule);
                                if (currentIndex > -1) {
                                    blockedSelectorsCache.splice(currentIndex, 1);
                                    await saveBlockedSelectors(blockedSelectorsCache); // Save the modified cache

                                    // Animate removal
                                    item.style.opacity = '0';
                                    item.style.transform = 'translateX(20px) scale(0.95)';
                                    setTimeout(async () => {
                                        item.remove(); // Remove element from DOM
                                        // Check if list is now empty
                                        if (listContainer.childElementCount === 0) {
                                             listContainer.innerHTML = `<p id="blocklist-empty">${STRINGS.noRules}</p>`;
                                        }
                                        await applyBlocking(false); // Re-apply rules (un-hide if needed)
                                        showToast(STRINGS.ruleDeleted, 'info', 2000);
                                    }, 300); // Match transition duration

                                } else {
                                     console.warn("Rule not found in cache for deletion:", rule);
                                     showToast(STRINGS.ruleDeleteError, 'error');
                                     await showList(); // Refresh list if state is inconsistent
                                }
                            } catch (deleteError) {
                                console.error(SCRIPT_ID, "Error deleting rule:", deleteError);
                                showToast(STRINGS.ruleDeleteError, 'error');
                            }
                        });

                        controlsDiv.append(copyButton, deleteButton);
                        item.append(span, controlsDiv);
                        listContainer.append(item);
                    });
                }
                 console.log('[showList] Rendering list panel.');
                 setPanelVisibility(listPanel, true); // Show the list panel

            } catch (error) {
                console.error(SCRIPT_ID, "Error in showList:", error);
                showToast(STRINGS.listShowError, 'error');
                setPanelVisibility(listPanel, false); // Hide panel on error
            }
        }

        function setBlockMode(enabled) {
            if (!toggleBtn || !panel) return;

            selecting = enabled;
            toggleBtn.classList.toggle('selecting', enabled);
            updateToggleIcon(); // Update icon based on state

            if (enabled) {
                // Enter selection mode
                setPanelVisibility(panel, true);
                if (selectedEl) { // If an element was already selected, re-highlight
                    selectedEl.classList.add('selected-element');
                }
                updateInfo(); // Show info for potentially selected element
            } else {
                // Exit selection mode
                setPanelVisibility(panel, false);
                 // Only hide list/settings if they are the currently active panel
                if (activePanel === listPanel) setPanelVisibility(listPanel, false);
                if (activePanel === settingsPanel) setPanelVisibility(settingsPanel, false);

                removeSelectionHighlight();
                resetPreview();
                initialTouchedElement = null; // Clear touch target on exit
            }
            console.log(SCRIPT_ID, "Selection mode:", enabled ? "ON" : "OFF");
        }

        // --- Event Listeners ---
        console.log(SCRIPT_ID, 'Attaching event listeners...');

        // Toggle Button
        toggleBtn.addEventListener('click', () => {
            setBlockMode(!selecting);
        });

        // --- Main Panel Buttons ---
        copyBtn.addEventListener('click', () => {
            if (!selectedEl) { showToast(STRINGS.noElementSelected, 'warning'); return; }
            // Generate selector requiring uniqueness for copy
            const selector = generateSelector(selectedEl, 7, true);
            if (!selector) { showToast(STRINGS.cannotGenerateSelector, 'error'); return; }

            let finalSelector = "##" + selector;
            if (settings.includeSiteName) {
                 finalSelector = location.hostname + finalSelector;
            }
            try {
                GM_setClipboard(finalSelector);
                showToast(STRINGS.selectorCopied, 'success');
            } catch (err) {
                console.error(SCRIPT_ID, "Error copying to clipboard:", err);
                showToast(STRINGS.clipboardError, 'error');
                // Fallback prompt
                try { prompt(STRINGS.promptCopy, finalSelector); } catch (e) { /* Ignore prompt errors */}
            }
        });

        previewBtn.addEventListener('click', () => {
            if (!selectedEl) { showToast(STRINGS.noElementSelected, 'warning'); return; }

            if (!isPreviewHidden) {
                // Check if element is already display:none
                if (window.getComputedStyle(selectedEl).display === 'none') {
                    showToast(STRINGS.alreadyHidden, 'info');
                    return;
                }
                // Store original style and hide
                const currentDisplay = selectedEl.style.display;
                selectedEl.dataset._original_display = currentDisplay === '' ? 'unset' : currentDisplay;
                selectedEl.style.setProperty('display', 'none', 'important');

                previewBtn.textContent = STRINGS.restorePreview;
                previewBtn.classList.remove('secondary');
                previewBtn.classList.add('tertiary'); // Use tertiary for restore state
                isPreviewHidden = true;
                previewedElement = selectedEl;
                selectedEl.classList.remove('selected-element'); // Remove highlight during preview
                console.log(SCRIPT_ID, "Previewing hide for:", selectedEl);

            } else {
                // Restore preview
                 if (previewedElement && previewedElement !== selectedEl) {
                     // If trying to restore while a *different* element is selected
                     showToast(STRINGS.previewDifferentElement, 'warning');
                     return; // Don't restore if selection changed
                 }
                 resetPreview(); // Resets button text/style and restores display
                 // No need to re-add selected-element class here, resetPreview handles it
                 console.log(SCRIPT_ID, "Restored preview for:", previewedElement);
            }
        });

        addBtn.addEventListener('click', async () => {
            console.log('[addBtn] Clicked');
            if (!selectedEl) { showToast(STRINGS.noElementSelected, 'warning'); return; }

            try {
                // Generate selector requiring uniqueness for saving
                const selector = generateSelector(selectedEl, 7, true);
                console.log('[addBtn] Generated selector for saving:', selector);
                if (!selector) { showToast(STRINGS.cannotGenerateSelector, 'error'); return; }

                const result = await addBlockRule(selector);
                console.log('[addBtn] addBlockRule result:', result);

                if (result.success) {
                     showToast(STRINGS.ruleSavedReloading, 'success', 2000);
                     // Immediately apply the new rule visually
                     try {
                         // Re-query based on the *saved* rule's selector part
                         const ruleSelector = result.rule.split('##')[1];
                         document.querySelectorAll(ruleSelector).forEach(el => {
                             if (!originalDisplayMap.has(el)) {
                                 originalDisplayMap.set(el, el.style.display || 'unset');
                             }
                             el.style.setProperty('display', 'none', 'important');
                             el.setAttribute('data-mes-hidden', 'true');
                         });
                     } catch (applyError) {
                         console.error(SCRIPT_ID, "Error applying rule immediately after save:", applyError);
                         showToast(STRINGS.ruleSavedApplyFailed, 'warning', 3000);
                         // Still proceed to exit selection mode
                     }
                     // Exit selection mode after successful save
                     setBlockMode(false);

                } else {
                    // Show error/info message from addBlockRule
                    showToast(result.message || STRINGS.ruleAddError, result.success ? 'success' : 'info');
                }
            } catch (error) {
                console.error(SCRIPT_ID, "Error during Save Rule click:", error);
                showToast(`${STRINGS.ruleAddError} ${error.message}`, 'error');
            }
        });

        listBtn.addEventListener('click', () => {
            console.log('[listBtn] Clicked');
             // Hide main panel before showing list
             setPanelVisibility(panel, false);
             showList(); // This will handle showing the list panel
        });

        settingsBtn.addEventListener('click', () => {
             console.log('[settingsBtn] Clicked');
             // Hide main panel before showing settings
             setPanelVisibility(panel, false);
             setPanelVisibility(settingsPanel, true); // Show settings panel
        });

        cancelBtn.addEventListener('click', () => {
            setBlockMode(false); // Exit selection mode
        });

        // --- List Panel Close Button ---
        listClose.addEventListener('click', () => {
            console.log('[listClose] Clicked');
            setPanelVisibility(listPanel, false);
            // Restore main panel ONLY if selection mode was active when list was opened
            if (selecting) {
                console.log('[listClose] Restoring main panel');
                setPanelVisibility(panel, true);
            }
        });

        // --- Settings Panel Buttons ---
        settingsClose.addEventListener('click', () => {
             console.log('[settingsClose] Clicked');
             setPanelVisibility(settingsPanel, false);
             // Restore main panel ONLY if selection mode was active when settings was opened
             if (selecting) {
                 console.log('[settingsClose] Restoring main panel');
                 setPanelVisibility(panel, true);
             }
        });

        toggleSiteBtn.addEventListener('click', async () => {
            settings.includeSiteName = !settings.includeSiteName;
            toggleSiteBtn.textContent = settings.includeSiteName ? STRINGS.on : STRINGS.off;
            toggleSiteBtn.classList.toggle('active', settings.includeSiteName);
            await saveSettings(); // Save all settings
            showToast(STRINGS.settingsSaved, 'info', 1500);
        });

        adguardLogoToggleBtn.addEventListener('click', async () => {
            settings.showAdguardLogo = !settings.showAdguardLogo;
            adguardLogoToggleBtn.textContent = settings.showAdguardLogo ? STRINGS.on : STRINGS.off;
            adguardLogoToggleBtn.classList.toggle('active', settings.showAdguardLogo);
            updateToggleIcon(); // Update FAB icon immediately
            await saveSettings();
            showToast(STRINGS.settingsSaved, 'info', 1500);
        });

        tempDisableBtn.addEventListener('click', async () => {
            settings.tempBlockingDisabled = !settings.tempBlockingDisabled;
            tempDisableBtn.textContent = settings.tempBlockingDisabled ? STRINGS.on : STRINGS.off;
            tempDisableBtn.classList.toggle('active', settings.tempBlockingDisabled);
            tempDisableBtn.classList.toggle('error', settings.tempBlockingDisabled); // Add error style when ON
            tempDisableBtn.classList.toggle('secondary', !settings.tempBlockingDisabled); // Use secondary when OFF

            if (settings.tempBlockingDisabled) {
                disableAllBlocking(); // Disables and shows toast
            } else {
                await enableAllBlocking(); // Re-enables and shows toast
            }
            await saveSettings();
            // No extra toast needed here, enable/disable functions show toasts
        });


        // --- Settings Sliders (with debounced save) ---
        let saveTimeout;
        const debounceSaveSettings = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(async () => {
                await saveSettings();
                // Avoid toast spam on slider changes
                // showToast(STRINGS.settingsSaved, 'info', 1000);
                console.log(SCRIPT_ID, "Settings saved via debounce");
            }, 500); // Save after 500ms of inactivity
        };

        panelOpacitySlider.addEventListener('input', e => {
            const newValue = parseFloat(e.target.value);
            settings.panelOpacity = newValue;
            panelOpacityValue.textContent = newValue.toFixed(2);
            // Update CSS variable directly for immediate effect
            document.documentElement.style.setProperty('--panel-opacity', newValue);
            // Explicitly update background for panels that might already exist
             document.querySelectorAll('#mobile-block-panel, #mobile-settings-panel, #mobile-blocklist-panel').forEach(p => {
                  p.style.setProperty('background-color', `rgba(40, 43, 48, ${newValue})`, 'important');
             });
            debounceSaveSettings();
        });

        toggleSizeSlider.addEventListener('input', e => {
            const newValue = parseFloat(e.target.value);
            settings.toggleSizeScale = newValue;
            toggleSizeValue.textContent = newValue.toFixed(1) + 'x';
            document.documentElement.style.setProperty('--toggle-size', `${56 * newValue}px`);
            // Update button size directly if it exists
            if (toggleBtn) {
                 toggleBtn.style.setProperty('width', `var(--toggle-size)`, 'important');
                 toggleBtn.style.setProperty('height', `var(--toggle-size)`, 'important');
            }
            debounceSaveSettings();
        });

        toggleOpacitySlider.addEventListener('input', e => {
            const newValue = parseFloat(e.target.value);
            settings.toggleOpacity = newValue;
            toggleOpacityValue.textContent = newValue.toFixed(2);
            document.documentElement.style.setProperty('--toggle-opacity', newValue);
            if (toggleBtn) {
                 toggleBtn.style.setProperty('opacity', newValue, 'important');
            }
            debounceSaveSettings();
        });

        // --- Backup and Restore ---
        backupBtn.addEventListener('click', async () => {
            try {
                const rules = await loadBlockedSelectors(); // Get current rules
                if (rules.length === 0) {
                    showToast('ℹ️ 백업할 규칙이 없습니다.', 'info');
                    return;
                }
                const jsonString = JSON.stringify(rules, null, 2); // Pretty print JSON
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                a.href = url;
                a.download = `mobile_element_selector_backup_${timestamp}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast(STRINGS.backupStarting, 'success');
            } catch (err) {
                console.error(SCRIPT_ID, "Backup failed:", err);
                showToast(STRINGS.backupError, 'error');
            }
        });

        restoreBtn.addEventListener('click', () => {
             restoreInput.click(); // Trigger hidden file input
        });

        restoreInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target.result;
                    const parsedRules = JSON.parse(content);

                    // Validation: Check if it's an array of strings
                    if (!Array.isArray(parsedRules) || !parsedRules.every(item => typeof item === 'string')) {
                         throw new Error("Invalid file content - expected an array of strings.");
                    }
                    // Basic check for rule format (contains ##) - optional but good
                    if (!parsedRules.every(item => item.includes('##') || parsedRules.length === 0)) {
                         console.warn(SCRIPT_ID, "Restored rules contain items without '##'. Proceeding anyway.");
                    }

                    await saveBlockedSelectors(parsedRules); // Save the restored rules
                    await applyBlocking(true); // Apply the newly restored rules with notification
                    showToast(STRINGS.restoreSuccess, 'success', 2500);

                    // Refresh list view if it's currently open
                    if (listPanel.classList.contains('visible')) {
                        await showList();
                    }
                     // Refresh settings view for temp disable toggle if open
                    if (settingsPanel.classList.contains('visible')) {
                       tempDisableBtn.classList.toggle('active', settings.tempBlockingDisabled);
                       tempDisableBtn.classList.toggle('error', settings.tempBlockingDisabled);
                       tempDisableBtn.classList.toggle('secondary', !settings.tempBlockingDisabled);
                       tempDisableBtn.textContent = settings.tempBlockingDisabled ? STRINGS.on : STRINGS.off;
                    }


                } catch (err) {
                    console.error(SCRIPT_ID, "Restore failed:", err);
                     if (err instanceof SyntaxError || err.message.includes("Invalid file content")) {
                         showToast(STRINGS.restoreErrorInvalidFile, 'error');
                     } else {
                         showToast(STRINGS.restoreErrorGeneral, 'error');
                     }
                } finally {
                     // Reset file input to allow selecting the same file again
                     restoreInput.value = '';
                }
            };
            reader.onerror = (e) => {
                 console.error(SCRIPT_ID, "File reading error:", e);
                 showToast(STRINGS.restoreErrorGeneral, 'error');
                 restoreInput.value = '';
            };
            reader.readAsText(file);
        });


        // --- Element Selection Logic (Touch Events - Refined) ---
         document.addEventListener('touchstart', e => {
             if (!selecting) return;
             const touch = e.touches[0];
             // Ignore touches starting on the UI itself
             if (touch.target.closest('.mobile-block-ui')) {
                 initialTouchedElement = null;
                 return;
             }
             touchStartX = touch.clientX;
             touchStartY = touch.clientY;
             touchMoved = false;
             // Try to get the element directly under the finger *now*
             // Use elementFromPoint carefully, might pick overlay in some cases
             const potentialTarget = document.elementFromPoint(touchStartX, touchStartY);
             if (potentialTarget && !potentialTarget.closest('.mobile-block-ui') && potentialTarget.tagName !== 'BODY' && potentialTarget.tagName !== 'HTML') {
                 initialTouchedElement = potentialTarget;
                 // console.log("touchstart initial target:", initialTouchedElement); // Debug
             } else {
                 initialTouchedElement = null; // Reset if target is invalid
             }
         }, { passive: true }); // Passive for performance

         document.addEventListener('touchmove', e => {
             if (!selecting || touchMoved || !e.touches[0]) return; // Ignore if already moved or no touch
             // Don't check initialTouchedElement here, movement cancels selection intent regardless
             const touch = e.touches[0];
             const dx = touch.clientX - touchStartX;
             const dy = touch.clientY - touchStartY;
             if (Math.sqrt(dx * dx + dy * dy) > moveThreshold) {
                 touchMoved = true;
                  console.log("touchmove detected, cancelling selection intent"); // Debug
                 // If movement is detected, clear the selection highlight immediately
                 if (selectedEl) {
                     selectedEl.classList.remove('selected-element');
                     // Don't nullify selectedEl yet, maybe needed if touch ends on UI
                 }
                 initialTouchedElement = null; // Cancel the initial target due to movement
             }
         }, { passive: true }); // Passive is okay here

         document.addEventListener('touchend', e => {
             if (!selecting) return;

             const touchEndTarget = e.target;

             // Case 1: Touch ends on a button within our UI (panel, toggle)
             if (touchEndTarget.closest('.mobile-block-ui .mb-btn') || touchEndTarget === toggleBtn || toggleBtn.contains(touchEndTarget) ) {
                 console.log(SCRIPT_ID, 'touchend on UI button, letting click event handle.');
                 // Reset move flag but don't prevent default, allow click
                 touchMoved = false;
                 // Keep initialTouchedElement, might be needed by slider
                 return;
             }

             // Case 2: Touch ends somewhere else within our UI (panel background, etc.)
             if (touchEndTarget.closest('.mobile-block-ui')) {
                  console.log(SCRIPT_ID, 'touchend on UI background.');
                  // If moved, potentially re-add highlight if it was removed during move
                  if (touchMoved && selectedEl) {
                     // selectedEl.classList.add('selected-element'); // Re-highlight if needed (optional)
                  }
                  touchMoved = false; // Reset move flag
                  // Keep initialTouchedElement
                  return; // Don't select page elements
             }

             // Case 3: Touch ends on the page content

             // Prevent default browser actions (like link navigation, text selection) *only* if not moved
             if (!touchMoved) {
                  try {
                      e.preventDefault();
                      e.stopImmediatePropagation(); // Crucial to prevent clicks after touch
                       console.log(SCRIPT_ID, 'touchend on page, prevented default'); // Debug
                  } catch (err) {
                       console.warn(SCRIPT_ID, "Could not preventDefault/stopImmediatePropagation on touchend:", err);
                  }
             } else {
                 // If moved, reset the flag and do nothing (allow scrolling/native behavior)
                  console.log(SCRIPT_ID, 'touchend on page after move, doing nothing'); // Debug
                 touchMoved = false;
                 return;
             }


             // If we reach here, it was a tap on the page content (no movement)
             const touch = e.changedTouches[0];
             if (!touch) return; // Should not happen, but safety check

             // Use the element identified at touchstart if valid, otherwise re-check
             let targetEl = initialTouchedElement;

             // If initial was bad or became invalid, try elementFromPoint again (less reliable)
             if (!targetEl || targetEl.closest('.mobile-block-ui')) {
                  targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
             }

             // Final validation of the target
             if (targetEl && !targetEl.closest('.mobile-block-ui') && targetEl.tagName !== 'BODY' && targetEl.tagName !== 'HTML') {
                 console.log(SCRIPT_ID, "Valid element selected:", targetEl);
                 // Clear previous state
                 removeSelectionHighlight(); // Removes class from old selectedEl
                 resetPreview();

                 // Set new state
                 selectedEl = targetEl;
                 initialTouchedElement = selectedEl; // Update initial touch ref to the newly selected
                 selectedEl.classList.add('selected-element');
                 if (slider) slider.value = 0; // Reset slider on new selection
                 updateInfo(); // Update panel display
             } else {
                 // Tapped on invalid area (background, html, body, or our UI somehow missed)
                 console.log(SCRIPT_ID, "Invalid area tapped or elementFromPoint failed.");
                 removeSelectionHighlight();
                 resetPreview();
                 updateInfo(); // Clear info panel
                 initialTouchedElement = null; // No valid element to reference
             }
         }, { capture: true, passive: false }); // Capture phase and NOT passive for preventDefault

        // --- Slider Logic ---
        slider.addEventListener('input', (e) => {
            // Ensure we have a starting point for traversal
            if (!initialTouchedElement) {
                if (selectedEl) {
                    initialTouchedElement = selectedEl; // Use current selection as base if touch start failed
                } else {
                    return; // No element selected or touched
                }
            }

            resetPreview(); // Cancel preview when adjusting level

            const level = parseInt(e.target.value, 10);
            let current = initialTouchedElement; // Start from the initial touch/selection

            for (let i = 0; i < level && current.parentElement; i++) {
                // Stop traversal if hitting body/html or our UI boundary
                if (['body', 'html'].includes(current.parentElement.tagName.toLowerCase()) || current.parentElement.closest('.mobile-block-ui')) {
                    break;
                }
                current = current.parentElement;
            }

            // Update selection only if the target element changes
            if (selectedEl !== current) {
                if (selectedEl) {
                    selectedEl.classList.remove('selected-element');
                }
                selectedEl = current;
                selectedEl.classList.add('selected-element');
                updateInfo(); // Update selector display
            }
        });

        // --- Draggable UI (Keep existing logic) ---
        function makeDraggable(el) {
            if (!el) return;
            let startX, startY, elementStartX, elementStartY;
            let dragging = false;
            let movedSinceStart = false;
            const dragThreshold = 5; // Pixels before drag starts

            const handleTouchStart = (e) => {
                 // Prevent dragging if interacting with buttons, inputs, sliders, or scrollable areas inside the element
                 let interactiveTarget = e.target.closest('button, input[type="range"], input[type="file"], select, textarea, .blocklist-item, #blocklist-container, #blocker-info');
                 if (interactiveTarget && el.contains(interactiveTarget)) {
                    // Special check for scrollable areas
                    if (interactiveTarget.id === 'blocklist-container' || interactiveTarget.id === 'blocker-info') {
                        if (interactiveTarget.scrollHeight > interactiveTarget.clientHeight) {
                             console.log("Drag cancelled: Touch started on scrollable content");
                             dragging = false;
                             return; // Don't drag if starting on scrollable content
                        }
                    } else {
                         console.log("Drag cancelled: Touch started on interactive element");
                         dragging = false;
                         return; // Don't drag interactive elements
                    }
                 }

                 if (e.touches.length > 1) { // Ignore multi-touch
                    dragging = false;
                    return;
                 }

                 dragging = true; // Tentatively start dragging
                 movedSinceStart = false; // Reset move flag

                 const touch = e.touches[0];
                 startX = touch.clientX;
                 startY = touch.clientY;

                 // Get current position using getBoundingClientRect for accuracy
                 const rect = el.getBoundingClientRect();
                 elementStartX = rect.left;
                 elementStartY = rect.top;

                 // Temporarily disable transition for smooth dragging
                 el.style.transition = 'none';
                 el.style.cursor = 'grabbing';
                 // console.log("Drag start tentative", {startX, startY, elementStartX, elementStartY});
            };

            const handleTouchMove = (e) => {
                if (!dragging || e.touches.length > 1) return;

                const touch = e.touches[0];
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;

                // Check threshold only once
                if (!movedSinceStart) {
                    if (Math.sqrt(dx * dx + dy * dy) > dragThreshold) {
                        movedSinceStart = true;
                         console.log("Drag threshold passed, moving element");
                         // Prevent scrolling ONLY after drag threshold is passed
                         try { e.preventDefault(); } catch {}
                    } else {
                         return; // Below threshold, don't move yet
                    }
                } else {
                     // Already dragging, prevent default always
                     try { e.preventDefault(); } catch {}
                }


                let newX = elementStartX + dx;
                let newY = elementStartY + dy;

                // Constrain within viewport
                const elWidth = el.offsetWidth;
                const elHeight = el.offsetHeight;
                const parentWidth = window.innerWidth;
                const parentHeight = window.innerHeight;

                newX = Math.max(0, Math.min(newX, parentWidth - elWidth));
                newY = Math.max(0, Math.min(newY, parentHeight - elHeight));

                // Apply transform for positioning (usually smoother)
                // Reset potential conflicting styles
                el.style.left = '0px';
                el.style.top = '0px';
                el.style.right = 'auto';
                el.style.bottom = 'auto';
                el.style.transform = `translate(${newX}px, ${newY}px)`;
            };

            const handleTouchEnd = (e) => {
                if (!dragging) return;
                dragging = false;
                // Restore transition and cursor
                el.style.transition = '';
                el.style.cursor = '';

                if (movedSinceStart) {
                     console.log("Drag ended");
                    // Prevent click event after dragging if needed
                     try {
                         // e.preventDefault(); // Sometimes needed, test carefully
                         // e.stopPropagation();
                     } catch {}
                } else {
                     console.log("Drag cancelled (ended before threshold)");
                }
                movedSinceStart = false; // Reset for next touch
            };

            // Add listeners
            el.addEventListener('touchstart', handleTouchStart, { passive: true }); // Start passive
            el.addEventListener('touchmove', handleTouchMove, { passive: false }); // Move non-passive for preventDefault
            el.addEventListener('touchend', handleTouchEnd, { passive: false }); // End non-passive
            el.addEventListener('touchcancel', handleTouchEnd, { passive: false }); // Handle cancellation
        }

        makeDraggable(panel);
        makeDraggable(settingsPanel);
        makeDraggable(toggleBtn);
        makeDraggable(listPanel);

        console.log(SCRIPT_ID, 'Initialization complete.');
    } // End of initRefsAndEvents

    // --- 스크립트 실행 시작 ---
    // Wait for DOM ready before creating UI and initializing
    async function run() {
        await loadSettings(); // Load settings first
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createUIElements);
        } else {
            createUIElements();
        }
    }

    run().catch(error => {
        console.error(SCRIPT_ID, "Unhandled error during script initialization:", error);
    });

})();
