// ==UserScript==
// @name         MES(Mobile Element Selector)
// @author       삼플
// @version      2.0.0
// @description  작은 화면에서도 깔끔하게 요소를 선택하고 차단 규칙을 관리하는 고급 모바일 요소 선택기
// @match        *://*/*
// @license      Apache-2.0
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM.setClipboard
// @grant        GM.setValue
// @grant        GM.getValue
// @namespace https://github.com/sampple-korea/MES
// @downloadURL https://raw.githubusercontent.com/sampple-korea/MES/main/MES.js
// @updateURL https://raw.githubusercontent.com/sampple-korea/MES/main/MES.js
// ==/UserScript==

(async function() {
	'use strict';
	const SCRIPT_ID = "[MES v2.0.0]";
	const HIGHLIGHT_CLASS = 'mes-selected-element';
	const LEGACY_HIGHLIGHT_CLASS = 'selected-element';
	const CANDIDATE_PREVIEW_CLASS = 'mes-selector-candidate-match';
	const ISOLATE_ACTIVE_CLASS = 'mes-isolate-active';
	const ISOLATE_PATH_CLASS = 'mes-isolate-path';
	const ISOLATE_TARGET_CLASS = 'mes-isolate-target';
	const ISOLATE_HOST_CLASS = 'mes-isolate-host';
	const TOGGLE_BASE_SIZE = 28;
	const TOGGLE_HITBOX_SIZE = 44;
	const TOGGLE_MIN_VISUAL_SCALE = 0.75;
	const SHIELD_TOGGLE_ICON_URL = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Cpath fill=%22%23a0c9ff%22 d=%22M32 5 52 13v15c0 13.9-8.1 25.9-20 31C20.1 53.9 12 41.9 12 28V13l20-8Z%22/%3E%3Cpath fill=%22%2300325a%22 d=%22M22 25h20v6H22v-6Zm0 10h14v6H22v-6Z%22/%3E%3C/svg%3E';

	const STRINGS = {
		panelTitle: '요소 차단',
		settingsTitle: '설정',
		settingsCredit: 'MES by 삼플',
		listTitle: '저장된 차단 규칙',
		selectedElementLabel: '선택된 요소 (CSS 선택자)',
		parentLevelLabel: '요소 탐색',
		navRoot: '원본',
		navParent: '상위',
		navChild: '하위',
		copy: '복사',
		copyCss: 'CSS',
		copyRule: '규칙',
		similarRule: '유사',
		preview: '미리보기',
		restorePreview: '복원',
		saveRule: '저장',
		extractUrl: 'URL',
		inspect: '검사',
		more: '더',
		parent: '상위',
		child: '하위',
		list: '목록',
		settings: '설정',
		cancel: '취소',
		close: '닫기',
		inspectorTitle: '요소 정보',
		copyInfo: '정보 복사',
		includeSiteNameLabel: '규칙에 사이트명 포함',
		useShieldIconLabel: '토글 버튼 방패 스타일',
		panelOpacityLabel: '패널 투명도',
		toggleSizeLabel: '토글 버튼 크기',
		toggleOpacityLabel: '토글 버튼 투명도',
		tempDisableLabel: '모든 규칙 임시 비활성화',
		observeDomChangesLabel: '동적 페이지 자동 재적용',
		shadowDomSupportLabel: 'Shadow DOM 탐색',
		selectorHintModeLabel: '강화 선택자 힌트',
		privacyModeLabel: '민감 정보 보호',
		autoCloseAfterCopyLabel: '복사 후 선택 모드 종료',
		compactPickerModeLabel: '선택 후 패널 자동 축소',
		launcherModeLabel: '열기 방식',
		launcherButton: '버튼',
		launcherGesture: '제스처',
		launcherGestureReady: (label) => `제스처 열기: ${label}`,
		gestureFingerCountLabel: '손가락',
		gestureTapCountLabel: '탭 횟수',
		gestureTwoFingers: '두 손가락',
		gestureThreeFingers: '세 손가락',
		gestureTwoTaps: '두 번',
		gestureThreeTaps: '세 번',
		minimizePanel: '패널 축소',
		expandPanel: '패널 펼치기',
		hideStrategyLabel: '숨김 방식',
		hideStrategyDisplay: '제거',
		hideStrategyVisibility: '공간',
		hideStrategyOpacity: '투명',
		hideStrategyStylesheet: 'CSS',
		backupLabel: '규칙 백업 (JSON)',
		restoreLabel: '규칙 복원 (JSON)',
		togglePositionLabel: '토글 버튼 위치',
		posTopLeft: '좌상',
		posTopRight: '우상',
		posBottomLeft: '좌하',
		posBottomRight: '우하',
		on: 'ON',
		off: 'OFF',
		noRules: '저장된 규칙이 없습니다.',
		noElementSelected: '선택된 요소가 없습니다.',
		cannotGenerateSelector: '유효한 선택자를 생성할 수 없습니다.',
		isolateFocus: '집중 보기',
		restoreFocus: '집중 해제',
		focusModeOn: '선택 요소만 표시 중',
		focusModeOff: '집중 보기 해제됨',
		selectorCopied: '선택자가 복사되었습니다.',
		ruleCopied: '규칙 복사됨',
		urlCopied: 'URL 복사됨',
		infoCopied: '요소 정보 복사됨',
		sensitiveCopyConfirm: '민감 정보가 포함될 수 있습니다. 복사할까요?',
		urlNotFound: 'URL을 찾을 수 없습니다.',
		clipboardError: '클립보드 복사 실패',
		similarSelectorCopied: '유사 선택자 복사됨',
		similarRuleReady: (count) => `유사 규칙 ${count}개 대상`,
		selectorCandidateCopied: '선택자 후보 복사됨',
		selectorCandidatePreview: (count) => `후보 ${count}개 요소 표시 중`,
		selectorCandidateSaved: (count) => `후보 규칙 저장됨 · ${count}개 대상`,
		selectorRiskStable: '안정',
		selectorRiskPrecise: '정밀',
		selectorRiskPositional: '위치 의존',
		selectorRiskBroad: '넓음',
		selectorRiskComplex: '복잡',
		selectorRiskError: '확인 필요',
		undoAction: '되돌리기',
		ruleUndoComplete: '규칙 저장 취소됨',
		ruleUndoUnavailable: '되돌릴 규칙이 없습니다.',
		ruleUndoFailed: '규칙 저장 취소 실패',
		noChildElements: '하위 요소가 없습니다.',
		inspectorUnavailable: '선택된 요소 정보가 없습니다.',
		noCookies: '표시할 쿠키가 없습니다.',
		cookieReadOnly: '보호 모드에서는 쿠키 이름과 마스킹된 값만 표시합니다.',
		cookieScopeNotice: '브라우저가 공개한 쿠키만 표시됩니다. 수정/삭제는 현재 사이트에서 가능한 범위로 처리됩니다.',
		cookieValuesMasked: '쿠키 값은 보호됨',
		cookieCopy: '복사',
		cookieEdit: '수정',
		cookieDelete: '삭제',
		cookieEditPrompt: (name) => `${name} 쿠키의 새 값을 입력하세요. 현재 사이트 path=/ 값으로 저장됩니다.`,
		cookieDeleteConfirm: (name) => `${name} 쿠키를 삭제할까요?`,
		cookieUpdated: '쿠키 수정됨',
		cookieDeleted: '쿠키 삭제됨',
		cookieActionFailed: '쿠키 작업 실패',
		resourceMetadataLabel: '리소스 메타데이터',
		attributePrompt: '추출할 속성 이름을 입력하세요.',
		attributeCopied: '속성 값 복사됨',
		attributeNotFound: '속성을 찾을 수 없습니다.',
		promptCopy: '선택자를 직접 복사하세요:',
		alreadyHidden: '이미 숨겨진 요소입니다.',
		previewDifferentElement: '다른 요소가 미리보기 중입니다.',
		ruleSavedReloading: '규칙 저장됨. 적용 중...',
		ruleSavedApplyFailed: '규칙은 저장했으나 즉시 적용 실패.',
		ruleAddError: '규칙 추가 중 오류:',
		ruleExists: '이미 저장된 규칙입니다.',
		confirmBroadSelector: (count) => `이 선택자는 ${count}개 요소와 일치합니다. 그대로 저장할까요?`,
		confirmRiskSelector: (label, reason) => `선택자 품질: ${label}\n${reason}\n그대로 저장할까요?`,
		listShowError: '목록 표시 중 오류 발생',
		ruleDeleted: '규칙 삭제됨',
		ruleDisabled: '규칙 비활성화됨',
		ruleEnabled: '규칙 활성화됨',
		ruleDeleteError: '규칙 삭제 실패',
		noMatchingRules: '검색 결과가 없습니다.',
		blocklistSearchPlaceholder: '규칙 검색',
		blocklistDisable: '중지',
		blocklistEnable: '사용',
		blocklistCopySite: '적용 규칙 복사',
		blocklistCopyAll: '전체 복사',
		blocklistDeleteSite: '현재 사이트 삭제',
		blocklistPruneStale: '무매칭 정리',
		blocklistSummary: (total, current, disabled = 0) => `전체 ${total}개 · 현재 사이트 적용 ${current}개${disabled ? ` · 비활성 ${disabled}개` : ''}`,
		blocklistScopeCurrent: '현재 사이트',
		blocklistScopeGlobal: '전체',
		blocklistScopeOther: '다른 사이트',
		blocklistMatches: (count) => `${count}개 매칭`,
		blocklistNoMatch: '매칭 없음',
		blocklistDisabledChip: '꺼짐',
		rulePreviewApplied: (count) => `규칙 영향 ${count}개 표시 중`,
		rulePreviewUnavailable: '현재 사이트에서 미리보기 불가',
		clearPreviewAction: '해제',
		rulesCopied: (count) => `${count}개 규칙 복사됨`,
		confirmDeleteSiteRules: (hostname, count) => `${hostname}에 저장된 규칙 ${count}개를 삭제할까요?`,
		confirmPruneStaleRules: (count) => `현재 사이트에서 매칭되지 않는 규칙 ${count}개를 정리할까요?`,
		siteRulesDeleted: (count) => `현재 사이트 규칙 ${count}개 삭제됨`,
		staleRulesDeleted: (count) => `무매칭 규칙 ${count}개 정리됨`,
		settingsSaved: '설정 저장됨',
		settingsSaveError: '설정 저장 실패',
		backupStarting: '규칙 백업 파일 다운로드를 시작합니다.',
		backupNoRules: '백업할 규칙이 없습니다.',
		backupError: '규칙 백업 실패',
		restorePrompt: '복원할 JSON 파일을 선택하세요.',
		restoreSuccess: '규칙 복원 완료. 적용 중...',
		restoreSuccessDeduped: (count) => `규칙 복원 완료. 중복 ${count}개 제거됨`,
		restoreErrorInvalidFile: '잘못된 파일 형식 또는 내용입니다.',
		restoreErrorGeneral: '규칙 복원 실패',
		legacyImportTitle: '기존 필터 감지됨',
		legacyImportSummary: (total, fresh) => `전체 사이트 필터 ${total}개 · 새 규칙 ${fresh}개`,
		legacyImportButton: '가져오기',
		legacyImportNone: '가져올 새 규칙이 없습니다.',
		legacyImportSuccess: (count) => `기존 필터 ${count}개 가져옴`,
		blockingApplied: (count) => `${count}개의 규칙 적용됨`,
		blockingApplyError: '규칙 적용 중 오류 발생',
		tempBlockingOn: '모든 규칙 임시 비활성화됨',
		tempBlockingOff: '규칙 다시 활성화됨'
	};

	const DEFAULT_SETTINGS = {
		includeSiteName: true,
		panelOpacity: 0.94,
		toggleSizeScale: 1.0,
		toggleOpacity: 0.62,
		showShieldIcon: false,
		tempBlockingDisabled: false,
		observeDomChanges: true,
		shadowDomSupport: true,
		selectorHintMode: true,
		privacyMode: true,
		autoCloseAfterCopy: false,
		compactPickerMode: true,
		hideToggleButton: false,
		twoFingerGesture: false,
		gestureFingerCount: 2,
		gestureTapCount: 2,
		hideStrategy: 'stylesheet',
		toggleBtnCorner: 'bottom-right'
	};

	let settings = {};
	const SETTINGS_KEY = 'mobileElementSelectorSettings_v1_2';
	const BLOCKED_SELECTORS_KEY = 'mobileBlockedSelectors_v2';
	const DISABLED_SELECTORS_KEY = 'mobileDisabledSelectors_v1';

	async function gmGetValue(key, defaultValue) {
		if (typeof globalThis.GM_getValue === 'function') return globalThis.GM_getValue(key, defaultValue);
		if (typeof globalThis.GM?.getValue === 'function') return globalThis.GM.getValue(key, defaultValue);
		try {
			const value = localStorage.getItem(key);
			return value === null ? defaultValue : value;
		} catch (e) {}
		return defaultValue;
	}

	async function gmSetValue(key, value) {
		if (typeof globalThis.GM_setValue === 'function') return globalThis.GM_setValue(key, value);
		if (typeof globalThis.GM?.setValue === 'function') return globalThis.GM.setValue(key, value);
		try {
			localStorage.setItem(key, value);
		} catch (e) {}
		return undefined;
	}

	function gmSetClipboard(text) {
		if (typeof globalThis.GM_setClipboard === 'function') {
			globalThis.GM_setClipboard(text);
			return true;
		}
		if (typeof globalThis.GM?.setClipboard === 'function') {
			globalThis.GM.setClipboard(text);
			return true;
		}
		if (navigator.clipboard?.writeText && window.isSecureContext) {
			navigator.clipboard.writeText(text).catch(err => console.warn(SCRIPT_ID, 'Clipboard API write failed:', err));
			return true;
		}
		return false;
	}

	async function loadSettings() {
		let storedSettings = {};
		try {
			const storedValue = await gmGetValue(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
			storedSettings = JSON.parse(storedValue || '{}');
		} catch (e) {
			console.error(SCRIPT_ID, `Error loading settings from storage key '${SETTINGS_KEY}', using defaults.`, e);
			storedSettings = {
				...DEFAULT_SETTINGS
			};
		}

		settings = {
			...DEFAULT_SETTINGS,
			...storedSettings
		};

		settings.panelOpacity = parseFloat(settings.panelOpacity);
		if (isNaN(settings.panelOpacity) || settings.panelOpacity < 0.1 || settings.panelOpacity > 1.0) {
			settings.panelOpacity = DEFAULT_SETTINGS.panelOpacity;
		}
		settings.toggleSizeScale = parseFloat(settings.toggleSizeScale);
		if (isNaN(settings.toggleSizeScale) || settings.toggleSizeScale < TOGGLE_MIN_VISUAL_SCALE || settings.toggleSizeScale > 2.0) {
			settings.toggleSizeScale = DEFAULT_SETTINGS.toggleSizeScale;
		}
		settings.toggleOpacity = parseFloat(settings.toggleOpacity);
		if (isNaN(settings.toggleOpacity) || settings.toggleOpacity < 0.1 || settings.toggleOpacity > 1.0) {
			settings.toggleOpacity = DEFAULT_SETTINGS.toggleOpacity;
		}
		settings.includeSiteName = typeof settings.includeSiteName === 'boolean' ? settings.includeSiteName : DEFAULT_SETTINGS.includeSiteName;
		const legacyShieldIconKey = ['show', 'Ad', 'guard', 'Logo'].join('');
		settings.showShieldIcon = typeof settings.showShieldIcon === 'boolean'
			? settings.showShieldIcon
			: (typeof settings[legacyShieldIconKey] === 'boolean' ? settings[legacyShieldIconKey] : DEFAULT_SETTINGS.showShieldIcon);
		delete settings[legacyShieldIconKey];
		settings.tempBlockingDisabled = typeof settings.tempBlockingDisabled === 'boolean' ? settings.tempBlockingDisabled : DEFAULT_SETTINGS.tempBlockingDisabled;
		settings.observeDomChanges = typeof settings.observeDomChanges === 'boolean' ? settings.observeDomChanges : DEFAULT_SETTINGS.observeDomChanges;
		settings.shadowDomSupport = typeof settings.shadowDomSupport === 'boolean' ? settings.shadowDomSupport : DEFAULT_SETTINGS.shadowDomSupport;
		settings.selectorHintMode = typeof settings.selectorHintMode === 'boolean' ? settings.selectorHintMode : DEFAULT_SETTINGS.selectorHintMode;
		settings.privacyMode = typeof settings.privacyMode === 'boolean' ? settings.privacyMode : DEFAULT_SETTINGS.privacyMode;
		settings.autoCloseAfterCopy = typeof settings.autoCloseAfterCopy === 'boolean' ? settings.autoCloseAfterCopy : DEFAULT_SETTINGS.autoCloseAfterCopy;
		settings.compactPickerMode = typeof settings.compactPickerMode === 'boolean' ? settings.compactPickerMode : DEFAULT_SETTINGS.compactPickerMode;
		settings.hideToggleButton = typeof settings.hideToggleButton === 'boolean' ? settings.hideToggleButton : DEFAULT_SETTINGS.hideToggleButton;
		settings.twoFingerGesture = typeof settings.twoFingerGesture === 'boolean' ? settings.twoFingerGesture : DEFAULT_SETTINGS.twoFingerGesture;
		settings.twoFingerGesture = settings.hideToggleButton ? true : false;
		settings.gestureFingerCount = parseInt(settings.gestureFingerCount, 10);
		if (![2, 3].includes(settings.gestureFingerCount)) {
			settings.gestureFingerCount = DEFAULT_SETTINGS.gestureFingerCount;
		}
		settings.gestureTapCount = parseInt(settings.gestureTapCount, 10);
		if (![2, 3].includes(settings.gestureTapCount)) {
			settings.gestureTapCount = DEFAULT_SETTINGS.gestureTapCount;
		}
		const validHideStrategies = ['stylesheet', 'display', 'visibility', 'opacity'];
		if (!validHideStrategies.includes(settings.hideStrategy)) {
			settings.hideStrategy = DEFAULT_SETTINGS.hideStrategy;
		}

		const validCorners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
		if (!validCorners.includes(settings.toggleBtnCorner)) {
			settings.toggleBtnCorner = DEFAULT_SETTINGS.toggleBtnCorner;
		}

		console.log(SCRIPT_ID, "Settings loaded:", settings);
	}

	async function saveSettings() {
		try {
			await gmSetValue(SETTINGS_KEY, JSON.stringify(settings));
			console.log(SCRIPT_ID, "Settings saved:", settings);
		} catch (e) {
			console.error(SCRIPT_ID, `Error saving settings to storage key '${SETTINGS_KEY}'`, e);
			showToast(STRINGS.settingsSaveError, 'error');
		}
	}

	const RELIABLE_SELECTOR_ATTRIBUTES = [
		'data-testid',
		'data-cy',
		'data-test-id',
		'data-test',
		'name',
		'aria-label',
		'alt',
		'title',
		'placeholder',
		'type'
	];
	const RESOURCE_ATTRIBUTES = ['href', 'src', 'data-src', 'data-original', 'poster', 'action'];
	const SRCSET_ATTRIBUTES = ['srcset', 'data-srcset'];
	const VOLATILE_CLASS_RE = /active|select|selected|focus|hover|disabled|checked|open|closed|visible|hidden|loading|transition|animate|animating|enter|leave|js-|ui-|css-|style-/i;
	const DYNAMIC_TOKEN_RE = /(?:^|[-_])(?:ember|react|vue|ng|svelte|random|hash|uuid|nonce|temp|tmp)(?:[-_]|$)|[a-f0-9]{7,}|[_-]?\d{3,}/i;
	const BROAD_SELECTOR_HINT_RE = /(ad|ads|advert|banner|sponsor|promoted|promotion|popup|pop|modal|overlay|interstitial|notice|recommend|related|widget|slot|wing)/i;
	const SHADOW_SELECTOR_RE = /^:mes-shadow\("([^"]+)"\)\s*>>>\s*(.+)$/;
	const STYLE_BLOCK_ID = 'mes-rule-style';
	const STYLE_BLOCK_OWNER_ATTR = 'data-mes-style-owner';
	const STYLE_BLOCK_OWNER_VALUE = 'blocking';
	const UI_STYLE_ID = 'mes-ui-style';
	const LEGACY_FILTER_STORAGE_KEY = ['pi', 'cky_blocked_rules'].join('');

	function escapeAttributeValue(value) {
		return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').trim();
	}

	function cssEscape(value) {
		const input = String(value ?? '');
		if (typeof globalThis.CSS?.escape === 'function') return globalThis.CSS.escape(input);
		return input
			.replace(/^(-?\d)/, match => Array.from(match).map(ch => `\\${ch.charCodeAt(0).toString(16)} `).join(''))
			.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
	}

	function isShadowRoot(root) {
		return typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot;
	}

	function isUsableAttributeValue(value) {
		if (!value) return false;
		const normalized = String(value).trim();
		return normalized.length > 0 && normalized.length <= 120 && !/[\n\r]/.test(normalized);
	}

	function getSelectorRoot(el) {
		if (!settings.shadowDomSupport || !el || typeof el.getRootNode !== 'function') return document;
		const root = el.getRootNode();
		return isShadowRoot(root) ? root : document;
	}

	function getDeepElementFromPoint(x, y) {
		let target = document.elementFromPoint(x, y);
		if (!settings.shadowDomSupport) return target;

		while (target && target.shadowRoot && typeof target.shadowRoot.elementFromPoint === 'function') {
			const innerTarget = target.shadowRoot.elementFromPoint(x, y);
			if (!innerTarget || innerTarget === target) break;
			target = innerTarget;
		}
		return target;
	}

	function getParentElement(el) {
		if (!el) return null;
		if (el.parentElement) return el.parentElement;
		const root = settings.shadowDomSupport && typeof el.getRootNode === 'function' ? el.getRootNode() : null;
		return isShadowRoot(root) ? root.host : null;
	}

	function getSelectorParentElement(el, selectorRoot) {
		if (!el) return null;
		if (el.parentElement) return el.parentElement;
		return isShadowRoot(selectorRoot) ? null : getParentElement(el);
	}

	function getChildElements(el) {
		if (!el) return [];
		if (settings.shadowDomSupport && el.shadowRoot) {
			return Array.from(el.shadowRoot.children).filter(child => !child.closest?.('.mobile-block-ui'));
		}
		return Array.from(el.children || []).filter(child => !child.closest?.('.mobile-block-ui'));
	}

	function collectOpenShadowRoots(root = document, roots = []) {
		const nodes = root.querySelectorAll ? root.querySelectorAll('*') : [];
		nodes.forEach(node => {
			if (roots.length >= 80) return;
			if (node.shadowRoot) {
				roots.push(node.shadowRoot);
				collectOpenShadowRoots(node.shadowRoot, roots);
			}
		});
		return roots;
	}

	function getQueryRoots(preferredRoot = document, rootCache = null) {
		if (rootCache && preferredRoot === document) return rootCache;
		const roots = [preferredRoot];
		if (settings.shadowDomSupport && preferredRoot === document) {
			roots.push(...collectOpenShadowRoots(document));
		}
		return roots;
	}

	function encodeShadowSelectorPath(hostSelectors) {
		return hostSelectors.map(selector => encodeURIComponent(selector)).join('|');
	}

	function parseShadowScopedSelector(selector) {
		const match = typeof selector === 'string' ? selector.match(SHADOW_SELECTOR_RE) : null;
		if (!match) return null;
		const hostSelectors = match[1]
			.split('|')
			.map(part => {
				try {
					return decodeURIComponent(part);
				} catch (e) {
					return '';
				}
			})
			.filter(Boolean);
		const localSelector = match[2]?.trim();
		if (!hostSelectors.length || !localSelector) return null;
		return {
			hostSelectors,
			localSelector
		};
	}

	function getShadowHostChain(el) {
		if (!settings.shadowDomSupport || !el || typeof el.getRootNode !== 'function') return [];
		const chain = [];
		let root = el.getRootNode();
		while (isShadowRoot(root) && root.host) {
			chain.unshift(root.host);
			root = typeof root.host.getRootNode === 'function' ? root.host.getRootNode() : document;
		}
		return chain;
	}

	function createShadowScopedSelector(el, localSelector) {
		const hosts = getShadowHostChain(el);
		if (!hosts.length || !localSelector) return localSelector;
		const hostSelectors = hosts.map(host => generateSelector(host, 7, true)).filter(Boolean);
		if (hostSelectors.length !== hosts.length) return localSelector;
		return `:mes-shadow("${encodeShadowSelectorPath(hostSelectors)}") >>> ${localSelector}`;
	}

	function getShadowRootsForHostChain(parsed) {
		if (!parsed) return [];
		let roots = [document];
		parsed.hostSelectors.forEach(hostSelector => {
			const nextRoots = [];
			roots.forEach(root => {
				try {
					root.querySelectorAll(hostSelector).forEach(host => {
						if (host.shadowRoot && !host.closest?.('.mobile-block-ui')) {
							nextRoots.push(host.shadowRoot);
						}
					});
				} catch (e) {}
			});
			roots = nextRoots;
		});
		return roots.filter(root => isShadowRoot(root));
	}

	function queryShadowScopedSelector(selector) {
		const parsed = parseShadowScopedSelector(selector);
		if (!parsed) return [];
		const roots = getShadowRootsForHostChain(parsed);
		const results = [];
		const seen = new Set();
		roots.forEach(root => {
			try {
				root.querySelectorAll(parsed.localSelector).forEach(el => {
					if (!seen.has(el) && !el.closest?.('.mobile-block-ui')) {
						seen.add(el);
						results.push(el);
					}
				});
			} catch (e) {}
		});
		return results;
	}

	function querySelectorAllEverywhere(selector, preferredRoot = document, rootCache = null) {
		const shadowScoped = parseShadowScopedSelector(selector);
		if (shadowScoped) return queryShadowScopedSelector(selector);
		const results = [];
		const seen = new Set();
		const roots = getQueryRoots(preferredRoot, rootCache);

		roots.forEach(root => {
			if (results.length >= 600) return;
			try {
				root.querySelectorAll(selector).forEach(el => {
					if (results.length >= 600) return;
					if (!seen.has(el) && isSafeHideCandidate(el)) {
						seen.add(el);
						results.push(el);
					}
				});
			} catch (e) {}
		});

		return results;
	}

	function countSelectorMatches(selector, root = document) {
		if (!selector) return 0;
		try {
			return querySelectorAllEverywhere(selector, root).length;
		} catch (e) {
			return -1;
		}
	}

	function registerRecoveryCommand() {
		const registerMenuCommand = globalThis.GM_registerMenuCommand || globalThis.GM?.registerMenuCommand;
		if (typeof registerMenuCommand !== 'function') return;
		try {
			registerMenuCommand('MES 버튼 모드로 복구', async () => {
				settings.hideToggleButton = false;
				settings.twoFingerGesture = false;
				await saveSettings();
				updateCSSVariables();
				updateToggleIcon();
				applyToggleBtnPosition();
				if (typeof updateLauncherModeButtons === 'function') {
					updateLauncherModeButtons();
				}
				showToast(STRINGS.settingsSaved, 'info', 1500);
			});
		} catch (e) {
			console.warn(SCRIPT_ID, 'Menu command registration failed:', e);
		}
	}

	function makeAttributeSelector(el, attrName, tagName = '') {
		const value = el.getAttribute(attrName);
		if (!isUsableAttributeValue(value)) return '';
		return `${tagName || el.tagName.toLowerCase()}[${attrName}="${escapeAttributeValue(value)}"]`;
	}

	function getBestAttributePart(el, tagName, root, requireUnique) {
		for (const attrName of RELIABLE_SELECTOR_ATTRIBUTES) {
			if (!el.hasAttribute(attrName)) continue;
			const attrSelector = makeAttributeSelector(el, attrName, tagName);
			if (!attrSelector) continue;
			if (!requireUnique) return attrSelector;
			if (countSelectorMatches(attrSelector, root) === 1) return attrSelector;
		}
		return '';
	}

	function getBroadSelectorHint(el, tagName, root) {
		if (!settings.selectorHintMode) return '';
		const candidates = [];
		const id = el.id || '';
		if (BROAD_SELECTOR_HINT_RE.test(id)) {
			const stableIdPrefix = id.replace(DYNAMIC_TOKEN_RE, '').slice(0, 32);
			if (stableIdPrefix.length >= 3) {
				candidates.push(`${tagName}[id^="${escapeAttributeValue(stableIdPrefix)}"]`);
			}
			const match = id.match(BROAD_SELECTOR_HINT_RE);
			if (match?.[0]?.length >= 2) {
				candidates.push(`${tagName}[id*="${escapeAttributeValue(match[0])}"]`);
			}
		}

		Array.from(el.classList || []).forEach(className => {
			if (BROAD_SELECTOR_HINT_RE.test(className) && !DYNAMIC_TOKEN_RE.test(className)) {
				candidates.push(`${tagName}.${cssEscape(className)}`);
			}
		});

		['src', 'href'].forEach(attrName => {
			const value = el.getAttribute?.(attrName);
			if (!value || !BROAD_SELECTOR_HINT_RE.test(value)) return;
			try {
				const filename = new URL(value, location.href).pathname.split('/').pop();
				if (filename && filename.length >= 4) {
					candidates.push(`${tagName}[${attrName}*="${escapeAttributeValue(filename)}"]`);
				}
			} catch (e) {}
		});

		for (const candidate of candidates) {
			const matches = querySelectorAllEverywhere(candidate, root);
			if (matches.length > 0 && matches.length <= 20 && matches.includes(el)) {
				return candidate;
			}
		}
		return '';
	}

	function getStableClasses(el) {
		return Array.from(el.classList || [])
			.filter(c => c && c.length > 2 &&
				!/^[a-z]{1,2}$/i.test(c) &&
				!VOLATILE_CLASS_RE.test(c) &&
				!DYNAMIC_TOKEN_RE.test(c) &&
				!/^[A-Z0-9]{4,}$/.test(c) &&
				!c.includes('--') && !c.includes('__') &&
				![HIGHLIGHT_CLASS, LEGACY_HIGHLIGHT_CLASS, CANDIDATE_PREVIEW_CLASS, ISOLATE_PATH_CLASS, ISOLATE_TARGET_CLASS, ISOLATE_HOST_CLASS, 'mobile-block-ui'].some(uiClass => c.includes(uiClass)))
			.slice(0, 2);
	}

	function getRuleParts(rule) {
		if (typeof rule !== 'string') return null;
		const separatorIndex = rule.indexOf('##');
		if (separatorIndex < 0) return null;
		return {
			domain: rule.slice(0, separatorIndex).trim(),
			selector: rule.slice(separatorIndex + 2).trim()
		};
	}

	function ruleAppliesToHost(rule, hostname = location.hostname) {
		const parts = getRuleParts(rule);
		if (!parts || !parts.selector) return false;
		if (!parts.domain || parts.domain === '*') return true;
		return hostname === parts.domain || hostname.endsWith(`.${parts.domain}`);
	}

	function isSiteSpecificRuleForHost(rule, hostname = location.hostname) {
		const parts = getRuleParts(rule);
		return !!parts?.domain && parts.domain !== '*' && (hostname === parts.domain || hostname.endsWith(`.${parts.domain}`));
	}

	function normalizeRulesForStorage(rules) {
		const seen = new Set();
		const normalized = [];
		let invalidCount = 0;
		let duplicateCount = 0;

		(Array.isArray(rules) ? rules : []).forEach(rule => {
			const trimmed = typeof rule === 'string' ? rule.trim() : '';
			const parts = getRuleParts(trimmed);
			if (!parts || !parts.selector) {
				invalidCount++;
				return;
			}
			const cleanRule = `${parts.domain}##${parts.selector}`;
			if (seen.has(cleanRule)) {
				duplicateCount++;
				return;
			}
			seen.add(cleanRule);
			normalized.push(cleanRule);
		});

		return {
			rules: normalized,
			invalidCount,
			duplicateCount
		};
	}

	function parseStoredObject(value) {
		if (!value) return {};
		if (typeof value === 'string') {
			try {
				const parsed = JSON.parse(value);
				return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
			} catch (e) {
				return {};
			}
		}
		return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
	}

	async function getLegacyImportCandidates() {
		const store = parseStoredObject(await gmGetValue(LEGACY_FILTER_STORAGE_KEY, null));
		const sourceRules = [];
		Object.entries(store).forEach(([hostname, selectors]) => {
			const cleanHost = typeof hostname === 'string' ? hostname.trim() : '';
			if (!cleanHost || /[\n\r#{}]/.test(cleanHost) || !Array.isArray(selectors)) return;
			selectors
				.map(selector => typeof selector === 'string' ? selector.trim() : '')
				.filter(selector => selector && !/[\n\r{}]/.test(selector))
				.forEach(selector => sourceRules.push(`${cleanHost}##${selector}`));
		});
		const normalized = normalizeRulesForStorage(sourceRules);
		const existingRules = new Set(await loadBlockedSelectors());
		const freshRules = normalized.rules.filter(rule => !existingRules.has(rule));
		return {
			totalCount: normalized.rules.length,
			freshRules,
			duplicateCount: normalized.rules.length - freshRules.length,
			invalidCount: normalized.invalidCount
		};
	}

	function getRuleTextForSelector(selector) {
		if (!selector) return '';
		return settings.includeSiteName ? `${location.hostname}##${selector}` : `##${selector}`;
	}

	function copyToClipboard(text, fallbackLabel = STRINGS.promptCopy) {
		try {
			if (!gmSetClipboard(text)) throw new Error('No clipboard API available');
			return true;
		} catch (err) {
			console.error(SCRIPT_ID, "Clipboard write failed:", err);
			try {
				prompt(fallbackLabel, text);
			} catch (e) {}
			return false;
		}
	}

	function parseSrcsetCandidate(value) {
		const text = String(value || '').trim();
		if (!text) return '';
		const first = text.split(',').map(candidate => candidate.trim()).find(Boolean);
		if (!first) return '';
		const urlPart = first.match(/^(\S+)/)?.[1] || '';
		return urlPart.replace(/^['"]|['"]$/g, '');
	}

	function findNearestUrl(el) {
		let current = el;
		for (let depth = 0; current && depth < 6; depth++) {
			for (const attrName of RESOURCE_ATTRIBUTES) {
				const value = current.getAttribute?.(attrName);
				if (isUsableAttributeValue(value)) {
					try {
						return new URL(value, location.href).href;
					} catch (e) {
						return value;
					}
				}
			}
			for (const attrName of SRCSET_ATTRIBUTES) {
				const value = current.getAttribute?.(attrName);
				const candidate = parseSrcsetCandidate(value);
				if (candidate) {
					try {
						return new URL(candidate, location.href).href;
					} catch (e) {
						return candidate;
					}
				}
			}

			try {
				const backgroundImage = window.getComputedStyle(current).backgroundImage;
				const match = backgroundImage && backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
				if (match?.[1]) {
					return new URL(match[1], location.href).href;
				}
			} catch (e) {}

			current = getParentElement(current);
		}
		return '';
	}

	function ensureElementHighlightStyle(el) {
		if (!settings.shadowDomSupport || !el || typeof el.getRootNode !== 'function') return;
		const root = el.getRootNode();
		if (!isShadowRoot(root) || root.getElementById('mes-shadow-highlight-style')) return;
		const highlightStyle = document.createElement('style');
		highlightStyle.id = 'mes-shadow-highlight-style';
		highlightStyle.textContent = `
.${HIGHLIGHT_CLASS} {
    outline: 3px solid #ffb4ab !important;
    outline-offset: 2px;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45) !important;
    background-color: rgba(255, 82, 82, 0.15) !important;
    transition: background-color 0.1s ease, outline 0.1s ease, box-shadow 0.1s ease;
    pointer-events: none;
}
.${CANDIDATE_PREVIEW_CLASS} {
    outline: 3px solid #34c759 !important;
    outline-offset: 2px;
    box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.22) !important;
    background-color: rgba(52, 199, 89, 0.12) !important;
    transition: background-color 0.12s ease, outline 0.12s ease, box-shadow 0.12s ease;
}`;
		root.appendChild(highlightStyle);
	}

	function applySelectionHighlight(el) {
		if (!el) return;
		ensureElementHighlightStyle(el);
		el.classList.add(HIGHLIGHT_CLASS);
	}

	function clearSelectionHighlight(el) {
		if (!el) return;
		el.classList.remove(HIGHLIGHT_CLASS);
	}

	function ensureIsolationStyle(root = document) {
		const styleId = 'mes-isolation-style';
		if (root.getElementById?.(styleId)) return;
		const isolateStyle = document.createElement('style');
		isolateStyle.id = styleId;
		isolateStyle.textContent = isShadowRoot(root) ? `
:host(.${ISOLATE_HOST_CLASS}) * {
    visibility: hidden !important;
}
:host(.${ISOLATE_HOST_CLASS}) .${ISOLATE_PATH_CLASS},
:host(.${ISOLATE_HOST_CLASS}) .${ISOLATE_TARGET_CLASS},
:host(.${ISOLATE_HOST_CLASS}) .${ISOLATE_TARGET_CLASS} * {
    visibility: visible !important;
}` : `
html.${ISOLATE_ACTIVE_CLASS} body * {
    visibility: hidden !important;
}
html.${ISOLATE_ACTIVE_CLASS} .${ISOLATE_PATH_CLASS},
html.${ISOLATE_ACTIVE_CLASS} .${ISOLATE_TARGET_CLASS},
html.${ISOLATE_ACTIVE_CLASS} .${ISOLATE_TARGET_CLASS} *,
html.${ISOLATE_ACTIVE_CLASS} .mobile-block-ui,
html.${ISOLATE_ACTIVE_CLASS} .mobile-block-ui * {
    visibility: visible !important;
}`;
		(root.head || root).appendChild(isolateStyle);
	}

	function clearIsolation() {
		document.documentElement.classList.remove(ISOLATE_ACTIVE_CLASS);
		isolationElements.forEach(el => {
			el?.classList?.remove(ISOLATE_PATH_CLASS, ISOLATE_TARGET_CLASS);
		});
		isolationHosts.forEach(host => {
			host?.classList?.remove(ISOLATE_HOST_CLASS);
		});
		isolationElements.clear();
		isolationHosts.clear();
		isIsolationActive = false;
	}

	function markIsolationPath(el, root) {
		let current = el;
		while (current && current.nodeType === 1) {
			current.classList.add(ISOLATE_PATH_CLASS);
			isolationElements.add(current);
			if (current === root?.body || current.parentElement === null) break;
			current = current.parentElement;
		}
	}

	function applyIsolation(el) {
		if (!el || el.closest?.('.mobile-block-ui')) return false;
		clearIsolation();
		ensureIsolationStyle(document);
		document.documentElement.classList.add(ISOLATE_ACTIVE_CLASS);
		let current = el;
		let firstTarget = true;
		while (current && current.nodeType === 1) {
			const root = typeof current.getRootNode === 'function' ? current.getRootNode() : document;
			if (isShadowRoot(root)) {
				ensureIsolationStyle(root);
				if (firstTarget) {
					current.classList.add(ISOLATE_TARGET_CLASS);
					firstTarget = false;
				}
				markIsolationPath(current, root);
				root.host.classList.add(ISOLATE_HOST_CLASS);
				isolationHosts.add(root.host);
				current = root.host;
			} else {
				if (firstTarget) {
					current.classList.add(ISOLATE_TARGET_CLASS);
					firstTarget = false;
				}
				markIsolationPath(current, document);
				break;
			}
		}
		isIsolationActive = true;
		return true;
	}

	const style = document.createElement('style');
	style.id = UI_STYLE_ID;
	style.setAttribute(STYLE_BLOCK_OWNER_ATTR, 'ui');

	function updateCSSVariables() {
		document.documentElement.style.setProperty('--panel-opacity', settings.panelOpacity);
		document.documentElement.style.setProperty('--toggle-size', `${TOGGLE_BASE_SIZE * settings.toggleSizeScale}px`);
		document.documentElement.style.setProperty('--toggle-hitbox-size', `${TOGGLE_HITBOX_SIZE}px`);
		document.documentElement.style.setProperty('--toggle-opacity', settings.toggleOpacity);

		document.querySelectorAll('#mobile-block-panel, #mobile-settings-panel, #mobile-blocklist-panel, #mobile-inspector-panel').forEach(p => {
			p.style.setProperty('background-color', `rgba(248, 248, 250, ${settings.panelOpacity})`, 'important');
		});
		if (toggleBtn) {
			toggleBtn.style.setProperty('width', `var(--toggle-hitbox-size)`, 'important');
			toggleBtn.style.setProperty('height', `var(--toggle-hitbox-size)`, 'important');
			toggleBtn.style.setProperty('opacity', `var(--toggle-opacity)`, 'important');
			toggleBtn.classList.toggle('hidden-toggle', settings.hideToggleButton);
		}
	}

	function applyToggleBtnPosition() {
		if (!toggleBtn) return;

		toggleBtn.style.top = 'auto';
		toggleBtn.style.left = 'auto';
		toggleBtn.style.bottom = 'auto';
		toggleBtn.style.right = 'auto';
		toggleBtn.style.transform = '';

		const margin = '16px';
		const topInset = `calc(env(safe-area-inset-top, 0px) + ${margin})`;
		const rightInset = `calc(env(safe-area-inset-right, 0px) + ${margin})`;
		const bottomInset = `calc(env(safe-area-inset-bottom, 0px) + ${margin})`;
		const leftInset = `calc(env(safe-area-inset-left, 0px) + ${margin})`;

		switch (settings.toggleBtnCorner) {
			case 'top-left':
				toggleBtn.style.top = topInset;
				toggleBtn.style.left = leftInset;
				break;
			case 'top-right':
				toggleBtn.style.top = topInset;
				toggleBtn.style.right = rightInset;
				break;
			case 'bottom-left':
				toggleBtn.style.bottom = bottomInset;
				toggleBtn.style.left = leftInset;
				break;
			case 'bottom-right':
			default:
				toggleBtn.style.bottom = bottomInset;
				toggleBtn.style.right = rightInset;
				break;
		}
		console.log(SCRIPT_ID, "Applied toggle button corner:", settings.toggleBtnCorner);
	}

	style.textContent = `
:root {
    --md-sys-color-primary: #007aff; --md-sys-color-on-primary: #ffffff;
    --md-sys-color-primary-container: rgba(255, 255, 255, 0.94); --md-sys-color-on-primary-container: #0f172a;
    --md-sys-color-secondary: #1d1d1f; --md-sys-color-on-secondary: #ffffff;
    --md-sys-color-secondary-container: rgba(118, 118, 128, 0.12); --md-sys-color-on-secondary-container: #1d1d1f;
    --md-sys-color-tertiary: #0a84ff; --md-sys-color-on-tertiary: #ffffff;
    --md-sys-color-tertiary-container: rgba(0, 122, 255, 0.10); --md-sys-color-on-tertiary-container: #005ecb;
    --md-sys-color-error: #ff3b30; --md-sys-color-on-error: #ffffff;
    --md-sys-color-error-container: rgba(255, 59, 48, 0.12); --md-sys-color-on-error-container: #b42318;
    --md-sys-color-background: #f5f5f7; --md-sys-color-on-background: #1d1d1f;
    --md-sys-color-surface: #f8f8fa; --md-sys-color-on-surface: #1d1d1f;
    --md-sys-color-surface-variant: #f2f2f7; --md-sys-color-on-surface-variant: #6e6e73;
    --md-sys-color-outline: rgba(60, 60, 67, 0.18); --md-sys-color-shadow: #000000;
    --md-sys-color-inverse-surface: rgba(28, 28, 30, 0.92); --md-sys-color-inverse-on-surface: #ffffff;
    --md-sys-color-surface-container-high: rgba(255, 255, 255, 0.76);
    --md-sys-color-success: #34c759; --md-sys-color-success-container: rgba(52, 199, 89, 0.12);
    --md-sys-color-warning: #ff9500;
    --panel-opacity: ${DEFAULT_SETTINGS.panelOpacity};
    --toggle-size: ${TOGGLE_BASE_SIZE * DEFAULT_SETTINGS.toggleSizeScale}px;
    --toggle-hitbox-size: ${TOGGLE_HITBOX_SIZE}px;
    --toggle-opacity: ${DEFAULT_SETTINGS.toggleOpacity};
    --md-ref-typeface-plain: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
    --md-sys-typescale-body-large-font-family: var(--md-ref-typeface-plain);
    --md-sys-typescale-body-large-font-size: 13px;
    --md-sys-typescale-label-large-font-size: 12.5px;
    --md-sys-typescale-label-medium-font-size: 11.5px;
    --md-sys-typescale-label-small-font-size: 10px;
    --md-sys-typescale-title-medium-font-size: 15px;
}

.scrollable-container {
    position: relative;
    overflow-y: auto;
    max-height: min(56vh, 480px);
    padding: 4px 2px 8px;
    -webkit-mask-image: linear-gradient(to bottom, black 0%, black 92%, transparent 100%);
    mask-image: linear-gradient(to bottom, black 0%, black 92%, transparent 100%);

    scrollbar-width: thin;
    scrollbar-color: rgba(60,60,67,0.24) transparent;
    -ms-overflow-style: none;
}
.scrollable-container::-webkit-scrollbar {
    width: 4px;
}
.scrollable-container::-webkit-scrollbar-thumb {
    background: rgba(60,60,67,0.20);
    border-radius: 999px;
}

.mobile-block-ui { z-index: 2147483646 !important; touch-action: manipulation !important; font-family: var(--md-sys-typescale-body-large-font-family); box-sizing: border-box; position: fixed !important; visibility: visible !important; color: var(--md-sys-color-on-surface); -webkit-tap-highlight-color: transparent !important; }

#mobile-block-panel, #mobile-settings-panel, #mobile-blocklist-panel, #mobile-inspector-panel {
    background-color: rgba(248, 248, 250, var(--panel-opacity)) !important; backdrop-filter: saturate(1.45) blur(20px); -webkit-backdrop-filter: saturate(1.45) blur(20px);
    color: var(--md-sys-color-on-surface); border-radius: 18px !important;
    box-shadow: 0 20px 55px rgba(0, 0, 0, 0.20), 0 2px 8px rgba(0, 0, 0, 0.08) !important;
    border: 1px solid rgba(255, 255, 255, 0.70); padding: 10px 11px; width: calc(100% - 56px); max-width: 310px;
    display: none;
    opacity: 0;
    backface-visibility: hidden; -webkit-backface-visibility: hidden; overflow: hidden;
    transition: transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease-out, width 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), max-width 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), padding 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), border-radius 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    will-change: transform, opacity, width;
    cursor: grab;
}

#mobile-block-panel { bottom: calc(env(safe-area-inset-bottom, 0px) + 16px); left: 50%; transform: translateX(-50%) translateY(22px) scale(0.985); z-index: 2147483645 !important; }
#mobile-block-panel.dock-bottom { top: auto; bottom: calc(env(safe-area-inset-bottom, 0px) + 16px); transform: translateX(-50%) translateY(22px) scale(0.985); }
#mobile-block-panel.dock-top { top: calc(env(safe-area-inset-top, 0px) + 16px); bottom: auto; transform: translateX(-50%) translateY(-22px) scale(0.985); }
#mobile-settings-panel, #mobile-blocklist-panel, #mobile-inspector-panel { top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.98); z-index: 2147483647 !important; max-width: 310px; max-height: 76vh; overflow-y: auto; }
#mobile-settings-panel { flex-direction: column; overflow: hidden; max-height: min(70vh, 560px); }

#mobile-block-panel.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
}
#mobile-settings-panel.visible, #mobile-blocklist-panel.visible, #mobile-inspector-panel.visible {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
}

/* Overrides for dragged panels: transform should only handle scale */
#mobile-block-panel[data-was-dragged="true"] {
    transform: scale(0.985); /* Closed state */
}
#mobile-block-panel[data-was-dragged="true"].visible {
    transform: scale(1); /* Open state */
}
#mobile-settings-panel[data-was-dragged="true"],
#mobile-blocklist-panel[data-was-dragged="true"],
#mobile-inspector-panel[data-was-dragged="true"] {
    transform: scale(0.98); /* Closed state */
}
#mobile-settings-panel[data-was-dragged="true"].visible,
#mobile-blocklist-panel[data-was-dragged="true"].visible,
#mobile-inspector-panel[data-was-dragged="true"].visible {
    transform: scale(1); /* Open state */
}

.mb-panel-title { font-size: var(--md-sys-typescale-title-medium-font-size); font-weight: 700; color: var(--md-sys-color-on-surface); text-align: center; margin: 2px 0 12px 0; letter-spacing: 0; }

.mb-slider { width: 100%; margin: 10px 0; -webkit-appearance: none; appearance: none; background: rgba(120, 120, 128, 0.22); height: 4px; border-radius: 999px; outline: none; cursor: pointer; transition: background 0.2s ease; }
.mb-slider:hover { background: rgba(120, 120, 128, 0.32); }
.mb-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; background: #ffffff; border-radius: 50%; cursor: pointer; border: 0.5px solid rgba(60,60,67,0.18); box-shadow: 0 2px 8px rgba(0,0,0,0.20); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.mb-slider::-moz-range-thumb { width: 18px; height: 18px; background: #ffffff; border-radius: 50%; cursor: pointer; border: 0.5px solid rgba(60,60,67,0.18); box-shadow: 0 2px 8px rgba(0,0,0,0.20); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.mb-slider:active::-webkit-slider-thumb { box-shadow: 0 0 0 10px rgba(var(--md-sys-color-primary-rgb, 160, 201, 255), 0.25); }
.mb-slider:active::-moz-range-thumb { box-shadow: 0 0 0 10px rgba(var(--md-sys-color-primary-rgb, 160, 201, 255), 0.25); }

.mes-selected-element {
    outline: 2px solid var(--md-sys-color-primary) !important;
    outline-offset: 2px;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.28) !important;
    background-color: rgba(0, 122, 255, 0.10) !important;
    z-index: 2147483644 !important;
    transition: background-color 0.1s ease, outline 0.1s ease, box-shadow 0.1s ease;
    pointer-events: none;
}
.${CANDIDATE_PREVIEW_CLASS} {
    outline: 3px solid #34c759 !important;
    outline-offset: 2px;
    box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.22) !important;
    background-color: rgba(52, 199, 89, 0.12) !important;
    transition: background-color 0.12s ease, outline 0.12s ease, box-shadow 0.12s ease;
}

#mobile-block-toggleBtn {
    z-index: 2147483646 !important; background-color: transparent !important; color: rgba(60, 60, 67, 0.34) !important;
    opacity: var(--toggle-opacity) !important; width: var(--toggle-hitbox-size) !important; height: var(--toggle-hitbox-size) !important; border-radius: 999px !important; border: none !important; cursor: pointer !important;
    box-shadow: none !important;
    transition: background-color 0.2s ease, transform 0.16s ease, box-shadow 0.2s ease, opacity 0.2s ease, border 0.2s ease, top 0.2s ease, left 0.2s ease, bottom 0.2s ease, right 0.2s ease;
    display: flex !important; align-items: center !important; justify-content: center !important; overflow: hidden !important; backface-visibility: hidden; -webkit-backface-visibility: hidden; position: fixed !important; -webkit-tap-highlight-color: transparent !important;
}
#mobile-block-toggleBtn::before { content: ''; position: absolute; width: var(--toggle-size); height: var(--toggle-size); border-radius: 999px; background-color: rgba(255, 255, 255, 0.54); border: 0.5px solid rgba(60, 60, 67, 0.12); box-shadow: 0 3px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.05); transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, width 0.2s ease, height 0.2s ease; }
#mobile-block-toggleBtn:active { transform: scale(0.94); box-shadow: none !important; }
#mobile-block-toggleBtn.selecting {
    background-color: transparent !important;
    color: rgba(60, 60, 67, 0.48) !important;
}
#mobile-block-toggleBtn.selecting::before {
    background-color: rgba(255, 255, 255, 0.70);
    border-color: rgba(60, 60, 67, 0.18);
    box-shadow: 0 5px 12px rgba(0,0,0,0.09), 0 0 0 2px rgba(60, 60, 67, 0.06);
}
#mobile-block-toggleBtn.hidden-toggle { display: none !important; }
#mobile-block-toggleBtn .toggle-icon { position: relative; z-index: 1; width: calc(var(--toggle-size) * 0.46); height: calc(var(--toggle-size) * 0.46); display: block; margin: auto; background-color: currentColor; mask-size: contain; mask-repeat: no-repeat; mask-position: center; -webkit-mask-size: contain; -webkit-mask-repeat: no-repeat; -webkit-mask-position: center; }
#mobile-block-toggleBtn .toggle-icon-plus { mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 5h6v6H5V5Zm8 0h6v6h-6V5ZM5 13h6v6H5v-6Zm8 0h6v6h-6v-6Z"/></svg>'); -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 5h6v6H5V5Zm8 0h6v6h-6V5ZM5 13h6v6H5v-6Zm8 0h6v6h-6v-6Z"/></svg>'); }
#mobile-block-toggleBtn.selecting .toggle-icon-plus { mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11 3h2v5h-2V3Zm0 13h2v5h-2v-5ZM3 11h5v2H3v-2Zm13 0h5v2h-5v-2Zm-4-2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"/></svg>'); -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11 3h2v5h-2V3Zm0 13h2v5h-2v-5ZM3 11h5v2H3v-2Zm13 0h5v2h-5v-2Zm-4-2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"/></svg>'); }
#mobile-block-toggleBtn .toggle-icon-shield { background-image: url('${SHIELD_TOGGLE_ICON_URL}'); background-size: contain; background-repeat: no-repeat; background-position: center; background-color: transparent !important; mask-image: none; -webkit-mask-image: none; width: 60%; height: 60%; }

.mb-btn { padding: 7px 12px; border: 0.5px solid transparent; border-radius: 10px !important; font-size: var(--md-sys-typescale-label-large-font-size); font-weight: 600; cursor: pointer; transition: background-color 0.16s ease, transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.16s ease, border-color 0.16s ease, color 0.16s ease; text-align: center; box-shadow: none; min-width: 0; min-height: 34px; overflow: hidden; white-space: normal; overflow-wrap: anywhere; word-break: keep-all; text-overflow: clip; opacity: 1 !important; -webkit-tap-highlight-color: transparent !important; line-height: 1.16; display: inline-flex; align-items: center; justify-content: center; letter-spacing: 0; }
.mb-btn:hover { box-shadow: 0 1px 5px rgba(0,0,0,0.08); }
.mb-btn:active { transform: scale(0.97); box-shadow: none; }
.mb-btn:disabled { opacity: 0.36 !important; cursor: default; pointer-events: none; box-shadow: none !important; }
.mb-btn.primary { background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
.mb-btn.primary:hover { background-color: #b0d3ff; } .mb-btn.primary:active { background-color: #c0daff; }
.mb-btn.secondary { background-color: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
.mb-btn.secondary:hover { background-color: rgba(118,118,128,0.18); } .mb-btn.secondary:active { background-color: rgba(118,118,128,0.24); }
.mb-btn.tertiary { background-color: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container); }
.mb-btn.tertiary:hover { background-color: rgba(0,122,255,0.16); } .mb-btn.tertiary:active { background-color: rgba(0,122,255,0.22); }
.mb-btn.error { background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
.mb-btn.error:hover { background-color: rgba(255,59,48,0.18); } .mb-btn.error:active { background-color: rgba(255,59,48,0.22); }
.mb-btn.surface { background-color: var(--md-sys-color-surface-variant); color: var(--md-sys-color-on-surface-variant); }
.mb-btn.surface:hover { background-color: rgba(118,118,128,0.18); } .mb-btn.surface:active { background-color: rgba(118,118,128,0.24); }
.mb-btn.outline { background-color: transparent; color: var(--md-sys-color-primary); border: 1px solid var(--md-sys-color-outline); box-shadow: none; }
.mb-btn.outline:hover { background-color: rgba(var(--md-sys-color-primary-rgb, 160, 201, 255), 0.08); }
.mb-btn.outline:active { background-color: rgba(var(--md-sys-color-primary-rgb, 160, 201, 255), 0.12); }
.mes-icon { display: inline-block; width: 14px; height: 14px; flex: 0 0 auto; background-color: currentColor; opacity: 0.78; mask-size: contain; mask-position: center; mask-repeat: no-repeat; -webkit-mask-size: contain; -webkit-mask-position: center; -webkit-mask-repeat: no-repeat; }
.btn-label { display: block; min-width: 0; max-width: 100%; overflow: visible; text-overflow: clip; white-space: normal; overflow-wrap: anywhere; word-break: keep-all; line-height: 1.12; }
.icon-minimize { mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 11h14v2H5v-2Z"/></svg>'); -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 11h14v2H5v-2Z"/></svg>'); }
.icon-expand { mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 9V5h4v2H8v2H6Zm8-4h4v4h-2V7h-2V5ZM8 15v2h2v2H6v-4h2Zm8 2v-2h2v4h-4v-2h2Z"/></svg>'); -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 9V5h4v2H8v2H6Zm8-4h4v4h-2V7h-2V5ZM8 15v2h2v2H6v-4h2Zm8 2v-2h2v4h-4v-2h2Z"/></svg>'); }
.icon-preview { mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 5c5 0 8 4.5 9 7-1 2.5-4 7-9 7s-8-4.5-9-7c1-2.5 4-7 9-7Zm0 3.5A3.5 3.5 0 1 0 12 15a3.5 3.5 0 0 0 0-7Zm0 2A1.5 1.5 0 1 1 12 13a1.5 1.5 0 0 1 0-3Z"/></svg>'); -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 5c5 0 8 4.5 9 7-1 2.5-4 7-9 7s-8-4.5-9-7c1-2.5 4-7 9-7Zm0 3.5A3.5 3.5 0 1 0 12 15a3.5 3.5 0 0 0 0-7Zm0 2A1.5 1.5 0 1 1 12 13a1.5 1.5 0 0 1 0-3Z"/></svg>'); }
.icon-save { mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m9.2 16.2-3.4-3.4 1.4-1.4 2 2 7.6-7.6 1.4 1.4-9 9Z"/></svg>'); -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m9.2 16.2-3.4-3.4 1.4-1.4 2 2 7.6-7.6 1.4 1.4-9 9Z"/></svg>'); }
.icon-more { mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/></svg>'); -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/></svg>'); }
.icon-close { mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m7 5.6 5 5 5-5L18.4 7l-5 5 5 5-1.4 1.4-5-5-5 5L5.6 17l5-5-5-5L7 5.6Z"/></svg>'); -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m7 5.6 5 5 5-5L18.4 7l-5 5 5 5-1.4 1.4-5-5-5 5L5.6 17l5-5-5-5L7 5.6Z"/></svg>'); }
.icon-parent { mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m12 7 6 6-1.4 1.4L12 9.8l-4.6 4.6L6 13l6-6Z"/></svg>'); -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m12 7 6 6-1.4 1.4L12 9.8l-4.6 4.6L6 13l6-6Z"/></svg>'); }
.icon-child { mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m12 17-6-6 1.4-1.4 4.6 4.6 4.6-4.6L18 11l-6 6Z"/></svg>'); -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m12 17-6-6 1.4-1.4 4.6 4.6 4.6-4.6L18 11l-6 6Z"/></svg>'); }

.button-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(82px, 1fr)); gap: 8px; margin-top: 14px; }
.picker-topbar { display: grid; grid-template-columns: minmax(0, 1fr) 32px; gap: 8px; align-items: center; margin-bottom: 8px; }
#blocker-compact-summary { min-width: 0; color: var(--md-sys-color-on-surface-variant); font-size: var(--md-sys-typescale-label-small-font-size); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#mobile-block-panel:not(.compact-picker) #blocker-compact-summary { opacity: 0; }
.picker-compact-btn { width: 32px; min-width: 32px; height: 30px; min-height: 30px; padding: 0 !important; border-radius: 999px !important; background-color: rgba(118,118,128,0.12); color: var(--md-sys-color-on-surface-variant); }
.picker-compact-btn .mes-icon { width: 15px; height: 15px; opacity: 0.72; }
.primary-action-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; margin-top: 10px; }
.primary-action-grid .mb-btn { gap: 5px; min-height: 34px; padding: 6px 8px; font-size: var(--md-sys-typescale-label-small-font-size); }
.secondary-action-grid { display: none; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 0.5px solid rgba(60,60,67,0.12); }
.secondary-action-grid.visible { display: grid; }
.secondary-action-grid .mb-btn { padding: 6px 8px; min-width: 0; min-height: 30px; font-size: var(--md-sys-typescale-label-medium-font-size); }
#blocker-info-wrapper { margin-bottom: 8px; padding: 8px 9px; background-color: rgba(118,118,128,0.10); border-radius: 12px; border: 0.5px solid rgba(60,60,67,0.08); }
#blocker-info-label { display: block; font-size: var(--md-sys-typescale-label-small-font-size); color: var(--md-sys-color-on-surface-variant); margin-bottom: 4px; font-weight: 600; }
#blocker-info { display: block; color: var(--md-sys-color-on-surface); font-size: var(--md-sys-typescale-label-medium-font-size); line-height: 1.4; word-break: break-all; min-height: 1.4em; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, monospace; max-height: 4.2em; overflow-y: auto; }
#blocker-info:empty::after { content: '없음'; color: var(--md-sys-color-on-surface-variant); font-style: italic; }
#blocker-nav-label { min-height: 1.25em; margin-top: -3px; color: var(--md-sys-color-on-surface-variant); font-size: var(--md-sys-typescale-label-small-font-size); text-align: center; padding: 3px 8px; border-radius: 999px; background: rgba(118,118,128,0.08); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.element-nav-row { display: grid; grid-template-columns: 44px 1fr 44px; gap: 6px; align-items: center; margin-top: 6px; }
.element-nav-row .mb-slider { margin: 0; background: linear-gradient(to right, rgba(0,122,255,0.32) 0%, rgba(0,122,255,0.32) var(--nav-progress, 50%), rgba(120,120,128,0.20) var(--nav-progress, 50%), rgba(120,120,128,0.20) 100%); }
.element-nav-row .mb-slider:disabled { opacity: 0.45; }
.nav-step-btn { min-width: 0; min-height: 30px; padding: 5px 7px; font-size: 0; gap: 0; }
.nav-step-btn .btn-label { display: none; }
.nav-step-btn .mes-icon { width: 15px; height: 15px; opacity: 0.72; }
#blocker-selector-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; font-size: var(--md-sys-typescale-label-small-font-size); color: var(--md-sys-color-on-surface-variant); }
.selector-chip { display: inline-flex; align-items: center; min-height: 20px; padding: 1px 7px; border-radius: 999px; background-color: rgba(118,118,128,0.10); border: 0.5px solid rgba(60,60,67,0.08); }
.selector-chip.unique { color: var(--md-sys-color-success); border-color: rgba(144, 238, 144, 0.35); }
.selector-chip.warning { color: var(--md-sys-color-warning); border-color: rgba(255, 204, 128, 0.35); }
.selector-chip.error { color: var(--md-sys-color-error); border-color: rgba(255, 180, 171, 0.35); }
.selector-chip.safe { color: var(--md-sys-color-success); border-color: rgba(52,199,89,0.32); }
.selector-chip.caution { color: var(--md-sys-color-warning); border-color: rgba(255,149,0,0.32); }
.selector-chip.broad { color: var(--md-sys-color-error); border-color: rgba(255,59,48,0.30); }
label[for="blocker-slider"] { display: block; font-size: var(--md-sys-typescale-label-small-font-size); color: var(--md-sys-color-on-surface-variant); margin-bottom: 4px; margin-top: 8px; font-weight: 600; }

#mobile-block-panel.compact-picker { width: min(304px, calc(100% - 56px)); max-width: 304px; padding: 7px 8px; border-radius: 22px !important; }
#mobile-block-panel.compact-picker #blocker-info-wrapper,
#mobile-block-panel.compact-picker label[for="blocker-slider"],
#mobile-block-panel.compact-picker #blocker-nav-label,
#mobile-block-panel.compact-picker #blocker-secondary-actions { display: none !important; }
#mobile-block-panel.compact-picker .picker-topbar { margin-bottom: 5px; grid-template-columns: minmax(0, 1fr) 30px; }
#mobile-block-panel.compact-picker #blocker-compact-summary { opacity: 1; padding-left: 4px; }
#mobile-block-panel.compact-picker .picker-compact-btn { width: 30px; min-width: 30px; height: 28px; min-height: 28px; background-color: rgba(118,118,128,0.10); }
#mobile-block-panel.compact-picker .element-nav-row { display: grid; grid-template-columns: 30px minmax(88px, 1fr) 30px; gap: 6px; margin: 2px 0 6px; }
#mobile-block-panel.compact-picker .element-nav-row .mb-slider { height: 28px; background-size: 100% 3px; background-repeat: no-repeat; background-position: center; }
#mobile-block-panel.compact-picker #blocker-slider { touch-action: pan-x !important; }
#mobile-block-panel.compact-picker .nav-step-btn,
#mobile-block-panel.compact-picker .primary-action-grid .mb-btn { width: 30px; min-width: 30px; height: 28px; min-height: 28px; padding: 0 !important; border-radius: 999px !important; }
#mobile-block-panel.compact-picker .primary-action-grid .btn-label { display: none; }
#mobile-block-panel.compact-picker .nav-step-btn .mes-icon,
#mobile-block-panel.compact-picker .primary-action-grid .mes-icon { display: inline-block; width: 14px; height: 14px; opacity: 0.78; }
#mobile-block-panel.compact-picker .primary-action-grid { margin-top: 0; display: flex; justify-content: center; gap: 8px; }
#mobile-block-panel.compact-picker .mb-slider::-webkit-slider-thumb { width: 16px; height: 16px; }
#mobile-block-panel.compact-picker .mb-slider::-moz-range-thumb { width: 16px; height: 16px; }

.settings-layout { display: block; }
.settings-scroll { flex: 1; min-height: 0; max-height: none; overflow-y: auto; }
.settings-item { margin: 0; padding: 6px 0; display: flex; flex-direction: column; gap: 5px; border-bottom: 0.5px solid rgba(60,60,67,0.10); }
.settings-section-title { margin: 13px 0 3px; padding-top: 1px; color: var(--md-sys-color-on-surface-variant); font-size: var(--md-sys-typescale-label-small-font-size); font-weight: 700; letter-spacing: 0; }
.settings-section-title:first-child { margin-top: 0; }
.settings-credit { margin-top: 8px; color: var(--md-sys-color-outline); font-size: 9px; font-weight: 500; text-align: center; letter-spacing: 0; opacity: 0.72; }
.settings-item label { display: flex; justify-content: space-between; align-items: center; font-size: var(--md-sys-typescale-label-large-font-size); color: var(--md-sys-color-on-surface); min-height: 28px; }
.settings-item label .settings-label-text { flex-grow: 1; margin-right: 10px; }
.settings-value { color: var(--md-sys-color-on-surface); font-weight: 500; font-size: var(--md-sys-typescale-label-medium-font-size); padding-left: 10px; }
.mes-switch { width: 42px; min-width: 42px; height: 26px; min-height: 26px; padding: 2px !important; border-radius: 999px !important; background-color: rgba(118,118,128,0.18); border: 0.5px solid rgba(60,60,67,0.10); box-shadow: inset 0 0 0 0.5px rgba(60,60,67,0.06); flex-shrink: 0; justify-content: flex-start; font-size: 0; }
.mes-switch .switch-knob { width: 22px; height: 22px; border-radius: 50%; background: #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.22); transform: translateX(0); transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1); }
.mes-switch.active { background-color: var(--md-sys-color-primary); border-color: transparent; }
.mes-switch.active .switch-knob { transform: translateX(16px); }
.mes-switch.error.active { background-color: var(--md-sys-color-error); }
#settings-close, #settings-backup, #settings-restore { width: 100%; margin-top: 8px; }
#settings-restore-input { display: none; }

.launcher-settings-item { padding-top: 2px; }
.launcher-mode-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; margin-top: 2px; padding: 2px; border-radius: 12px; background: rgba(118,118,128,0.12); }
.launcher-mode-btn { padding: 6px 8px; min-width: 0; min-height: 30px; font-size: var(--md-sys-typescale-label-small-font-size); border-radius: 10px !important; background: transparent; color: var(--md-sys-color-on-surface-variant); }
.launcher-mode-btn.active { background-color: #ffffff; color: var(--md-sys-color-primary); box-shadow: 0 1px 4px rgba(0,0,0,0.10); }
.gesture-detail-panel { display: none; margin-top: 8px; gap: 6px; }
.gesture-detail-panel.visible { display: grid; }
.gesture-detail-row { display: grid; grid-template-columns: minmax(58px, 0.54fr) minmax(0, 1fr); align-items: center; gap: 8px; }
.gesture-detail-label { font-size: var(--md-sys-typescale-label-small-font-size); color: var(--md-sys-color-on-surface-variant); font-weight: 600; white-space: nowrap; }
.gesture-option-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px; padding: 2px; border-radius: 12px; background: rgba(118,118,128,0.12); min-width: 0; }
.gesture-option-btn { padding: 6px 6px; min-width: 0; min-height: 30px; font-size: var(--md-sys-typescale-label-small-font-size); border-radius: 10px !important; background-color: transparent; color: var(--md-sys-color-on-surface-variant); }
.gesture-option-btn.active { background-color: #ffffff; color: var(--md-sys-color-primary); box-shadow: 0 1px 4px rgba(0,0,0,0.10); }
.corner-selector-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; margin-top: 2px; padding: 2px; border-radius: 12px; background: rgba(118,118,128,0.12); }
.corner-btn { padding: 6px 8px; min-width: 0; min-height: 30px; font-size: var(--md-sys-typescale-label-small-font-size); border-radius: 10px !important; }
.corner-btn.active { background-color: #ffffff; color: var(--md-sys-color-primary); box-shadow: 0 1px 4px rgba(0,0,0,0.10); }
.corner-btn:not(.active) { background-color: transparent; color: var(--md-sys-color-on-surface-variant); }
.hide-strategy-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; margin-top: 2px; padding: 2px; border-radius: 12px; background: rgba(118,118,128,0.12); }
.hide-strategy-btn { padding: 6px 8px; min-width: 0; min-height: 30px; font-size: var(--md-sys-typescale-label-small-font-size); border-radius: 10px !important; }
.hide-strategy-btn.active { background-color: #ffffff; color: var(--md-sys-color-primary); box-shadow: 0 1px 4px rgba(0,0,0,0.10); }
.hide-strategy-btn:not(.active) { background-color: transparent; color: var(--md-sys-color-on-surface-variant); }
.legacy-import-item[hidden] { display: none !important; }
.legacy-import-card { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 8px; border-radius: 12px; background: rgba(0,122,255,0.07); border: 0.5px solid rgba(0,122,255,0.12); }
.legacy-import-title { font-size: var(--md-sys-typescale-label-large-font-size); font-weight: 700; color: var(--md-sys-color-on-surface); }
.legacy-import-summary { margin-top: 2px; font-size: var(--md-sys-typescale-label-small-font-size); color: var(--md-sys-color-on-surface-variant); }
.legacy-import-card .mb-btn { min-height: 30px; padding: 6px 10px; }

@media (prefers-reduced-motion: reduce) {
    #mobile-block-panel, #mobile-settings-panel, #mobile-blocklist-panel, #mobile-inspector-panel,
    #mobile-block-toggleBtn, .mb-btn, .mes-switch .switch-knob {
        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
    }
}

#blocklist-container { max-height: calc(70vh - 135px); overflow-y: auto; margin: 12px 0; padding-right: 4px; display: flex; flex-direction: column; gap: 8px; }
#blocklist-summary { color: var(--md-sys-color-on-surface-variant); font-size: var(--md-sys-typescale-label-small-font-size); text-align: center; margin-top: -4px; margin-bottom: 8px; }
#blocklist-search { width: 100%; min-height: 34px; border: 0.5px solid rgba(60,60,67,0.12); border-radius: 10px; background-color: rgba(118,118,128,0.10); color: var(--md-sys-color-on-surface); padding: 6px 10px; box-sizing: border-box; font-size: var(--md-sys-typescale-label-large-font-size); outline: none; }
#blocklist-search::placeholder { color: var(--md-sys-color-on-surface-variant); }
.blocklist-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 9px 10px; background-color: rgba(118,118,128,0.08); border-radius: 10px; border: 0.5px solid rgba(60,60,67,0.08); transition: background-color 0.2s, border-color 0.2s, opacity 0.3s ease, transform 0.3s ease; }
.blocklist-item:hover { background-color: rgba(118,118,128,0.12); border-color: var(--md-sys-color-outline); }
.blocklist-item.disabled-rule { background-color: rgba(118,118,128,0.05); }
.blocklist-item.disabled-rule .blocklist-rule-selector { opacity: 0.58; text-decoration: line-through; text-decoration-thickness: 1px; }
.blocklist-rule { flex: 1; min-width: 0; border-radius: 9px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.blocklist-rule:active { opacity: 0.72; }
.blocklist-rule-selector { word-break: break-all; font-size: var(--md-sys-typescale-label-medium-font-size); color: var(--md-sys-color-on-surface-variant); font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, monospace; line-height: 1.35; }
.blocklist-rule-meta { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
.blocklist-chip { display: inline-flex; align-items: center; min-height: 18px; padding: 1px 6px; border-radius: 999px; background: rgba(118,118,128,0.10); color: var(--md-sys-color-on-surface-variant); font-size: 10px; font-weight: 700; letter-spacing: 0; }
.blocklist-chip.current { color: var(--md-sys-color-primary); background: rgba(0,122,255,0.10); }
.blocklist-chip.match { color: var(--md-sys-color-success); background: rgba(52,199,89,0.10); }
.blocklist-chip.nomatch { color: var(--md-sys-color-warning); background: rgba(255,149,0,0.10); }
.blocklist-chip.disabled { color: var(--md-sys-color-error); background: rgba(255,59,48,0.10); }
.blocklist-controls { display: flex; gap: 6px; flex-shrink: 0; }
.blocklist-btn { padding: 5px 8px; min-width: auto; min-height: 28px; font-size: var(--md-sys-typescale-label-small-font-size); border-radius: 9px !important; }
.blocklist-btn-delete { background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
.blocklist-btn-copy { background-color: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
.blocklist-btn-toggle { background-color: rgba(0,122,255,0.10); color: var(--md-sys-color-primary); }
#blocklist-empty { text-align:center; color: var(--md-sys-color-on-surface-variant); padding: 20px 0; }

.inspector-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-bottom: 10px; padding: 2px; border-radius: 12px; background: rgba(118,118,128,0.12); }
.inspector-tab { min-width: 0; min-height: 30px; padding: 6px 4px; font-size: var(--md-sys-typescale-label-small-font-size); border-radius: 10px !important; color: var(--md-sys-color-on-surface-variant); background: transparent; }
.inspector-tab.active { background-color: #ffffff; color: var(--md-sys-color-primary); box-shadow: 0 1px 4px rgba(0,0,0,0.10); }
#inspector-content { max-height: 54vh; overflow-y: auto; padding-right: 2px; color: var(--md-sys-color-on-surface); font-size: var(--md-sys-typescale-label-medium-font-size); line-height: 1.45; }
.inspector-section { margin-bottom: 10px; padding: 9px 10px; background-color: rgba(118,118,128,0.08); border: 0.5px solid rgba(60,60,67,0.08); border-radius: 10px; }
.inspector-section-title { margin: 0 0 7px 0; color: var(--md-sys-color-primary); font-size: var(--md-sys-typescale-label-medium-font-size); font-weight: 700; }
.inspector-pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, monospace; font-size: var(--md-sys-typescale-label-small-font-size); color: var(--md-sys-color-on-surface-variant); max-height: 32vh; overflow-y: auto; }
.inspector-list { display: flex; flex-direction: column; gap: 8px; }
.inspector-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 0.5px solid rgba(60,60,67,0.10); }
.inspector-row:last-child { border-bottom: none; }
.inspector-row span { word-break: break-word; }
.inspector-row-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; flex-shrink: 0; max-width: 46%; }
.inspector-mini-btn { padding: 4px 8px; min-height: 26px; min-width: auto; font-size: var(--md-sys-typescale-label-small-font-size); border-radius: 8px !important; }
.selector-candidate-list { display: flex; flex-direction: column; gap: 8px; }
.selector-candidate-row { display: grid; gap: 6px; padding: 8px; border-radius: 10px; background: rgba(255,255,255,0.54); border: 0.5px solid rgba(60,60,67,0.08); }
.selector-candidate-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.selector-candidate-title { font-weight: 700; color: var(--md-sys-color-on-surface); font-size: var(--md-sys-typescale-label-medium-font-size); }
.selector-candidate-meta { color: var(--md-sys-color-on-surface-variant); font-size: var(--md-sys-typescale-label-small-font-size); text-align: right; }
.selector-candidate-selector { margin: 0; padding: 7px 8px; border-radius: 8px; background: rgba(118,118,128,0.08); color: var(--md-sys-color-on-surface-variant); font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, monospace; font-size: var(--md-sys-typescale-label-small-font-size); line-height: 1.35; white-space: pre-wrap; word-break: break-all; }
.selector-candidate-analysis { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; color: var(--md-sys-color-on-surface-variant); font-size: var(--md-sys-typescale-label-small-font-size); line-height: 1.25; }
.selector-risk { display: inline-flex; align-items: center; min-height: 18px; padding: 1px 6px; border-radius: 999px; font-size: 10px; font-weight: 700; background: rgba(118,118,128,0.10); color: var(--md-sys-color-on-surface-variant); }
.selector-risk.safe { color: var(--md-sys-color-success); background: rgba(52,199,89,0.10); }
.selector-risk.caution { color: var(--md-sys-color-warning); background: rgba(255,149,0,0.10); }
.selector-risk.broad, .selector-risk.error { color: var(--md-sys-color-error); background: rgba(255,59,48,0.10); }
.selector-risk-reason { min-width: 0; flex: 1 1 120px; }
.selector-candidate-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.selector-candidate-actions .mb-btn { min-height: 28px; padding: 5px 8px; font-size: var(--md-sys-typescale-label-small-font-size); }

#mes-toast-container { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); z-index: 2147483647 !important; display: flex; flex-direction: column-reverse; align-items: center; gap: 10px; pointer-events: none; width: max-content; max-width: 90%; }
.mes-toast { background-color: var(--md-sys-color-inverse-surface); color: var(--md-sys-color-inverse-on-surface); padding: 9px 10px 9px 14px; border-radius: 12px; box-shadow: 0 10px 28px rgba(0,0,0,0.18); font-size: var(--md-sys-typescale-label-large-font-size); opacity: 0; transform: translateY(14px); transition: opacity 0.24s ease, transform 0.24s ease, background-color 0.24s ease; pointer-events: all; max-width: 100%; text-align: center; display: flex; align-items: center; justify-content: center; gap: 10px; }
.mes-toast-message { min-width: 0; overflow-wrap: anywhere; word-break: keep-all; line-height: 1.25; }
.mes-toast-action { border: 0; border-radius: 999px; padding: 5px 9px; min-height: 28px; background: rgba(255,255,255,0.16); color: inherit; font: inherit; font-size: var(--md-sys-typescale-label-small-font-size); font-weight: 700; cursor: pointer; white-space: nowrap; -webkit-tap-highlight-color: transparent; }
.mes-toast-action:active { transform: scale(0.97); }
.mes-toast.show { opacity: 1; transform: translateY(0); }
.mes-toast.info { background-color: rgba(28,28,30,0.92); color: white; }
.mes-toast.success { background-color: rgba(28,28,30,0.92); color: #ffffff; }
.mes-toast.success .mes-toast-action { background: rgba(52,199,89,0.18); color: #b8f7c2; }
.mes-toast.error { background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
.mes-toast.warning { background-color: rgba(255,149,0,0.14); color: #9a5a00; }

@media (min-width: 700px) {
    #mobile-block-panel { max-width: 424px; padding: 11px 12px; }
    #mobile-settings-panel, #mobile-blocklist-panel, #mobile-inspector-panel { max-width: 500px; width: min(500px, calc(100% - 160px)); }
    #mobile-inspector-panel { max-width: 560px; }
    .button-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .primary-action-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .secondary-action-grid { grid-template-columns: repeat(7, minmax(0, 1fr)); }
    .inspector-tabs { grid-template-columns: repeat(6, 1fr); }
    #inspector-content { max-height: 62vh; }
    .settings-layout { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 16px; align-items: start; }
    .settings-layout .settings-section-title, .settings-layout .button-grid, .settings-layout .launcher-settings-item { grid-column: 1 / -1; }
    .settings-layout .settings-item { margin-bottom: 14px; }
    .settings-item label { font-size: var(--md-sys-typescale-body-large-font-size); }
}

@media (max-width: 380px) {
    #mobile-block-panel, #mobile-settings-panel, #mobile-blocklist-panel, #mobile-inspector-panel { width: calc(100% - 24px); padding: 11px 12px; border-radius: 16px !important; }
    .button-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .mb-btn { padding: 9px 12px; min-width: 0; }
    .inspector-row { align-items: flex-start; }
    .inspector-row-actions { max-width: 44%; gap: 4px; }
    .inspector-row-actions .inspector-mini-btn, .inspector-mini-btn { padding: 4px 7px; min-height: 26px; font-size: var(--md-sys-typescale-label-small-font-size); }
    .inspector-tabs { grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .primary-action-grid .mb-btn { min-height: 36px; }
    .selector-candidate-actions { gap: 4px; }
    .selector-candidate-actions .mb-btn { padding: 5px 4px; }
}
    `;
	const uiStyleText = style.textContent;
	document.head.appendChild(style);

	let panel, settingsPanel, toggleBtn, listPanel, inspectorPanel, toastContainer;
	let uiGuardObserver = null;
	let uiGuardScheduled = false;
	let uiGuardInterval = null;
	let visibleUiPanel = null;

	function getUiNodes() {
		return [toastContainer, panel, listPanel, inspectorPanel, settingsPanel, toggleBtn].filter(Boolean);
	}

	function nodeTouchesMesUi(node) {
		if (!node) return false;
		if (node === style) return true;
		if (node.nodeType === 3 && node.parentNode === style) return true;
		return getUiNodes().some(uiNode => node === uiNode || node.contains?.(uiNode));
	}

	function restoreUiNodeIdentity(node, expectedId) {
		if (!node) return;
		if (node.id !== expectedId) node.id = expectedId;
		node.hidden = false;
		node.removeAttribute('aria-hidden');
		node.removeAttribute('inert');
		if (node !== style) {
			node.classList.add('mobile-block-ui');
			['display', 'visibility', 'opacity', 'pointer-events'].forEach(prop => node.style.removeProperty(prop));
		}
	}

	function restoreUiIdentities() {
		restoreUiNodeIdentity(style, UI_STYLE_ID);
		restoreUiNodeIdentity(toastContainer, 'mes-toast-container');
		restoreUiNodeIdentity(panel, 'mobile-block-panel');
		restoreUiNodeIdentity(settingsPanel, 'mobile-settings-panel');
		restoreUiNodeIdentity(listPanel, 'mobile-blocklist-panel');
		restoreUiNodeIdentity(inspectorPanel, 'mobile-inspector-panel');
		restoreUiNodeIdentity(toggleBtn, 'mobile-block-toggleBtn');
		if (visibleUiPanel?.isConnected) {
			visibleUiPanel.classList.add('visible');
			visibleUiPanel.style.display = visibleUiPanel === settingsPanel ? 'flex' : 'block';
		}
	}

	function ensureUiAttached() {
		const headTarget = document.head || document.documentElement;
		const bodyTarget = document.body || document.documentElement;
		restoreUiIdentities();
		if (style && headTarget) {
			if (!style.isConnected || style.parentNode !== headTarget) {
				headTarget.appendChild(style);
			}
			if (style.textContent !== uiStyleText) {
				style.textContent = uiStyleText;
			}
		}
		if (bodyTarget) {
			getUiNodes().forEach(node => {
				if (!node.isConnected || node.parentNode !== bodyTarget) {
					bodyTarget.appendChild(node);
				}
			});
		}
		updateCSSVariables();
		updateToggleIcon();
		applyToggleBtnPosition();
	}

	function scheduleUiGuardCheck() {
		if (uiGuardScheduled) return;
		uiGuardScheduled = true;
		setTimeout(() => {
			uiGuardScheduled = false;
			ensureUiAttached();
		}, 80);
	}

	function setupUiSelfHealing() {
		if (uiGuardObserver) uiGuardObserver.disconnect();
		uiGuardObserver = new MutationObserver(mutations => {
			const shouldRepair = mutations.some(mutation =>
				nodeTouchesMesUi(mutation.target) ||
				Array.from(mutation.removedNodes || []).some(nodeTouchesMesUi)
			);
			if (shouldRepair) {
				scheduleUiGuardCheck();
			}
		});
		try {
			uiGuardObserver.observe(document.documentElement, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ['id', 'class', 'style', 'hidden', 'aria-hidden', 'inert'],
				characterData: true
			});
		} catch (e) {}
		if (uiGuardInterval) clearInterval(uiGuardInterval);
		uiGuardInterval = setInterval(ensureUiAttached, 4000);
	}

	function createUIElements() {
		toastContainer = document.createElement('div');
		toastContainer.id = 'mes-toast-container';
		toastContainer.className = 'mobile-block-ui';
		document.body.appendChild(toastContainer);

		panel = document.createElement('div');
		panel.id = 'mobile-block-panel';
		panel.className = 'mobile-block-ui';
		panel.innerHTML = `
            <div class="picker-topbar">
                <div id="blocker-compact-summary"></div>
                <button id="blocker-compact-toggle" class="mb-btn picker-compact-btn" aria-label="${STRINGS.minimizePanel}" title="${STRINGS.minimizePanel}">
                    <span class="mes-icon icon-minimize" aria-hidden="true"></span>
                </button>
            </div>
            <div id="blocker-info-wrapper">
                <span id="blocker-info-label">${STRINGS.selectedElementLabel}</span>
                <div id="blocker-info"></div>
                <div id="blocker-selector-meta"></div>
            </div>
            <label for="blocker-slider" style="display: block; font-size: var(--md-sys-typescale-label-medium-font-size); color: var(--md-sys-color-on-surface-variant); margin-bottom: 5px;">${STRINGS.parentLevelLabel}</label>
            <div class="element-nav-row">
                <button id="blocker-parent" class="mb-btn surface nav-step-btn" aria-label="${STRINGS.parent}" title="${STRINGS.parent}"><span class="btn-label">${STRINGS.parent}</span><span class="mes-icon icon-parent" aria-hidden="true"></span></button>
                <input type="range" id="blocker-slider" class="mb-slider" min="0" max="10" value="0" aria-label="Element hierarchy">
                <button id="blocker-child" class="mb-btn surface nav-step-btn" aria-label="${STRINGS.child}" title="${STRINGS.child}"><span class="btn-label">${STRINGS.child}</span><span class="mes-icon icon-child" aria-hidden="true"></span></button>
            </div>
            <div id="blocker-nav-label"></div>
            <div class="primary-action-grid">
                <button id="blocker-preview" class="mb-btn secondary" aria-label="${STRINGS.preview}" title="${STRINGS.preview}"><span class="mes-icon icon-preview" aria-hidden="true"></span><span class="btn-label">${STRINGS.preview}</span></button>
                <button id="blocker-add-block" class="mb-btn primary" aria-label="${STRINGS.saveRule}" title="${STRINGS.saveRule}"><span class="mes-icon icon-save" aria-hidden="true"></span><span class="btn-label">${STRINGS.saveRule}</span></button>
                <button id="blocker-more" class="mb-btn tertiary" aria-label="${STRINGS.more}" title="${STRINGS.more}"><span class="mes-icon icon-more" aria-hidden="true"></span><span class="btn-label">${STRINGS.more}</span></button>
                <button id="blocker-cancel" class="mb-btn surface" aria-label="${STRINGS.cancel}" title="${STRINGS.cancel}"><span class="mes-icon icon-close" aria-hidden="true"></span><span class="btn-label">${STRINGS.cancel}</span></button>
            </div>
            <div id="blocker-secondary-actions" class="secondary-action-grid">
                <button id="blocker-copy-css" class="mb-btn secondary">${STRINGS.copyCss}</button>
                <button id="blocker-copy-rule" class="mb-btn secondary">${STRINGS.copyRule}</button>
                <button id="blocker-similar-rule" class="mb-btn secondary">${STRINGS.similarRule}</button>
                <button id="blocker-url" class="mb-btn secondary">${STRINGS.extractUrl}</button>
                <button id="blocker-inspect" class="mb-btn tertiary">${STRINGS.inspect}</button>
                <button id="blocker-list" class="mb-btn tertiary">${STRINGS.list}</button>
                <button id="blocker-settings" class="mb-btn tertiary">${STRINGS.settings}</button>
            </div>`;
		document.body.appendChild(panel);

		listPanel = document.createElement('div');
		listPanel.id = 'mobile-blocklist-panel';
		listPanel.className = 'mobile-block-ui';
		listPanel.innerHTML = `
            <h3 class="mb-panel-title">${STRINGS.listTitle}</h3>
            <div id="blocklist-summary"></div>
            <input id="blocklist-search" type="search" autocomplete="off" placeholder="${STRINGS.blocklistSearchPlaceholder}">
            <div id="blocklist-container"></div>
            <div class="button-grid" style="margin-top: 12px; grid-template-columns: 1fr 1fr;">
                <button id="blocklist-copy-site" class="mb-btn outline">${STRINGS.blocklistCopySite}</button>
                <button id="blocklist-copy-all" class="mb-btn outline">${STRINGS.blocklistCopyAll}</button>
                <button id="blocklist-prune-stale" class="mb-btn outline" style="grid-column: span 2;" hidden>${STRINGS.blocklistPruneStale}</button>
                <button id="blocklist-delete-site" class="mb-btn error" style="grid-column: span 2;">${STRINGS.blocklistDeleteSite}</button>
            </div>
            <button id="blocklist-close" class="mb-btn surface" style="width: 100%; margin-top: 15px;">${STRINGS.close}</button>`;
		document.body.appendChild(listPanel);

		inspectorPanel = document.createElement('div');
		inspectorPanel.id = 'mobile-inspector-panel';
		inspectorPanel.className = 'mobile-block-ui';
		inspectorPanel.innerHTML = `
            <h3 class="mb-panel-title">${STRINGS.inspectorTitle}</h3>
            <div class="inspector-tabs">
                <button class="mb-btn inspector-tab active" data-tab="element">요소</button>
                <button class="mb-btn inspector-tab" data-tab="code">코드</button>
                <button class="mb-btn inspector-tab" data-tab="page">페이지</button>
                <button class="mb-btn inspector-tab" data-tab="cookies">쿠키</button>
                <button class="mb-btn inspector-tab" data-tab="diagnostics">진단</button>
                <button class="mb-btn inspector-tab" data-tab="resources">리소스</button>
            </div>
            <div id="inspector-content"></div>
            <div class="button-grid" style="grid-template-columns: 1fr 1fr; margin-top: 12px;">
                <button id="inspector-copy" class="mb-btn outline">${STRINGS.copyInfo}</button>
                <button id="inspector-close" class="mb-btn surface">${STRINGS.close}</button>
            </div>`;
		document.body.appendChild(inspectorPanel);

		settingsPanel = document.createElement('div');
		settingsPanel.id = 'mobile-settings-panel';
		settingsPanel.className = 'mobile-block-ui';
		settingsPanel.innerHTML = `
            <h3 class="mb-panel-title">${STRINGS.settingsTitle}</h3>
            <div class="scrollable-container settings-layout settings-scroll">
            <div class="settings-section-title">기본</div>
            <div class="settings-item launcher-settings-item">
                 <label><span class="settings-label-text">${STRINGS.launcherModeLabel}</span></label>
                 <div class="launcher-mode-grid" role="radiogroup" aria-label="${STRINGS.launcherModeLabel}">
                     <button data-launcher-mode="button" class="mb-btn launcher-mode-btn" role="radio">${STRINGS.launcherButton}</button>
                     <button data-launcher-mode="gesture" class="mb-btn launcher-mode-btn" role="radio">${STRINGS.launcherGesture}</button>
                 </div>
                 <div id="gesture-detail-settings" class="gesture-detail-panel ${settings.hideToggleButton ? 'visible' : ''}">
                     <div class="gesture-detail-row">
                         <span class="gesture-detail-label">${STRINGS.gestureFingerCountLabel}</span>
                         <div class="gesture-option-grid" role="radiogroup" aria-label="${STRINGS.gestureFingerCountLabel}">
                             <button data-gesture-fingers="2" class="mb-btn gesture-option-btn gesture-finger-btn" role="radio">${STRINGS.gestureTwoFingers}</button>
                             <button data-gesture-fingers="3" class="mb-btn gesture-option-btn gesture-finger-btn" role="radio">${STRINGS.gestureThreeFingers}</button>
                         </div>
                     </div>
                     <div class="gesture-detail-row">
                         <span class="gesture-detail-label">${STRINGS.gestureTapCountLabel}</span>
                         <div class="gesture-option-grid" role="radiogroup" aria-label="${STRINGS.gestureTapCountLabel}">
                             <button data-gesture-taps="2" class="mb-btn gesture-option-btn gesture-tap-btn" role="radio">${STRINGS.gestureTwoTaps}</button>
                             <button data-gesture-taps="3" class="mb-btn gesture-option-btn gesture-tap-btn" role="radio">${STRINGS.gestureThreeTaps}</button>
                         </div>
                     </div>
                 </div>
            </div>
            <div class="settings-item">
                <label><span class="settings-label-text">${STRINGS.includeSiteNameLabel}</span>
                    <button id="settings-toggle-site" class="mb-btn mes-switch ${settings.includeSiteName ? 'active' : ''}" role="switch" aria-checked="${settings.includeSiteName}" aria-label="${STRINGS.includeSiteNameLabel}"><span class="switch-knob"></span></button>
                </label>
            </div>
            <div class="settings-item">
                <label><span class="settings-label-text">${STRINGS.useShieldIconLabel}</span>
                    <button id="settings-shield-icon" class="mb-btn mes-switch ${settings.showShieldIcon ? 'active' : ''}" role="switch" aria-checked="${settings.showShieldIcon}" aria-label="${STRINGS.useShieldIconLabel}"><span class="switch-knob"></span></button>
                </label>
            </div>
            <div class="settings-section-title">차단</div>
             <div class="settings-item">
                <label><span class="settings-label-text">${STRINGS.tempDisableLabel}</span>
                    <button id="settings-temp-disable" class="mb-btn mes-switch ${settings.tempBlockingDisabled ? 'active error' : ''}" role="switch" aria-checked="${settings.tempBlockingDisabled}" aria-label="${STRINGS.tempDisableLabel}"><span class="switch-knob"></span></button>
                </label>
            </div>
            <div class="settings-item">
                <label><span class="settings-label-text">${STRINGS.observeDomChangesLabel}</span>
                    <button id="settings-observe-dom" class="mb-btn mes-switch ${settings.observeDomChanges ? 'active' : ''}" role="switch" aria-checked="${settings.observeDomChanges}" aria-label="${STRINGS.observeDomChangesLabel}"><span class="switch-knob"></span></button>
                </label>
            </div>
            <div class="settings-section-title">고급</div>
            <div class="settings-item">
                <label><span class="settings-label-text">${STRINGS.shadowDomSupportLabel}</span>
                    <button id="settings-shadow-dom" class="mb-btn mes-switch ${settings.shadowDomSupport ? 'active' : ''}" role="switch" aria-checked="${settings.shadowDomSupport}" aria-label="${STRINGS.shadowDomSupportLabel}"><span class="switch-knob"></span></button>
                </label>
            </div>
            <div class="settings-item">
                <label><span class="settings-label-text">${STRINGS.selectorHintModeLabel}</span>
                    <button id="settings-selector-hints" class="mb-btn mes-switch ${settings.selectorHintMode ? 'active' : ''}" role="switch" aria-checked="${settings.selectorHintMode}" aria-label="${STRINGS.selectorHintModeLabel}"><span class="switch-knob"></span></button>
                </label>
            </div>
            <div class="settings-item">
                <label><span class="settings-label-text">${STRINGS.privacyModeLabel}</span>
                    <button id="settings-privacy-mode" class="mb-btn mes-switch ${settings.privacyMode ? 'active' : ''}" role="switch" aria-checked="${settings.privacyMode}" aria-label="${STRINGS.privacyModeLabel}"><span class="switch-knob"></span></button>
                </label>
            </div>
            <div class="settings-item">
                <label><span class="settings-label-text">${STRINGS.autoCloseAfterCopyLabel}</span>
                    <button id="settings-auto-close" class="mb-btn mes-switch ${settings.autoCloseAfterCopy ? 'active' : ''}" role="switch" aria-checked="${settings.autoCloseAfterCopy}" aria-label="${STRINGS.autoCloseAfterCopyLabel}"><span class="switch-knob"></span></button>
                </label>
            </div>
            <div class="settings-item">
                <label><span class="settings-label-text">${STRINGS.compactPickerModeLabel}</span>
                    <button id="settings-compact-picker" class="mb-btn mes-switch ${settings.compactPickerMode ? 'active' : ''}" role="switch" aria-checked="${settings.compactPickerMode}" aria-label="${STRINGS.compactPickerModeLabel}"><span class="switch-knob"></span></button>
                </label>
            </div>
            <div class="settings-section-title">UI</div>
            <div class="settings-item">
                 <label><span class="settings-label-text">${STRINGS.hideStrategyLabel}</span></label>
                 <div class="hide-strategy-grid">
                     <button data-hide-strategy="stylesheet" class="mb-btn hide-strategy-btn">${STRINGS.hideStrategyStylesheet}</button>
                     <button data-hide-strategy="display" class="mb-btn hide-strategy-btn">${STRINGS.hideStrategyDisplay}</button>
                     <button data-hide-strategy="visibility" class="mb-btn hide-strategy-btn">${STRINGS.hideStrategyVisibility}</button>
                     <button data-hide-strategy="opacity" class="mb-btn hide-strategy-btn">${STRINGS.hideStrategyOpacity}</button>
                 </div>
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
                <input id="settings-toggle-size" type="range" class="mb-slider" min="${TOGGLE_MIN_VISUAL_SCALE}" max="2.0" step="0.05" value="${settings.toggleSizeScale}" aria-label="Toggle Button Size">
            </div>
            <div class="settings-item">
                <label for="settings-toggle-opacity">
                    <span class="settings-label-text">${STRINGS.toggleOpacityLabel}</span>
                    <span id="toggle-opacity-value" class="settings-value">${settings.toggleOpacity.toFixed(2)}</span>
                </label>
                <input id="settings-toggle-opacity" type="range" class="mb-slider" min="0.1" max="1.0" step="0.05" value="${settings.toggleOpacity}" aria-label="Toggle Button Opacity">
            </div>
            <div class="settings-item">
                 <label><span class="settings-label-text">${STRINGS.togglePositionLabel}</span></label>
                 <div class="corner-selector-grid">
                     <button id="corner-tl" data-corner="top-left" class="mb-btn corner-btn">${STRINGS.posTopLeft}</button>
                     <button id="corner-tr" data-corner="top-right" class="mb-btn corner-btn">${STRINGS.posTopRight}</button>
                     <button id="corner-bl" data-corner="bottom-left" class="mb-btn corner-btn">${STRINGS.posBottomLeft}</button>
                     <button id="corner-br" data-corner="bottom-right" class="mb-btn corner-btn">${STRINGS.posBottomRight}</button>
                 </div>
            </div>
            <div class="settings-section-title">백업</div>
            <div class="button-grid" style="margin-top: 20px; grid-template-columns: 1fr 1fr;">
                 <button id="settings-backup" class="mb-btn outline">${STRINGS.backupLabel}</button>
                 <button id="settings-restore" class="mb-btn outline">${STRINGS.restoreLabel}</button>
                 <input type="file" id="settings-restore-input" accept=".json">
            </div>
            <div id="settings-legacy-import-item" class="settings-item legacy-import-item" hidden>
                <div class="legacy-import-card">
                    <div>
                        <div class="legacy-import-title">${STRINGS.legacyImportTitle}</div>
                        <div id="legacy-import-summary" class="legacy-import-summary"></div>
                    </div>
                    <button id="settings-legacy-import" class="mb-btn outline">${STRINGS.legacyImportButton}</button>
                </div>
            </div>
            </div>
            <button id="settings-close" class="mb-btn surface" style="width: 100%; margin-top: 20px;">${STRINGS.close}</button>
            <div class="settings-credit">${STRINGS.settingsCredit}</div>`;
		document.body.appendChild(settingsPanel);

		toggleBtn = document.createElement('button');
		toggleBtn.id = 'mobile-block-toggleBtn';
		toggleBtn.className = 'mobile-block-ui';
		toggleBtn.setAttribute('aria-label', 'Toggle Element Selector');
		document.body.appendChild(toggleBtn);

		updateCSSVariables();
		updateToggleIcon();
		applyToggleBtnPosition();
		setupUiSelfHealing();

		initRefsAndEvents();
		applyBlocking();
	}

	function showToast(message, type = 'info', duration = 3000, action = null) {
		if (!toastContainer) {
			console.warn(SCRIPT_ID, "Toast container not ready for message:", message);
			return;
		}
		const toast = document.createElement('div');
		toast.className = `mes-toast ${type}`;
		const messageNode = document.createElement('span');
		messageNode.className = 'mes-toast-message';
		messageNode.textContent = message;
		toast.appendChild(messageNode);

		let dismissed = false;
		const dismissToast = () => {
			if (dismissed) return;
			dismissed = true;
			toast.classList.remove('show');
			toast.addEventListener('transitionend', () => {
				try {
					toast.remove();
				} catch (e) {}
			}, {
				once: true
			});
			setTimeout(() => {
				try {
					toast.remove();
				} catch (e) {}
			}, 500);
		};

		if (action?.label && typeof action.onClick === 'function') {
			const actionButton = document.createElement('button');
			actionButton.type = 'button';
			actionButton.className = 'mes-toast-action';
			actionButton.textContent = action.label;
			actionButton.addEventListener('click', async (event) => {
				event.preventDefault();
				event.stopPropagation();
				actionButton.disabled = true;
				try {
					await action.onClick();
				} finally {
					dismissToast();
				}
			});
			toast.appendChild(actionButton);
		}
		toastContainer.appendChild(toast);

		void toast.offsetWidth;

		requestAnimationFrame(() => {
			toast.classList.add('show');
		});

		setTimeout(dismissToast, duration);
	}

	let selecting = false;
	let selectedEl = null;
	let initialTouchedElement = null;
	let isIsolationActive = false;
	const isolationElements = new Set();
	const isolationHosts = new Set();
	let touchStartX = 0,
		touchStartY = 0,
		touchMoved = false;
	const moveThreshold = 15;
	let blockedSelectorsCache = [];
	let disabledSelectorsCache = [];
	let disabledSelectorsLoaded = false;

	async function loadBlockedSelectors() {
		let stored = '[]';
		try {
			stored = await gmGetValue(BLOCKED_SELECTORS_KEY, '[]');
			const parsed = JSON.parse(stored);
			blockedSelectorsCache = Array.isArray(parsed) ? parsed : [];
			console.log(SCRIPT_ID, `Loaded ${blockedSelectorsCache.length} rules from storage.`);
			return blockedSelectorsCache;
		} catch (e) {
			console.error(SCRIPT_ID, `Error parsing blocked selectors from key '${BLOCKED_SELECTORS_KEY}', resetting. Stored value:`, stored, e);
			try {
				await gmSetValue(BLOCKED_SELECTORS_KEY, '[]');
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
			await gmSetValue(BLOCKED_SELECTORS_KEY, JSON.stringify(selectorsToSave));
			blockedSelectorsCache = [...selectorsToSave];
			const nextDisabled = disabledSelectorsCache.filter(rule => selectorsToSave.includes(rule));
			if (nextDisabled.length !== disabledSelectorsCache.length) {
				await saveDisabledSelectors(nextDisabled);
			}
			console.log(SCRIPT_ID, `Saved ${selectorsToSave.length} rules.`);
		} catch (e) {
			console.error(SCRIPT_ID, "Error saving blocked selectors to GM:", e);
			showToast(STRINGS.settingsSaveError, 'error');
		}
	}

	async function loadDisabledSelectors() {
		let stored = '[]';
		try {
			stored = await gmGetValue(DISABLED_SELECTORS_KEY, '[]');
			const parsed = JSON.parse(stored);
			disabledSelectorsCache = Array.isArray(parsed) ? parsed.filter(rule => typeof rule === 'string') : [];
			disabledSelectorsLoaded = true;
			return disabledSelectorsCache;
		} catch (e) {
			console.error(SCRIPT_ID, `Error parsing disabled selectors from key '${DISABLED_SELECTORS_KEY}', resetting. Stored value:`, stored, e);
			try {
				await gmSetValue(DISABLED_SELECTORS_KEY, '[]');
			} catch (resetError) {
				console.error(SCRIPT_ID, "Failed to reset disabled storage after parse error", resetError);
			}
			disabledSelectorsCache = [];
			disabledSelectorsLoaded = true;
			return [];
		}
	}

	async function saveDisabledSelectors(list) {
		const selectorsToSave = Array.from(new Set((Array.isArray(list) ? list : []).filter(rule => typeof rule === 'string' && blockedSelectorsCache.includes(rule))));
		try {
			await gmSetValue(DISABLED_SELECTORS_KEY, JSON.stringify(selectorsToSave));
			disabledSelectorsCache = selectorsToSave;
			disabledSelectorsLoaded = true;
		} catch (e) {
			console.error(SCRIPT_ID, "Error saving disabled selectors to GM:", e);
			showToast(STRINGS.settingsSaveError, 'error');
		}
	}

	function getActiveBlockRules() {
		const disabledSet = new Set(disabledSelectorsCache);
		return blockedSelectorsCache.filter(rule => !disabledSet.has(rule));
	}

	const originalStyleMap = new Map();
	const hiddenElements = new Set();
	const styleRuleNodes = new Set();
	const adoptedStyleHandles = [];
	let applyingBlocking = false;
	let pendingBlockingApply = false;
	let blockingGuardTimer = null;
	let blockGuardInterval = null;

	function rememberOriginalStyles(el) {
		if (!el || originalStyleMap.has(el)) return;
		originalStyleMap.set(el, {
			display: el.style.display || '',
			visibility: el.style.visibility || '',
			opacity: el.style.opacity || '',
			pointerEvents: el.style.pointerEvents || ''
		});
	}

	function applyHiddenStyle(el, strategy = settings.hideStrategy) {
		if (!el) return;
		rememberOriginalStyles(el);
		const effectiveStrategy = strategy === 'stylesheet' ? 'display' : strategy;

		if (effectiveStrategy === 'visibility') {
			el.style.removeProperty('display');
			el.style.setProperty('visibility', 'hidden', 'important');
			el.style.setProperty('pointer-events', 'none', 'important');
		} else if (effectiveStrategy === 'opacity') {
			el.style.removeProperty('display');
			el.style.setProperty('opacity', '0', 'important');
			el.style.setProperty('pointer-events', 'none', 'important');
		} else {
			el.style.setProperty('display', 'none', 'important');
		}

		hiddenElements.add(el);
	}

	function restoreHiddenElement(el) {
		if (!el) return;
		const originalStyle = originalStyleMap.get(el) || {};
		['display', 'visibility', 'opacity', 'pointerEvents'].forEach(prop => {
			const cssProp = prop === 'pointerEvents' ? 'pointer-events' : prop;
			const value = originalStyle[prop];
			if (value) {
				el.style.setProperty(cssProp, value, '');
			} else {
				el.style.removeProperty(cssProp);
			}
		});
		el.removeAttribute('data-mes-hidden');
		el.removeAttribute('data-mes-hide-strategy');
		hiddenElements.delete(el);
		originalStyleMap.delete(el);
	}

	function pruneHiddenElementRefs() {
		Array.from(hiddenElements).forEach(el => {
			if (!el?.isConnected) hiddenElements.delete(el);
		});
		Array.from(originalStyleMap.keys()).forEach(el => {
			if (!el?.isConnected) originalStyleMap.delete(el);
		});
	}

	function getStyleHideDeclaration(strategy = settings.hideStrategy) {
		if (strategy === 'visibility') return 'visibility: hidden !important; pointer-events: none !important;';
		if (strategy === 'opacity') return 'opacity: 0 !important; pointer-events: none !important;';
		return 'display: none !important;';
	}

	function getSheetSignature(sheet) {
		try {
			return Array.from(sheet?.cssRules || []).map(rule => rule.cssText).join('\n');
		} catch (e) {
			return '';
		}
	}

	function getNodeStyleSignature(node) {
		if (!node?.isConnected) return '';
		return getSheetSignature(node.sheet) || node.textContent.trim();
	}

	function isHiddenElementStillSuppressed(el) {
		if (!el?.isConnected) return true;
		try {
			const computed = window.getComputedStyle(el);
			if (settings.hideStrategy === 'visibility') return computed.visibility === 'hidden';
			if (settings.hideStrategy === 'opacity') return parseFloat(computed.opacity || '1') <= 0.01;
			return computed.display === 'none';
		} catch (e) {
			return true;
		}
	}

	function adoptedStyleHandlesIntact() {
		return adoptedStyleHandles.every(({ root, sheet, signature }) => {
			try {
				return Array.from(root?.adoptedStyleSheets || []).includes(sheet) &&
					getSheetSignature(sheet) === signature;
			} catch (e) {
				return false;
			}
		});
	}

	function styleRuleNodesIntact() {
		return Array.from(styleRuleNodes).every(node => {
			return node?.isConnected &&
				node.textContent.trim() &&
				getNodeStyleSignature(node) === node.dataset.mesStyleSignature;
		});
	}

	function blockingIntegrityNeedsRefresh() {
		if (settings.tempBlockingDisabled || applyingBlocking) return false;
		if (!blockedSelectorsCache.length && !hiddenElements.size && !styleRuleNodes.size && !adoptedStyleHandles.length) return false;
		if (settings.hideStrategy === 'stylesheet') {
			if (adoptedStyleHandles.length && !adoptedStyleHandlesIntact()) return true;
			if (styleRuleNodes.size && !styleRuleNodesIntact()) return true;
		}
		pruneHiddenElementRefs();
		return Array.from(hiddenElements).some(el => !isHiddenElementStillSuppressed(el));
	}

	function scheduleBlockingIntegrityCheck(delay = 90) {
		if (blockingGuardTimer || settings.tempBlockingDisabled) return;
		blockingGuardTimer = setTimeout(() => {
			blockingGuardTimer = null;
			if (blockingIntegrityNeedsRefresh()) {
				applyBlocking(false);
			}
		}, delay);
	}

	function escapeCssRuleSelector(selector) {
		return String(selector || '').trim();
	}

	function isMesOwnedStyleNode(node) {
		return node?.nodeType === 1 &&
			node.tagName === 'STYLE' &&
			node.id === STYLE_BLOCK_ID &&
			node.getAttribute(STYLE_BLOCK_OWNER_ATTR) === STYLE_BLOCK_OWNER_VALUE;
	}

	function isMesUiElement(el) {
		return !!(el?.nodeType === 1 && (el.classList?.contains('mobile-block-ui') || el.closest?.('.mobile-block-ui')));
	}

	function isSafeHideCandidate(el) {
		if (!el || el.nodeType !== 1) return false;
		if (el === document.documentElement || el === document.body) return false;
		if (isMesUiElement(el)) return false;
		return ![panel, settingsPanel, listPanel, inspectorPanel, toggleBtn].some(ui => ui && ui !== el && el.contains?.(ui));
	}

	function selectorHasSensitiveLiteral(selector) {
		if (!settings.privacyMode) return false;
		const text = String(selector || '');
		return /\[(?:[^\]=~|^$*]+\|)?(?:token|secret|session|auth|cookie|password|passwd|credential|api[-_]?key)[^\]]*=/i.test(text) ||
			/[A-Za-z0-9_-]{32,}/.test(text) ||
			/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
	}

	function scopeCssRuleSelector(selector) {
		const trimmed = escapeCssRuleSelector(selector);
		if (!trimmed || selectorHasSensitiveLiteral(trimmed)) return '';
		return `:where(${trimmed}):not(html):not(body):not(.mobile-block-ui):not(.mobile-block-ui *)`;
	}

	function getOwnedStyleNodes(root = document) {
		try {
			return Array.from(root.querySelectorAll?.(`style#${STYLE_BLOCK_ID}[${STYLE_BLOCK_OWNER_ATTR}="${STYLE_BLOCK_OWNER_VALUE}"]`) || []);
		} catch (e) {
			return [];
		}
	}

	function nodeTouchesOwnedBlockStyle(node) {
		if (!node) return false;
		if (isMesOwnedStyleNode(node)) return true;
		if (node.nodeType === Node.TEXT_NODE) return isMesOwnedStyleNode(node.parentNode);
		return node.nodeType === 1 && !!node.querySelector?.(`style#${STYLE_BLOCK_ID}[${STYLE_BLOCK_OWNER_ATTR}="${STYLE_BLOCK_OWNER_VALUE}"]`);
	}

	function ensureBlockStyleNode(root = document) {
		if (!root) return null;
		let node = getOwnedStyleNodes(root)[0] || null;
		if (!node) {
			node = document.createElement('style');
			node.id = STYLE_BLOCK_ID;
			node.setAttribute(STYLE_BLOCK_OWNER_ATTR, STYLE_BLOCK_OWNER_VALUE);
			const target = isShadowRoot(root) ? root : document.head || document.documentElement;
			target.appendChild(node);
		}
		styleRuleNodes.add(node);
		return node;
	}

	function clearStyleRuleNodes() {
		adoptedStyleHandles.forEach(({ root, sheet }) => {
			try {
				root.adoptedStyleSheets = Array.from(root.adoptedStyleSheets || []).filter(existingSheet => existingSheet !== sheet);
			} catch (e) {}
		});
		adoptedStyleHandles.length = 0;
		styleRuleNodes.forEach(node => {
			try {
				node.textContent = '';
				node.remove();
			} catch (e) {}
		});
		styleRuleNodes.clear();
		getOwnedStyleNodes(document).forEach(node => node.remove());
		collectOpenShadowRoots(document).forEach(root => getOwnedStyleNodes(root).forEach(node => node.remove()));
	}

	function isMesInternalNode(node) {
		if (!node || node.nodeType !== 1) return false;
		return isMesOwnedStyleNode(node) ||
			node.id === UI_STYLE_ID ||
			node.id === 'mes-isolation-style' ||
			node.id === 'mes-shadow-highlight-style' ||
			isMesUiElement(node);
	}

	function setBlockStyleText(root, cssText) {
		if (!root || !cssText) return false;
		if (typeof CSSStyleSheet === 'function') {
			try {
				const currentSheets = Array.from(root.adoptedStyleSheets || []);
				const sheet = new CSSStyleSheet();
				sheet.replaceSync(cssText);
				root.adoptedStyleSheets = [...currentSheets, sheet];
				adoptedStyleHandles.push({ root, sheet, signature: getSheetSignature(sheet) });
				return true;
			} catch (e) {}
		}
		const node = ensureBlockStyleNode(root);
		if (!node) return false;
		node.textContent = cssText;
		node.dataset.mesStyleSignature = getNodeStyleSignature(node) || cssText.trim();
		return true;
	}

	function restoreTrackedHiddenElements() {
		pruneHiddenElementRefs();
		Array.from(hiddenElements).forEach(el => restoreHiddenElement(el));
	}

	function buildStylesheetBuckets(rules, currentHostname = location.hostname) {
		const globalSelectors = [];
		const shadowBuckets = new Map();
		const fallbackSelectors = [];
		rules.forEach(rule => {
			if (!ruleAppliesToHost(rule, currentHostname)) return;
			const parts = getRuleParts(rule);
			if (!parts?.selector) return;
			const shadowScoped = parseShadowScopedSelector(parts.selector);
			if (shadowScoped) {
				const roots = new Set(getShadowRootsForHostChain(shadowScoped));
				roots.forEach(root => {
					const scopedSelector = scopeCssRuleSelector(shadowScoped.localSelector);
					try {
						if (!scopedSelector) throw new Error('Fallback selector required');
						root.querySelector(scopedSelector);
					} catch (e) {
						fallbackSelectors.push(parts.selector);
						return;
					}
					if (!shadowBuckets.has(root)) shadowBuckets.set(root, new Set());
					shadowBuckets.get(root).add(scopedSelector);
				});
				return;
			}
			const selector = scopeCssRuleSelector(parts.selector);
			try {
				if (!selector) throw new Error('Fallback selector required');
				document.querySelector(selector);
				globalSelectors.push(selector);
			} catch (e) {
				fallbackSelectors.push(parts.selector);
			}
		});
		return {
			globalSelectors: Array.from(new Set(globalSelectors)),
			shadowBuckets,
			fallbackSelectors: Array.from(new Set(fallbackSelectors))
		};
	}

	function applyStylesheetBlocking(rules, currentHostname = location.hostname) {
		clearStyleRuleNodes();
		restoreTrackedHiddenElements();
		const declaration = getStyleHideDeclaration(settings.hideStrategy);
		const buckets = buildStylesheetBuckets(rules, currentHostname);
		const shadowSelectorBuckets = new Map(buckets.shadowBuckets);
		let appliedCount = 0;
		if (buckets.globalSelectors.length) {
			if (setBlockStyleText(document, `${buckets.globalSelectors.join(',\n')} { ${declaration} }`)) {
				appliedCount += buckets.globalSelectors.length;
			}
			if (settings.shadowDomSupport) {
				collectOpenShadowRoots(document).forEach(root => {
					if (!shadowSelectorBuckets.has(root)) shadowSelectorBuckets.set(root, new Set());
					const selectorSet = shadowSelectorBuckets.get(root);
					buckets.globalSelectors.forEach(selector => selectorSet.add(selector));
				});
			}
		}
		shadowSelectorBuckets.forEach((selectorSet, root) => {
			const selectors = Array.from(selectorSet).filter(Boolean);
			if (!selectors.length) return;
			if (setBlockStyleText(root, `${selectors.join(',\n')} { ${declaration} }`)) {
				appliedCount += selectors.length;
			}
		});
		buckets.fallbackSelectors.forEach(selector => {
			try {
				const elements = querySelectorAllEverywhere(selector);
				let hidAny = false;
				elements.forEach(el => {
					if (!isSafeHideCandidate(el)) return;
					const isHiddenByScript = hiddenElements.has(el);
					const isNaturallyHidden = window.getComputedStyle(el).display === 'none';
					if (!isHiddenByScript && !isNaturallyHidden) {
						applyHiddenStyle(el, 'display');
						hidAny = true;
					}
				});
				if (hidAny) appliedCount++;
			} catch (e) {}
		});
		return appliedCount;
	}

	async function applyBlocking(showToastNotification = false, ruleOverride = null) {
		if (settings.tempBlockingDisabled) {
			console.log(SCRIPT_ID, "Blocking temporarily disabled. Skipping application.");
			disableAllBlocking(false);
			return 0;
		}
		if (applyingBlocking) {
			pendingBlockingApply = true;
			return 0;
		}
		applyingBlocking = true;

		try {
			console.log(SCRIPT_ID, "Applying block rules...");
			pruneHiddenElementRefs();
			if (blockedSelectorsCache.length === 0) {
				await loadBlockedSelectors();
			}
			if (!disabledSelectorsLoaded) {
				await loadDisabledSelectors();
			}

			const currentHostname = location.hostname;
			const activeBlockRules = Array.isArray(ruleOverride) ? ruleOverride : getActiveBlockRules();
			if (settings.hideStrategy === 'stylesheet') {
				const appliedCount = applyStylesheetBlocking(activeBlockRules, currentHostname);
				console.log(SCRIPT_ID, `Applied ${appliedCount} stylesheet rules.`);
				if (showToastNotification && appliedCount > 0 && !settings.tempBlockingDisabled) {
					showToast(STRINGS.blockingApplied(appliedCount), 'success', 2000);
				}
				return appliedCount;
			}

			clearStyleRuleNodes();
			let count = 0;
			let appliedCount = 0;
			const queryRoots = getQueryRoots(document);

			activeBlockRules.forEach(rule => {
				const parts = getRuleParts(rule);
				if (!parts) {
					console.warn(SCRIPT_ID, "Skipping invalid block rule format:", rule);
					return;
				}

				const cssSelector = parts.selector;

				if (!cssSelector) {
					console.warn(SCRIPT_ID, "Skipping rule with empty selector:", rule);
					return;
				}
				if (!ruleAppliesToHost(rule, currentHostname)) {
					return;
				}

				try {
					const elements = querySelectorAllEverywhere(cssSelector, document, queryRoots);
					elements.forEach(el => {
						const isHiddenByScript = hiddenElements.has(el) || el.hasAttribute('data-mes-hidden');
						const isNaturallyHidden = window.getComputedStyle(el).display === 'none';

						if (!isHiddenByScript && !isNaturallyHidden) {
							applyHiddenStyle(el);
							count++;
						} else if (isHiddenByScript) {
							if (!isHiddenElementStillSuppressed(el)) {
								applyHiddenStyle(el);
								count++;
							} else {
								rememberOriginalStyles(el);
							}
						}
					});
					if (elements.length > 0) appliedCount++;

				} catch (e) {}
			});

			if (count > 0) console.log(SCRIPT_ID, `Applied ${appliedCount} rules, hid ${count} new elements.`);
			else console.log(SCRIPT_ID, `Applied ${appliedCount} rules, no new elements needed hiding.`);

			if (showToastNotification && appliedCount > 0 && !settings.tempBlockingDisabled) {
				showToast(STRINGS.blockingApplied(appliedCount), 'success', 2000);
			}
			return appliedCount;
		} finally {
			applyingBlocking = false;
			if (pendingBlockingApply && !settings.tempBlockingDisabled) {
				pendingBlockingApply = false;
				setTimeout(() => applyBlocking(false), 80);
			}
		}
	}

	function disableAllBlocking(showToastNotification = true) {
		console.log(SCRIPT_ID, "Disabling all blocking rules temporarily...");
		clearStyleRuleNodes();
		pruneHiddenElementRefs();
		let restoredCount = 0;
		const elementsToRestore = new Set([
			...hiddenElements,
			...querySelectorAllEverywhere('[data-mes-hidden="true"]')
		]);
		elementsToRestore.forEach(el => {
			restoreHiddenElement(el);
			restoredCount++;
		});
		console.log(SCRIPT_ID, `Restored display for ${restoredCount} elements.`);
		if (showToastNotification) {
			showToast(STRINGS.tempBlockingOn, 'warning', 2500);
		}
	}

	async function enableAllBlocking(showToastNotification = true) {
		console.log(SCRIPT_ID, "Re-enabling blocking rules...");
		const appliedCount = await applyBlocking(false);
		if (showToastNotification && appliedCount > 0) {
			showToast(STRINGS.tempBlockingOff, 'success', 2000);
		} else if (showToastNotification) {
			showToast(STRINGS.tempBlockingOff, 'info', 1500);
		}
	}

	function updateToggleIcon() {
		if (!toggleBtn) return;
		if (settings.showShieldIcon) {
			toggleBtn.innerHTML = `<span class="toggle-icon toggle-icon-shield" aria-hidden="true"></span>`;
		} else {
			toggleBtn.innerHTML = `<span class="toggle-icon toggle-icon-plus" aria-hidden="true"></span>`;
		}
		toggleBtn.classList.toggle('selecting', selecting);
	}

	function generateSelector(el, maxDepth = 7, requireUnique = true) {
		if (!el || el.nodeType !== 1 || el.closest('.mobile-block-ui')) return '';
		const root = getSelectorRoot(el);
		const tagName = el.tagName.toLowerCase();

		if (el.id) {
			const id = el.id;
			const escapedId = cssEscape(id);
			if (!/^\d+$/.test(id) && id.length > 2 && !DYNAMIC_TOKEN_RE.test(id) && !id.includes(':')) {
				try {
					if (countSelectorMatches(`#${escapedId}`, root) === 1) {
						return `#${escapedId}`;
					}
				} catch (e) {}
			}
		}

		if (settings.selectorHintMode) {
			const attrSelector = getBestAttributePart(el, tagName, root, requireUnique);
			if (attrSelector) return attrSelector;
			const broadHint = getBroadSelectorHint(el, tagName, root);
			if (broadHint && (!requireUnique || countSelectorMatches(broadHint, root) === 1)) return broadHint;
		}

		const parts = [];
		let current = el;
		let depth = 0;

		while (current && current.tagName && depth < maxDepth) {
			const currentTagName = current.tagName.toLowerCase();
			if (currentTagName === 'body' || currentTagName === 'html') break;
			if (current.closest('.mobile-block-ui')) {
				current = getParentElement(current);
				continue;
			}

			let part = currentTagName;
			let addedSpecificity = false;

			if (settings.selectorHintMode) {
				const attrPart = getBestAttributePart(current, currentTagName, root, false);
				if (attrPart && (!requireUnique || countSelectorMatches(attrPart, root) === 1)) {
					part = attrPart;
					addedSpecificity = true;
				}
			}

			const stableClasses = addedSpecificity ? [] : getStableClasses(current);

			if (stableClasses.length > 0) {
				part += '.' + stableClasses.map(c => cssEscape(c)).join('.');
				addedSpecificity = true;
			}

			const parentElement = getSelectorParentElement(current, root);
			if (!addedSpecificity || (parentElement && !parentElement.closest('.mobile-block-ui'))) {
				const siblings = parentElement ? getChildElements(parentElement) : [];
				const sameTagSiblings = siblings.filter(sib => sib.tagName === current.tagName && !sib.closest('.mobile-block-ui'));

				if (sameTagSiblings.length > 1) {
					const index = sameTagSiblings.indexOf(current) + 1;
					if (index > 0) {
						part += `:nth-of-type(${index})`;
						addedSpecificity = true;
					}
				}
			}

			parts.unshift(part);

			if (requireUnique && parts.length > 0 && depth > 0) {
				const tempSelector = parts.join(' > ');
				try {
					if (countSelectorMatches(tempSelector, root) === 1) {
						console.log(SCRIPT_ID, `Unique selector found early: ${tempSelector}`);
						return tempSelector;
					}
				} catch (e) {}
			}

			current = getSelectorParentElement(current, root);
			depth++;
		}

		let finalSelector = parts.join(' > ');

		if (requireUnique && finalSelector) {
			try {
				const matchCount = countSelectorMatches(finalSelector, root);
				if (matchCount !== 1) {
					console.warn(SCRIPT_ID, `Generated selector "${finalSelector}" matches ${matchCount} elements. Trying parent recursively.`);
					const parentElement = getSelectorParentElement(el, root);
					if (parentElement && !parentElement.closest('.mobile-block-ui') && maxDepth > 0) {
						const parentSelector = generateSelector(parentElement, maxDepth - 1, false);
						if (parentSelector) {
							const combinedSelector = parentSelector + " > " + finalSelector;
							try {
								if (countSelectorMatches(combinedSelector, root) === 1) {
									console.log(SCRIPT_ID, `Using combined unique selector: ${combinedSelector}`);
									return combinedSelector;
								} else {
									console.warn(SCRIPT_ID, `Combined selector "${combinedSelector}" still not unique.`);
								}
							} catch (e) {}
						}
					}
					console.warn(SCRIPT_ID, `Could not guarantee uniqueness for: ${finalSelector}`);
					return finalSelector;
				}
			} catch (e) {
				console.error(SCRIPT_ID, `Error validating selector "${finalSelector}":`, e);
				return '';
			}
		}

		if (!finalSelector || finalSelector === 'body' || finalSelector === 'html') {
			return '';
		}

		return finalSelector;
	}

	function generateElementSelector(el, maxDepth = 7, requireUnique = true) {
		const localSelector = generateSelector(el, maxDepth, requireUnique);
		if (!localSelector) return '';
		return createShadowScopedSelector(el, localSelector);
	}

	function generateSimilarSelector(el) {
		const selector = generateElementSelector(el, 7, false);
		if (!selector) return '';
		const simplified = selector
			.replace(/:nth-of-type\(\d+\)/g, '')
			.replace(/\s+>\s+/g, ' > ')
			.trim();
		return simplified || selector;
	}

	function getResourceSelectorCandidate(el) {
		let current = el;
		for (let depth = 0; depth < 5 && current && current.nodeType === 1; depth++) {
			const tagName = current.tagName.toLowerCase();
			for (const attrName of RESOURCE_ATTRIBUTES) {
				const value = current.getAttribute?.(attrName);
				if (!value || value.length > 260) continue;
				try {
					const url = new URL(value, location.href);
					const fileName = url.pathname.split('/').filter(Boolean).pop();
					const token = fileName || url.hostname;
					if (token && token.length >= 4 && !DYNAMIC_TOKEN_RE.test(token)) {
						return createShadowScopedSelector(current, `${tagName}[${attrName}*="${escapeAttributeValue(token)}"]`);
					}
				} catch (e) {
					if (value.length >= 4 && !DYNAMIC_TOKEN_RE.test(value)) {
						return createShadowScopedSelector(current, `${tagName}[${attrName}*="${escapeAttributeValue(value.slice(0, 80))}"]`);
					}
				}
			}
			current = getParentElement(current);
		}
		return '';
	}

	function buildSelectorCandidates(el) {
		if (!el || el.nodeType !== 1) return [];
		const candidates = [];
		const seen = new Set();
		const root = getSelectorRoot(el);
		const tagName = el.tagName.toLowerCase();

		const addCandidate = (label, selector, intent) => {
			const cleanSelector = typeof selector === 'string' ? selector.trim() : '';
			if (!cleanSelector || seen.has(cleanSelector)) return;
			const quality = getSelectorQuality(cleanSelector, el);
			if (quality.matchCount <= 0) return;
			const risk = analyzeSelectorRisk(cleanSelector, el, quality);
			seen.add(cleanSelector);
			candidates.push({
				label,
				selector: cleanSelector,
				intent,
				matchCount: quality.matchCount,
				quality: quality.quality,
				qualityText: quality.text,
				risk
			});
		};

		const precise = generateElementSelector(el, 7, true);
		addCandidate('정밀', precise, '단일 요소 저장에 적합');
		addCandidate('패턴', generateSimilarSelector(el), '반복되는 카드나 광고 묶음에 적합');

		if (settings.selectorHintMode) {
			const attrSelector = getBestAttributePart(el, tagName, root, false);
			if (attrSelector) {
				addCandidate('속성', createShadowScopedSelector(el, attrSelector), '안정적인 속성 기반');
			}
			const broadHint = getBroadSelectorHint(el, tagName, root);
			if (broadHint) {
				addCandidate('힌트', createShadowScopedSelector(el, broadHint), '광고성 이름 패턴 기반');
			}
		}

		const stableClasses = getStableClasses(el);
		if (stableClasses.length) {
			addCandidate('클래스', createShadowScopedSelector(el, `${tagName}.${stableClasses.map(cssEscape).join('.')}`), '레이아웃 클래스 기반');
		}
		addCandidate('리소스', getResourceSelectorCandidate(el), 'URL 또는 미디어 속성 기반');

		return candidates.slice(0, 6);
	}

	function analyzeSelectorRisk(selector, el, quality = null) {
		const cleanSelector = typeof selector === 'string' ? selector.trim() : '';
		const selectorQuality = quality || (cleanSelector && el ? getSelectorQuality(cleanSelector, el) : null);
		const matchCount = selectorQuality?.matchCount ?? 0;
		const hasStableAttr = /#[A-Za-z0-9_-]+|\[(?:data-testid|data-test|data-cy|aria-label|role|alt|title|href|src)[\^\$\*~|]?=/i.test(cleanSelector);
		const hasPosition = /:nth-(?:of-type|child)\(/i.test(cleanSelector);
		const childDepth = (cleanSelector.match(/>/g) || []).length;
		const isComplex = cleanSelector.length > 180 || childDepth >= 5;
		const hasSelectorError = selectorQuality?.quality === 'error';

		if (!cleanSelector || matchCount === 0 || hasSelectorError) {
			return {
				level: 'error',
				label: STRINGS.selectorRiskError,
				reason: selectorQuality?.text || STRINGS.cannotGenerateSelector
			};
		}
		if (matchCount >= 8) {
			return {
				level: 'broad',
				label: STRINGS.selectorRiskBroad,
				reason: `${matchCount}개 요소 영향. 저장 전 미리보기 권장`
			};
		}
		if (matchCount > 1) {
			return {
				level: 'caution',
				label: STRINGS.selectorRiskBroad,
				reason: `${matchCount}개 요소를 함께 차단`
			};
		}
		if (hasPosition) {
			return {
				level: 'caution',
				label: STRINGS.selectorRiskPositional,
				reason: '페이지 구조 변경에 약할 수 있음'
			};
		}
		if (isComplex) {
			return {
				level: 'caution',
				label: STRINGS.selectorRiskComplex,
				reason: '긴 경로 기반이라 유지보수 주의'
			};
		}
		if (hasStableAttr) {
			return {
				level: 'safe',
				label: STRINGS.selectorRiskStable,
				reason: '고정 속성 기반 단일 매칭'
			};
		}
		return {
			level: 'safe',
			label: STRINGS.selectorRiskPrecise,
			reason: '현재 요소 단일 매칭'
		};
	}

	function confirmSelectorRiskIfNeeded(risk, alreadyConfirmedBroad = false) {
		if (!risk || risk.level === 'safe') return true;
		if (alreadyConfirmedBroad && risk.level === 'broad') return true;
		return confirm(STRINGS.confirmRiskSelector(risk.label, risk.reason));
	}

	function getSelectorQuality(selector, el) {
		const root = getSelectorRoot(el);
		const matchCount = countSelectorMatches(selector, root);
		let quality = 'error';
		let text = '선택자 오류';

		if (matchCount === 1) {
			quality = 'unique';
			text = '고유';
		} else if (matchCount > 1) {
			quality = 'warning';
			text = `${matchCount}개 일치`;
		} else if (matchCount === 0) {
			text = '일치 없음';
		}

		if (isShadowRoot(root)) {
			text += ' · Shadow DOM';
		}

		return {
			matchCount,
			quality,
			text
		};
	}

	function initRefsAndEvents() {
		const infoLabel = panel.querySelector('#blocker-info-label');
		const info = panel.querySelector('#blocker-info');
		const selectorMeta = panel.querySelector('#blocker-selector-meta');
		const slider = panel.querySelector('#blocker-slider');
		const navLabel = panel.querySelector('#blocker-nav-label');
		const parentBtn = panel.querySelector('#blocker-parent');
		const childBtn = panel.querySelector('#blocker-child');
		const moreBtn = panel.querySelector('#blocker-more');
		const secondaryActions = panel.querySelector('#blocker-secondary-actions');
		const copyCssBtn = panel.querySelector('#blocker-copy-css');
		const copyRuleBtn = panel.querySelector('#blocker-copy-rule');
		const similarRuleBtn = panel.querySelector('#blocker-similar-rule');
		const urlBtn = panel.querySelector('#blocker-url');
		const previewBtn = panel.querySelector('#blocker-preview');
		const addBtn = panel.querySelector('#blocker-add-block');
		const inspectBtn = panel.querySelector('#blocker-inspect');
		const listBtn = panel.querySelector('#blocker-list');
		const settingsBtn = panel.querySelector('#blocker-settings');
		const cancelBtn = panel.querySelector('#blocker-cancel');
		const compactToggleBtn = panel.querySelector('#blocker-compact-toggle');
		const compactSummary = panel.querySelector('#blocker-compact-summary');

		const listSummary = listPanel.querySelector('#blocklist-summary');
		const listSearch = listPanel.querySelector('#blocklist-search');
		const listContainer = listPanel.querySelector('#blocklist-container');
		const listCopySite = listPanel.querySelector('#blocklist-copy-site');
		const listCopyAll = listPanel.querySelector('#blocklist-copy-all');
		const listPruneStale = listPanel.querySelector('#blocklist-prune-stale');
		const listDeleteSite = listPanel.querySelector('#blocklist-delete-site');
		const listClose = listPanel.querySelector('#blocklist-close');

		const inspectorContent = inspectorPanel.querySelector('#inspector-content');
		const inspectorTabs = inspectorPanel.querySelectorAll('.inspector-tab');
		const inspectorCopy = inspectorPanel.querySelector('#inspector-copy');
		const inspectorClose = inspectorPanel.querySelector('#inspector-close');

		const settingsClose = settingsPanel.querySelector('#settings-close');
		const toggleSiteBtn = settingsPanel.querySelector('#settings-toggle-site');
		const shieldIconToggleBtn = settingsPanel.querySelector('#settings-shield-icon');
		const tempDisableBtn = settingsPanel.querySelector('#settings-temp-disable');
		const observeDomBtn = settingsPanel.querySelector('#settings-observe-dom');
		const shadowDomBtn = settingsPanel.querySelector('#settings-shadow-dom');
		const selectorHintsBtn = settingsPanel.querySelector('#settings-selector-hints');
		const privacyModeBtn = settingsPanel.querySelector('#settings-privacy-mode');
		const autoCloseBtn = settingsPanel.querySelector('#settings-auto-close');
		const compactPickerBtn = settingsPanel.querySelector('#settings-compact-picker');
		const launcherModeButtons = settingsPanel.querySelectorAll('.launcher-mode-btn');
		const gestureDetailSettings = settingsPanel.querySelector('#gesture-detail-settings');
		const gestureFingerButtons = settingsPanel.querySelectorAll('.gesture-finger-btn');
		const gestureTapButtons = settingsPanel.querySelectorAll('.gesture-tap-btn');
		const panelOpacitySlider = settingsPanel.querySelector('#settings-panel-opacity');
		const panelOpacityValue = settingsPanel.querySelector('#opacity-value');
		const toggleSizeSlider = settingsPanel.querySelector('#settings-toggle-size');
		const toggleSizeValue = settingsPanel.querySelector('#toggle-size-value');
		const toggleOpacitySlider = settingsPanel.querySelector('#settings-toggle-opacity');
		const toggleOpacityValue = settingsPanel.querySelector('#toggle-opacity-value');
		const cornerButtons = settingsPanel.querySelectorAll('.corner-btn');
		const hideStrategyButtons = settingsPanel.querySelectorAll('.hide-strategy-btn');
		const backupBtn = settingsPanel.querySelector('#settings-backup');
		const restoreBtn = settingsPanel.querySelector('#settings-restore');
		const restoreInput = settingsPanel.querySelector('#settings-restore-input');
		const legacyImportItem = settingsPanel.querySelector('#settings-legacy-import-item');
		const legacyImportSummary = settingsPanel.querySelector('#legacy-import-summary');
		const legacyImportBtn = settingsPanel.querySelector('#settings-legacy-import');

		let isPreviewHidden = false;
		let previewedElement = null;
		let pickerCompact = false;
		const candidatePreviewElements = new Set();
		let rulePreviewTimer = null;
		let rulePreviewActive = false;

		function setPickerCompact(compact) {
			pickerCompact = !!compact;
			panel.classList.toggle('compact-picker', pickerCompact);
			if (pickerCompact) {
				secondaryActions?.classList.remove('visible');
				moreBtn?.classList.remove('active');
			}
			if (compactToggleBtn) {
				compactToggleBtn.setAttribute('aria-label', pickerCompact ? STRINGS.expandPanel : STRINGS.minimizePanel);
				compactToggleBtn.title = pickerCompact ? STRINGS.expandPanel : STRINGS.minimizePanel;
				compactToggleBtn.innerHTML = `<span class="mes-icon ${pickerCompact ? 'icon-expand' : 'icon-minimize'}" aria-hidden="true"></span>`;
			}
		}

		function updateCompactSummary(labelText = '') {
			if (!compactSummary) return;
			panel.classList.toggle('has-selection', !!selectedEl);
			if (!selectedEl) {
				compactSummary.textContent = STRINGS.noElementSelected;
				return;
			}
			const tag = selectedEl.tagName.toLowerCase();
			const identity = selectedEl.id ? `#${selectedEl.id}` : getStableClasses(selectedEl).slice(0, 2).map(className => `.${className}`).join('');
			const compactLabel = labelText && labelText.includes(': ')
				? labelText.replace(': ', ' · ')
				: labelText;
			compactSummary.textContent = compactLabel || `${tag}${identity}`;
		}

		function updatePickerDocking() {
			if (!panel || panel.dataset.wasDragged === 'true') return;
			const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
			const rect = selectedEl?.getBoundingClientRect?.();
			const targetMidY = rect ? rect.top + rect.height / 2 : viewportHeight / 2;
			const dockTop = !!rect && (targetMidY > viewportHeight * 0.54 || rect.bottom > viewportHeight - 180);
			panel.classList.toggle('dock-top', dockTop);
			panel.classList.toggle('dock-bottom', !dockTop);
			panel.style.left = '50%';
			panel.style.right = 'auto';
			panel.style.top = '';
			panel.style.bottom = '';
			panel.style.transform = '';
		}

		function removeSelectionHighlight() {
			clearIsolation();
			void clearRulePreview(true);
			if (selectedEl) {
				clearSelectionHighlight(selectedEl);
			}
			selectedEl = null;
			if (slider) slider.value = 0;
			if (info) info.textContent = '';
			if (selectorMeta) selectorMeta.innerHTML = '';
			if (navLabel) navLabel.textContent = '';
			updateCompactSummary();
		}

		function resetPreview() {
			void clearRulePreview(true);
			if (isPreviewHidden && previewedElement) {
				try {
					restoreHiddenElement(previewedElement);
					if (previewedElement === selectedEl) {
						applySelectionHighlight(previewedElement);
					}
				} catch (e) {
					console.warn(SCRIPT_ID, "Error resetting preview style:", e)
				}
			}
			if (previewBtn) {
				const label = previewBtn.querySelector('.btn-label');
				if (label) label.textContent = STRINGS.preview;
				else previewBtn.textContent = STRINGS.preview;
				previewBtn.setAttribute('aria-label', STRINGS.preview);
				previewBtn.title = STRINGS.preview;
				previewBtn.classList.remove('tertiary');
				previewBtn.classList.add('secondary');
			}
			isPreviewHidden = false;
			previewedElement = null;
		}

		function clearCandidatePreview() {
			candidatePreviewElements.forEach(el => {
				el?.classList?.remove(CANDIDATE_PREVIEW_CLASS);
			});
			candidatePreviewElements.clear();
		}

		async function clearRulePreview(reapply = true) {
			if (rulePreviewTimer) {
				clearTimeout(rulePreviewTimer);
				rulePreviewTimer = null;
			}
			const wasActive = rulePreviewActive;
			rulePreviewActive = false;
			clearCandidatePreview();
			if (wasActive && reapply) {
				await applyBlocking(false);
			}
		}

		function previewSelectorCandidate(selector) {
			clearCandidatePreview();
			if (!selector) return 0;
			const matches = querySelectorAllEverywhere(selector).filter(el => el && !el.closest?.('.mobile-block-ui'));
			matches.slice(0, 80).forEach(el => {
				ensureElementHighlightStyle(el);
				el.classList.add(CANDIDATE_PREVIEW_CLASS);
				candidatePreviewElements.add(el);
			});
			return matches.length;
		}

		async function previewSavedRule(rule) {
			const parts = getRuleParts(rule);
			if (!parts?.selector || !ruleAppliesToHost(rule)) {
				showToast(STRINGS.rulePreviewUnavailable, 'info', 1800);
				return 0;
			}
			await clearRulePreview(false);
			await loadDisabledSelectors();
			const activeRulesWithoutPreview = getActiveBlockRules().filter(activeRule => activeRule !== rule);
			rulePreviewActive = true;
			await applyBlocking(false, activeRulesWithoutPreview);
			const matches = querySelectorAllEverywhere(parts.selector).filter(el => el && !el.closest?.('.mobile-block-ui'));
			matches.slice(0, 80).forEach(el => {
				ensureElementHighlightStyle(el);
				el.classList.add(CANDIDATE_PREVIEW_CLASS);
				candidatePreviewElements.add(el);
			});
			if (!matches.length) {
				await clearRulePreview(true);
				showToast(STRINGS.blocklistNoMatch, 'info', 1800);
				return 0;
			}
			rulePreviewTimer = setTimeout(() => {
				clearRulePreview(true);
			}, 4500);
			showToast(STRINGS.rulePreviewApplied(matches.length), 'info', 4500, {
				label: STRINGS.clearPreviewAction,
				onClick: () => clearRulePreview(true)
			});
			return matches.length;
		}

		function updateInfo() {
			if (!info) return;
			const selectorText = selectedEl ? generateElementSelector(selectedEl, 7, false) : '';
			info.textContent = selectorText;
			if (selectorMeta) {
				selectorMeta.innerHTML = '';
				if (selectedEl && selectorText) {
					const quality = getSelectorQuality(selectorText, selectedEl);
					const qualityChip = document.createElement('span');
					qualityChip.className = `selector-chip ${quality.quality}`;
					qualityChip.textContent = quality.text;
					selectorMeta.appendChild(qualityChip);

					const risk = analyzeSelectorRisk(selectorText, selectedEl, quality);
					const riskChip = document.createElement('span');
					riskChip.className = `selector-chip ${risk.level}`;
					riskChip.textContent = risk.label;
					riskChip.title = risk.reason;
					selectorMeta.appendChild(riskChip);

					const tagChip = document.createElement('span');
					tagChip.className = 'selector-chip';
					tagChip.textContent = selectedEl.tagName.toLowerCase();
					selectorMeta.appendChild(tagChip);

					const urlValue = findNearestUrl(selectedEl);
					if (urlValue) {
						const urlChip = document.createElement('span');
						urlChip.className = 'selector-chip';
						urlChip.textContent = 'URL 있음';
						selectorMeta.appendChild(urlChip);
					}
				}
			}
			infoLabel.style.display = 'block';
			updateCompactSummary();
		}

		function isNavigationCandidate(el) {
			if (!el || el.nodeType !== 1 || el.closest?.('.mobile-block-ui')) return false;
			try {
				const style = window.getComputedStyle(el);
				if (style.display === 'none' || style.visibility === 'hidden') return false;
				const rect = el.getBoundingClientRect();
				return rect.width >= 4 && rect.height >= 4;
			} catch (e) {
				return true;
			}
		}

		function getNavigationDescendants(originEl, maxDepth = 3, limit = 12) {
			if (!originEl || limit <= 0) return [];
			const result = [];
			const queue = getChildElements(originEl).map(child => ({ el: child, depth: 1 }));
			while (queue.length && result.length < limit) {
				const { el, depth } = queue.shift();
				if (!el || el === originEl || el.closest?.('.mobile-block-ui')) continue;
				if (depth < maxDepth) {
					getChildElements(el).forEach(child => queue.push({ el: child, depth: depth + 1 }));
				}
				if (!isNavigationCandidate(el)) continue;
				result.push(el);
			}
			return result;
		}

		function getDescendantDepth(el, originEl) {
			if (!el || !originEl || el === originEl) return 0;
			let current = el;
			let depth = 0;
			while (current && current !== originEl && depth < 12) {
				current = getParentElement(current);
				depth += 1;
			}
			return current === originEl ? depth : 0;
		}

		function buildNavigationItems(originEl) {
			if (!originEl) return [];
			const parents = [];
			let current = originEl;
			while (current && current.nodeType === 1) {
				parents.unshift(current);
				const parent = getParentElement(current);
				if (!parent || ['body', 'html'].includes(parent.tagName?.toLowerCase()) || parent.closest?.('.mobile-block-ui')) break;
				current = parent;
			}
			const seen = new Set(parents);
			const descendants = getNavigationDescendants(originEl).filter(child => {
				if (seen.has(child)) return false;
				seen.add(child);
				return true;
			});
			return [...parents, ...descendants];
		}

		function getElementLabel(el, originEl, items = null) {
			if (!el) return '';
			const tag = el.tagName.toLowerCase();
			const suffix = el.id ? `#${el.id}` : getStableClasses(el).length ? `.${getStableClasses(el).join('.')}` : '';
			const navItems = items || buildNavigationItems(originEl);
			const originIndex = navItems.indexOf(originEl);
			const currentIndex = navItems.indexOf(el);
			if (currentIndex >= 0 && originIndex >= 0) {
				if (currentIndex === originIndex) return `${STRINGS.navRoot}: ${tag}${suffix}`;
				if (currentIndex < originIndex) return `${STRINGS.navParent} ${originIndex - currentIndex}단계: ${tag}${suffix}`;
				return `${STRINGS.navChild} ${getDescendantDepth(el, originEl) || currentIndex - originIndex}단계: ${tag}${suffix}`;
			}
			if (el === originEl) return `${STRINGS.navRoot}: ${tag}${suffix}`;
			if (getParentElement(el) === originEl) return `${STRINGS.navChild}: ${tag}${suffix}`;
			return `${STRINGS.navParent}: ${tag}${suffix}`;
		}

		function refreshNavigationSlider() {
			if (!slider || !initialTouchedElement) {
				if (navLabel) navLabel.textContent = '';
				if (parentBtn) parentBtn.disabled = true;
				if (childBtn) childBtn.disabled = true;
				if (slider) slider.disabled = true;
				updateCompactSummary();
				return;
			}
			const items = buildNavigationItems(initialTouchedElement);
			const currentIndex = Math.max(0, items.indexOf(selectedEl));
			slider.min = 0;
			slider.max = Math.max(items.length - 1, 0);
			slider.value = currentIndex;
			slider.disabled = items.length <= 1;
			const progress = items.length > 1 ? (currentIndex / (items.length - 1)) * 100 : 50;
			slider.style.setProperty('--nav-progress', `${progress}%`);
			const labelText = items.length ? getElementLabel(items[currentIndex], initialTouchedElement, items) : '';
			slider.setAttribute('aria-valuetext', labelText);
			if (parentBtn) parentBtn.disabled = currentIndex <= 0;
			if (childBtn) childBtn.disabled = currentIndex >= items.length - 1;
			if (navLabel) {
				navLabel.textContent = items.length ? `${labelText} · ${currentIndex + 1}/${items.length}` : '';
			}
			updateCompactSummary(labelText);
		}

		function moveNavigation(delta) {
			if (!initialTouchedElement) {
				if (!selectedEl) return;
				initialTouchedElement = selectedEl;
			}
			const items = buildNavigationItems(initialTouchedElement);
			if (!items.length) return;
			const currentIndex = Math.max(0, items.indexOf(selectedEl));
			const nextIndex = Math.min(items.length - 1, Math.max(0, currentIndex + delta));
			const next = items[nextIndex];
			if (next && next !== selectedEl) {
				selectElement(next, true);
			}
		}

		function selectElement(el, keepOrigin = false) {
			if (!el || el.nodeType !== 1 || el.closest('.mobile-block-ui')) return;
			removeSelectionHighlight();
			resetPreview();
			selectedEl = el;
			if (!keepOrigin || !initialTouchedElement) {
				initialTouchedElement = el;
			}
			applySelectionHighlight(selectedEl);
			updatePickerDocking();
			updateInfo();
			refreshNavigationSlider();
			if (settings.compactPickerMode && !keepOrigin) {
				setPickerCompact(true);
			}
		}

		let activePanel = null;

		function setPanelVisibility(panelElement, visible) {
			if (!panelElement) return;

			const schedulePanelHide = (targetPanel) => {
				const hideToken = `${Date.now()}-${Math.random()}`;
				targetPanel.dataset.hideToken = hideToken;
				const transitionEndHandler = () => {
					if (!targetPanel.classList.contains('visible') && targetPanel.dataset.hideToken === hideToken) {
						targetPanel.style.display = 'none';
					}
					targetPanel.removeEventListener('transitionend', transitionEndHandler);
				};
				targetPanel.addEventListener('transitionend', transitionEndHandler);
				setTimeout(() => {
					if (!targetPanel.classList.contains('visible') && targetPanel.dataset.hideToken === hideToken) {
						targetPanel.style.display = 'none';
					}
					targetPanel.removeEventListener('transitionend', transitionEndHandler);
				}, 350);
			};

			if (visible) {
				delete panelElement.dataset.hideToken;
				[panel, settingsPanel, listPanel, inspectorPanel].forEach(p => {
					if (p && p !== panelElement && p.classList.contains('visible')) {
						p.classList.remove('visible');
						schedulePanelHide(p);
					}
				});

				activePanel = panelElement;
				visibleUiPanel = panelElement;
				panelElement.style.display = panelElement === settingsPanel ? 'flex' : 'block';
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						panelElement.classList.add('visible');
					});
				});
			} else {
				if (activePanel === panelElement) activePanel = null;
				if (visibleUiPanel === panelElement) visibleUiPanel = null;
				panelElement.classList.remove('visible');
				schedulePanelHide(panelElement);
			}
		}

		async function addBlockRule(selector) {
			console.log('[addBlockRule] Attempting for selector:', selector);
			if (!selector) {
				return {
					success: false,
					message: STRINGS.cannotGenerateSelector
				};
			}

			let fullSelector = "##" + selector;
			if (settings.includeSiteName) {
				const hostname = location.hostname;
				if (!hostname) {
					console.error(SCRIPT_ID, "Could not get location.hostname");
					return {
						success: false,
						message: '호스트 이름을 가져올 수 없습니다.'
					};
				}
				fullSelector = hostname + fullSelector;
			}

			if (blockedSelectorsCache.includes(fullSelector)) {
				console.log(SCRIPT_ID, "Rule already exists:", fullSelector);
				return {
					success: false,
					message: STRINGS.ruleExists
				};
			}

			const updatedList = [...blockedSelectorsCache, fullSelector];
			await saveBlockedSelectors(updatedList);

			console.log(SCRIPT_ID, "Rule added:", fullSelector);
			return {
				success: true,
				rule: fullSelector
			};
		}

		async function undoBlockRule(rule) {
			if (!rule) {
				showToast(STRINGS.ruleUndoUnavailable, 'info', 1800);
				return false;
			}
			try {
				const currentRules = await loadBlockedSelectors();
				if (!currentRules.includes(rule)) {
					showToast(STRINGS.ruleUndoUnavailable, 'info', 1800);
					return false;
				}
				await saveBlockedSelectors(currentRules.filter(savedRule => savedRule !== rule));
				disableAllBlocking(false);
				await applyBlocking(false);
				if (activePanel === listPanel) await showList();
				showToast(STRINGS.ruleUndoComplete, 'success', 1800);
				return true;
			} catch (error) {
				console.error(SCRIPT_ID, 'Failed to undo rule:', error);
				showToast(STRINGS.ruleUndoFailed, 'error', 2500);
				return false;
			}
		}

		function showRuleSavedToast(message, type, duration, rule) {
			showToast(message, type, duration, rule ? {
				label: STRINGS.undoAction,
				onClick: () => undoBlockRule(rule)
			} : null);
		}

		function getRuleListMeta(rule, disabled) {
			const parts = getRuleParts(rule);
			const selector = parts?.selector || rule;
			const appliesHere = !!parts && ruleAppliesToHost(rule);
			const isGlobal = !!parts && (!parts.domain || parts.domain === '*');
			let matchCount = null;
			if (!disabled && appliesHere && parts?.selector) {
				try {
					matchCount = querySelectorAllEverywhere(parts.selector).length;
				} catch (e) {
					matchCount = 0;
				}
			}
			return {
				selector,
				scopeText: isGlobal ? STRINGS.blocklistScopeGlobal : appliesHere ? STRINGS.blocklistScopeCurrent : STRINGS.blocklistScopeOther,
				scopeClass: appliesHere ? 'current' : '',
				matchText: disabled ? STRINGS.blocklistDisabledChip : matchCount === null ? '' : matchCount ? STRINGS.blocklistMatches(matchCount) : STRINGS.blocklistNoMatch,
				matchClass: disabled ? 'disabled' : matchCount > 0 ? 'match' : matchCount === 0 ? 'nomatch' : ''
			};
		}

		function getCurrentSiteStaleRules(rules, disabledSet = new Set()) {
			return (Array.isArray(rules) ? rules : []).filter(rule => {
				if (disabledSet.has(rule) || !isSiteSpecificRuleForHost(rule)) return false;
				const parts = getRuleParts(rule);
				if (!parts?.selector) return false;
				try {
					return querySelectorAllEverywhere(parts.selector).length === 0;
				} catch (e) {
					return false;
				}
			});
		}

		async function showList() {
			console.log('[showList] Function called');
			try {
				const arr = await loadBlockedSelectors();
				await loadDisabledSelectors();
				const disabledSet = new Set(disabledSelectorsCache);
				console.log(`[showList] Rendering ${arr.length} rules.`);
				listContainer.innerHTML = '';
				const activeRules = arr.filter(rule => !disabledSet.has(rule));
				const currentSiteRules = activeRules.filter(rule => ruleAppliesToHost(rule));
				const staleSiteRules = getCurrentSiteStaleRules(arr, disabledSet);
				if (listSummary) {
					listSummary.textContent = STRINGS.blocklistSummary(arr.length, currentSiteRules.length, disabledSelectorsCache.length);
				}
				if (listPruneStale) {
					listPruneStale.hidden = staleSiteRules.length === 0;
					listPruneStale.textContent = staleSiteRules.length ? `${STRINGS.blocklistPruneStale} ${staleSiteRules.length}` : STRINGS.blocklistPruneStale;
				}
				const filterText = (listSearch?.value || '').trim().toLowerCase();
				const visibleRules = filterText ? arr.filter(rule => rule.toLowerCase().includes(filterText)) : arr;

				if (arr.length === 0) {
					listContainer.innerHTML = `<p id="blocklist-empty">${STRINGS.noRules}</p>`;
				} else if (visibleRules.length === 0) {
					listContainer.innerHTML = `<p id="blocklist-empty">${STRINGS.noMatchingRules}</p>`;
				} else {
					visibleRules.forEach((rule, index) => {
						const disabled = disabledSet.has(rule);
						const item = document.createElement('div');
						item.className = 'blocklist-item';
						item.classList.toggle('disabled-rule', disabled);

						const meta = getRuleListMeta(rule, disabled);
						const ruleBlock = document.createElement('div');
						ruleBlock.className = 'blocklist-rule';
						ruleBlock.title = rule;
						ruleBlock.role = 'button';
						ruleBlock.tabIndex = 0;
						ruleBlock.setAttribute('aria-label', `${STRINGS.preview} ${rule}`);
						const handleRulePreview = () => {
							previewSavedRule(rule);
						};
						ruleBlock.addEventListener('click', handleRulePreview);
						ruleBlock.addEventListener('keydown', event => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								handleRulePreview();
							}
						});

						const selectorText = document.createElement('div');
						selectorText.className = 'blocklist-rule-selector';
						selectorText.textContent = meta.selector;

						const metaRow = document.createElement('div');
						metaRow.className = 'blocklist-rule-meta';
						const scopeChip = document.createElement('span');
						scopeChip.className = `blocklist-chip ${meta.scopeClass}`.trim();
						scopeChip.textContent = meta.scopeText;
						metaRow.appendChild(scopeChip);
						if (meta.matchText) {
							const matchChip = document.createElement('span');
							matchChip.className = `blocklist-chip ${meta.matchClass}`.trim();
							matchChip.textContent = meta.matchText;
							metaRow.appendChild(matchChip);
						}
						ruleBlock.append(selectorText, metaRow);

						const controlsDiv = document.createElement('div');
						controlsDiv.className = 'blocklist-controls';

						const copyButton = document.createElement('button');
						copyButton.className = 'mb-btn blocklist-btn blocklist-btn-copy';
						copyButton.textContent = STRINGS.copy;
						copyButton.title = '규칙 복사';
						copyButton.addEventListener('click', () => {
							if (copyToClipboard(rule)) {
								showToast(STRINGS.ruleCopied, 'success', 2000);
							} else {
								showToast(STRINGS.clipboardError, 'error');
							}
						});

						const toggleButton = document.createElement('button');
						toggleButton.className = 'mb-btn blocklist-btn blocklist-btn-toggle';
						toggleButton.textContent = disabled ? STRINGS.blocklistEnable : STRINGS.blocklistDisable;
						toggleButton.title = disabled ? STRINGS.ruleEnabled : STRINGS.ruleDisabled;
						toggleButton.addEventListener('click', async () => {
							const nextDisabled = disabledSet.has(rule) ?
								disabledSelectorsCache.filter(disabledRule => disabledRule !== rule) :
								[...disabledSelectorsCache, rule];
							await saveDisabledSelectors(nextDisabled);
							disableAllBlocking(false);
							await applyBlocking(false);
							await showList();
							showToast(disabledSet.has(rule) ? STRINGS.ruleEnabled : STRINGS.ruleDisabled, 'info', 1600);
						});

						const deleteButton = document.createElement('button');
						deleteButton.className = 'mb-btn blocklist-btn blocklist-btn-delete';
						deleteButton.textContent = '삭제';
						deleteButton.title = '규칙 삭제';
						deleteButton.addEventListener('click', async () => {
							console.log('[showList] Delete button clicked for rule:', rule);
							try {
								const currentIndex = blockedSelectorsCache.indexOf(rule);
								if (currentIndex > -1) {
									blockedSelectorsCache.splice(currentIndex, 1);
									await saveBlockedSelectors(blockedSelectorsCache);

									item.style.opacity = '0';
									item.style.transform = 'translateX(20px) scale(0.95)';
									setTimeout(async () => {
										disableAllBlocking(false);
										await applyBlocking(false);
										await showList();
										showToast(STRINGS.ruleDeleted, 'info', 2000);
									}, 300);

								} else {
									console.warn("Rule not found in cache for deletion:", rule);
									showToast(STRINGS.ruleDeleteError, 'error');
									await showList();
								}
							} catch (deleteError) {
								console.error(SCRIPT_ID, "Error deleting rule:", deleteError);
								showToast(STRINGS.ruleDeleteError, 'error');
							}
						});

						controlsDiv.append(copyButton, toggleButton, deleteButton);
						item.append(ruleBlock, controlsDiv);
						listContainer.append(item);
					});
				}
				console.log('[showList] Rendering list panel.');
				setPanelVisibility(listPanel, true);

			} catch (error) {
				console.error(SCRIPT_ID, "Error in showList:", error);
				showToast(STRINGS.listShowError, 'error');
				setPanelVisibility(listPanel, false);
			}
		}

		function applyGradientMask(container) {
			if (!container) return;
			const updateMask = () => {
				const {
					scrollTop,
					scrollHeight,
					clientHeight
				} = container;
				const isAtTop = scrollTop <= 0;
				const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
				if (isAtTop && isAtBottom) {
					container.style.webkitMaskImage = 'none';
					container.style.maskImage = 'none';
				} else if (isAtTop) {
					container.style.webkitMaskImage = `linear-gradient(to bottom, black 0%, black 90%, transparent 100%)`;
					container.style.maskImage = container.style.webkitMaskImage;
				} else if (isAtBottom) {
					container.style.webkitMaskImage = `linear-gradient(to bottom, transparent 0%, black 10%, black 100%)`;
					container.style.maskImage = container.style.webkitMaskImage;
				} else {
					container.style.webkitMaskImage = `linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)`;
					container.style.maskImage = container.style.webkitMaskImage;
				}
			};

			container.addEventListener('scroll', updateMask);
			requestAnimationFrame(updateMask);
		}

		function escapeHtml(value) {
			return String(value ?? '').replace(/[&<>"']/g, char => ({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;'
			})[char]);
		}

		function formatElementSummary(el) {
			if (!el) return '';
			const selector = generateElementSelector(el, 7, false);
			const quality = selector ? getSelectorQuality(selector, el) : null;
			const risk = selector ? analyzeSelectorRisk(selector, el, quality) : null;
			const similar = generateSimilarSelector(el);
			const url = findNearestUrl(el);
			const attrs = Array.from(el.attributes || [])
				.filter(attr => !attr.name.startsWith('data-mes') && attr.value.length <= 200)
				.slice(0, 20)
				.map(attr => `${attr.name}="${attr.value}"`)
				.join('\n');
			return [
				`태그: ${el.tagName.toLowerCase()}`,
				selector ? `선택자: ${selector}` : '선택자: 없음',
				quality ? `매칭: ${quality.text}` : '',
				risk ? `품질: ${risk.label} - ${risk.reason}` : '',
				similar && similar !== selector ? `유사 선택자: ${similar}` : '',
				url ? `URL: ${url}` : '',
				attrs ? `속성:\n${attrs}` : ''
			].filter(Boolean).join('\n');
		}

		function getFormattedOuterHtml(el) {
			if (!el) return '';
			const clone = el.cloneNode(true);
			clone.classList?.remove(HIGHLIGHT_CLASS, CANDIDATE_PREVIEW_CLASS, ISOLATE_PATH_CLASS, ISOLATE_TARGET_CLASS, ISOLATE_HOST_CLASS);
			clone.querySelectorAll?.(`.${HIGHLIGHT_CLASS}, .${CANDIDATE_PREVIEW_CLASS}, .${ISOLATE_PATH_CLASS}, .${ISOLATE_TARGET_CLASS}, .${ISOLATE_HOST_CLASS}, .mobile-block-ui`).forEach(node => {
				if (node.classList?.contains('mobile-block-ui')) node.remove();
				else node.classList?.remove(HIGHLIGHT_CLASS, CANDIDATE_PREVIEW_CLASS, ISOLATE_PATH_CLASS, ISOLATE_TARGET_CLASS, ISOLATE_HOST_CLASS);
			});
			const raw = clone.outerHTML || '';
			let indent = 0;
			let formatted = '';
			raw.split(/(?=<)/).forEach(part => {
				const trimmed = part.trim();
				if (!trimmed) return;
				if (trimmed.startsWith('</')) indent = Math.max(indent - 1, 0);
				formatted += `${'  '.repeat(indent)}${trimmed}\n`;
				if (/^<[^/!][^>]*[^/]>\s*$/.test(trimmed) && !/^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i.test(trimmed)) {
					indent++;
				}
			});
			return formatted.trim();
		}

		function getComputedStyleSummary(el) {
			if (!el) return '';
			try {
				const computed = window.getComputedStyle(el);
				const props = ['display', 'position', 'z-index', 'width', 'height', 'margin', 'padding', 'background-color', 'color', 'font-size', 'line-height', 'overflow', 'opacity', 'visibility', 'pointer-events'];
				return props.map(prop => `${prop}: ${computed.getPropertyValue(prop) || '(empty)'};`).join('\n');
			} catch (e) {
				return '';
			}
		}

		function getInlineScriptHints(el) {
			if (!el) return '인라인 이벤트 없음';
			const hints = [];
			Array.from(el.attributes || []).forEach(attr => {
				if (attr.name.startsWith('on')) hints.push(`${attr.name}="${attr.value}"`);
			});
			const tokens = [el.id, ...Array.from(el.classList || [])].filter(token => token && token.length > 2 && !VOLATILE_CLASS_RE.test(token)).slice(0, 5);
			if (tokens.length) {
				const pattern = new RegExp(tokens.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
				Array.from(document.scripts).forEach((script, index) => {
					if (!script.src && pattern.test(script.textContent || '')) {
						hints.push(`inline script #${index + 1}: ${(script.textContent || '').trim().slice(0, 600)}`);
					}
				});
			}
			return hints.length ? hints.join('\n\n') : '인라인 이벤트 없음';
		}

		function getPageSourceSummary(type) {
			if (type === 'css') {
				let output = '접근 가능한 스타일시트만 표시됩니다.\n\n';
				Array.from(document.styleSheets).slice(0, 30).forEach(sheet => {
					try {
						output += `/* ${sheet.href || 'inline'} */\n`;
						Array.from(sheet.cssRules || []).slice(0, 80).forEach(rule => {
							output += `${rule.cssText}\n`;
						});
						output += '\n';
					} catch (e) {
						output += `/* 접근 불가: ${sheet.href || 'inline'} */\n\n`;
					}
				});
				return output.trim();
			}
			if (type === 'js') {
				return Array.from(document.scripts).slice(0, 80).map((script, index) => {
					return script.src ? `${index + 1}. ${script.src}` : `${index + 1}. inline script (${(script.textContent || '').length} chars)`;
				}).join('\n') || '스크립트 없음';
			}
			const clone = document.documentElement.cloneNode(true);
			clone.querySelectorAll('.mobile-block-ui, #mes-shadow-highlight-style').forEach(node => node.remove());
			clone.querySelectorAll('style').forEach(node => {
				if ((node.textContent || '').includes('--md-sys-color-primary') && (node.textContent || '').includes('#mobile-block-toggleBtn')) {
					node.remove();
				}
			});
			return clone.outerHTML.slice(0, 60000);
		}

		function safeDecode(value) {
			try {
				return decodeURIComponent(value);
			} catch (e) {
				return value;
			}
		}

		function maskSensitiveValue(value) {
			const text = String(value ?? '');
			if (!settings.privacyMode) return text;
			if (!text) return '';
			if (text.length <= 8) return STRINGS.cookieValuesMasked;
			return `${text.slice(0, 4)}...${text.slice(-3)} (${text.length}자)`;
		}

		function redactUrl(rawUrl) {
			if (!settings.privacyMode) return rawUrl;
			try {
				const url = new URL(rawUrl, location.href);
				const sanitizedSegments = url.pathname.split('/').map(segment => {
					if (!segment) return segment;
					const decoded = safeDecode(segment);
					const looksSensitive = /@|%40/.test(segment) ||
						/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(decoded) ||
						/^[a-f0-9]{12,}$/i.test(decoded) ||
						/^[A-Za-z0-9_-]{18,}$/.test(decoded) ||
						/^\d{6,}$/.test(decoded);
					return looksSensitive ? ':redacted' : segment.slice(0, 48);
				});
				url.pathname = sanitizedSegments.join('/');
				const hadSearch = !!url.search;
				url.search = hadSearch ? '?redacted' : '';
				url.hash = '';
				return url.href;
			} catch (e) {
				return String(rawUrl || '').replace(/\?.*$/, '?redacted').replace(/#.*$/, '');
			}
		}

		function looksSensitiveText(value) {
			const text = String(value || '');
			return /token|secret|session|auth|bearer|password|passwd|credential|api[-_]?key/i.test(text) ||
				/[A-Za-z0-9_-]{24,}/.test(text) ||
				/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
		}

		function shouldConfirmAttributeCopy(attrName, value) {
			if (!settings.privacyMode) return false;
			const name = String(attrName || '').toLowerCase();
			const urlAttrs = new Set(['href', 'src', 'data-src', 'data-original', 'poster', 'action']);
			return urlAttrs.has(name) ||
				/(token|secret|session|auth|cookie|password|passwd|credential|key)/i.test(name) ||
				looksSensitiveText(value);
		}

		function getCookieRows() {
			return document.cookie.split(';').map(cookie => cookie.trim()).filter(Boolean).map(cookie => {
				const [name = '', ...valueParts] = cookie.split('=');
				const value = safeDecode(valueParts.join('='));
				return {
					name,
					value,
					displayValue: maskSensitiveValue(value)
				};
			});
		}

		function isSafeCookieName(name) {
			return typeof name === 'string' && !!name && !/[=;,\s]/.test(name);
		}

		function getCookiePathCandidates() {
			const paths = new Set(['/']);
			const parts = location.pathname.split('/').filter(Boolean);
			let current = '';
			parts.slice(0, -1).forEach(part => {
				current += `/${part}`;
				paths.add(current || '/');
			});
			paths.add(location.pathname || '/');
			return Array.from(paths);
		}

		function getCookieDomainCandidates() {
			const host = location.hostname;
			if (!host || host === 'localhost' || /^[\d.]+$/.test(host) || host.includes(':')) return [''];
			const parts = host.split('.');
			const domains = new Set(['', host]);
			for (let index = 1; index < parts.length - 1; index++) {
				domains.add(parts.slice(index).join('.'));
			}
			return Array.from(domains);
		}

		function setCookieValue(name, value) {
			if (!isSafeCookieName(name)) return false;
			const secure = location.protocol === 'https:' ? '; Secure' : '';
			deleteCookieValue(name);
			document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax${secure}`;
			return true;
		}

		function deleteCookieValue(name) {
			if (!isSafeCookieName(name)) return false;
			const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
			document.cookie = `${name}=; expires=${expires}; max-age=0`;
			getCookieDomainCandidates().forEach(domain => {
				getCookiePathCandidates().forEach(path => {
					const domainPart = domain ? `; domain=${domain}` : '';
					document.cookie = `${name}=; path=${path}${domainPart}; expires=${expires}; max-age=0`;
				});
			});
			return true;
		}

		function formatResourceMetadata(entry) {
			if (!entry) return '';
			const lines = [
				`URL: ${redactUrl(entry.name)}`,
				`유형: ${entry.initiatorType || 'unknown'}`,
				`시간: ${Math.round(entry.duration)}ms`,
				`크기: ${Math.round(entry.transferSize || 0)} bytes`,
				`시작: ${Math.round(entry.startTime)}ms`
			];
			if (!settings.privacyMode) {
				lines.push(`원본 URL: ${entry.name}`);
			}
			return lines.join('\n');
		}

		function getDiagnosticsText() {
			let webglInfo = 'WebGL 정보 없음';
			try {
				const canvas = document.createElement('canvas');
				const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
				if (gl) {
					const ext = gl.getExtension('WEBGL_debug_renderer_info');
					webglInfo = ext ? `${gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)} / ${gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)}` : 'WebGL 사용 가능';
				}
			} catch (e) {}

			return [
				`User Agent: ${navigator.userAgent}`,
				`언어: ${navigator.language}`,
				`시간대: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
				`화면: ${screen.width}x${screen.height} / DPR ${devicePixelRatio}`,
				`뷰포트: ${innerWidth}x${innerHeight}`,
				`CPU 스레드: ${navigator.hardwareConcurrency || 'N/A'}`,
				`메모리: ${navigator.deviceMemory || 'N/A'} GB`,
				`WebGL: ${webglInfo}`,
				`리소스 수: ${performance.getEntriesByType('resource').length}`
			].join('\n');
		}

		let inspectorTab = 'element';
		let inspectorTextSnapshot = '';

		function renderInspector(tab = inspectorTab) {
			clearCandidatePreview();
			inspectorTab = tab;
			inspectorTabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
			if (!inspectorContent) return;
			if (!selectedEl && ['element', 'code'].includes(tab)) {
				inspectorContent.innerHTML = `<div class="inspector-section">${STRINGS.inspectorUnavailable}</div>`;
				inspectorTextSnapshot = STRINGS.inspectorUnavailable;
				return;
			}

			if (tab === 'element') {
				const selector = selectedEl ? generateElementSelector(selectedEl, 7, true) : '';
				const similar = selectedEl ? generateSimilarSelector(selectedEl) : '';
				const selectorCandidates = selectedEl ? buildSelectorCandidates(selectedEl) : [];
				const children = selectedEl ? getChildElements(selectedEl) : [];
				const elementSummary = formatElementSummary(selectedEl);
				inspectorTextSnapshot = elementSummary;
				if (selectorCandidates.length) {
					inspectorTextSnapshot += `\n\n선택자 후보\n${selectorCandidates.map(candidate => `[${candidate.label}] ${candidate.selector} (${candidate.qualityText} · ${candidate.risk.label} - ${candidate.risk.reason})`).join('\n')}`;
				}
				inspectorContent.innerHTML = `
                    <div class="inspector-section">
                        <div class="inspector-section-title">요약</div>
                        <pre class="inspector-pre">${escapeHtml(elementSummary)}</pre>
                    </div>
                    <div class="inspector-section">
                        <div class="inspector-section-title">동작</div>
                        <div class="inspector-list">
                            <div class="inspector-row"><span>유사 선택자</span><button class="mb-btn inspector-mini-btn" data-inspector-action="copy-similar">복사</button></div>
                            <div class="inspector-row"><span>속성 값 추출</span><button class="mb-btn inspector-mini-btn" data-inspector-action="extract-attribute">추출</button></div>
                            <div class="inspector-row"><span>선택 범위 집중</span><button class="mb-btn inspector-mini-btn" data-inspector-action="toggle-isolation">${isIsolationActive ? STRINGS.restoreFocus : STRINGS.isolateFocus}</button></div>
                            <div class="inspector-row"><span>상위 요소 선택</span><button class="mb-btn inspector-mini-btn" data-inspector-action="parent">상위</button></div>
                            <div class="inspector-row"><span>하위 요소 ${children.length}개</span><button class="mb-btn inspector-mini-btn" data-inspector-action="children">보기</button></div>
                        </div>
                    </div>
                    <div class="inspector-section">
                        <div class="inspector-section-title">선택자 후보</div>
                        <div class="selector-candidate-list">
                            ${selectorCandidates.map((candidate, index) => `
                                <div class="selector-candidate-row">
                                    <div class="selector-candidate-head">
                                        <span class="selector-candidate-title">${escapeHtml(candidate.label)}</span>
                                        <span class="selector-candidate-meta">${escapeHtml(candidate.qualityText)}</span>
									</div>
									<pre class="selector-candidate-selector">${escapeHtml(candidate.selector)}</pre>
									<div class="selector-candidate-analysis">
										<span class="selector-risk ${escapeHtml(candidate.risk.level)}">${escapeHtml(candidate.risk.label)}</span>
										<span class="selector-risk-reason">${escapeHtml(candidate.risk.reason)}</span>
									</div>
									<div class="selector-candidate-actions">
										<button class="mb-btn surface" data-inspector-action="preview-candidate" data-candidate-index="${index}">보기</button>
                                        <button class="mb-btn outline" data-inspector-action="copy-candidate" data-candidate-index="${index}">복사</button>
                                        <button class="mb-btn secondary" data-inspector-action="save-candidate" data-candidate-index="${index}">저장</button>
                                    </div>
                                </div>`).join('') || `<pre class="inspector-pre">${escapeHtml([selector, similar && similar !== selector ? similar : ''].filter(Boolean).join('\n'))}</pre>`}
                        </div>
                    </div>`;
				inspectorContent._mesSelectorCandidates = selectorCandidates;
			} else if (tab === 'code') {
				const html = getFormattedOuterHtml(selectedEl);
				const css = getComputedStyleSummary(selectedEl);
				const js = getInlineScriptHints(selectedEl);
				inspectorTextSnapshot = `HTML\n${html}\n\nCSS\n${css}\n\nJS\n${js}`;
				inspectorContent.innerHTML = `
                    <div class="inspector-section"><div class="inspector-section-title">HTML</div><pre class="inspector-pre">${escapeHtml(html)}</pre></div>
                    <div class="inspector-section"><div class="inspector-section-title">계산된 스타일</div><pre class="inspector-pre">${escapeHtml(css)}</pre></div>
                    <div class="inspector-section"><div class="inspector-section-title">스크립트 단서</div><pre class="inspector-pre">${escapeHtml(js)}</pre></div>`;
			} else if (tab === 'page') {
				const html = getPageSourceSummary('html');
				const css = getPageSourceSummary('css');
				const js = getPageSourceSummary('js');
				inspectorTextSnapshot = `HTML\n${html}\n\nCSS\n${css}\n\nJS\n${js}`;
				inspectorContent.innerHTML = `
                    <div class="inspector-section"><div class="inspector-section-title">HTML</div><pre class="inspector-pre">${escapeHtml(html)}</pre></div>
                    <div class="inspector-section"><div class="inspector-section-title">CSS</div><pre class="inspector-pre">${escapeHtml(css)}</pre></div>
                    <div class="inspector-section"><div class="inspector-section-title">JS</div><pre class="inspector-pre">${escapeHtml(js)}</pre></div>`;
			} else if (tab === 'cookies') {
				const rows = getCookieRows();
				inspectorTextSnapshot = rows.map(row => `${row.name}=${row.displayValue}`).join('\n') || STRINGS.noCookies;
				inspectorContent.innerHTML = rows.length ? `<div class="inspector-section"><div class="inspector-section-title">쿠키</div><pre class="inspector-pre">${escapeHtml(`${STRINGS.cookieReadOnly}\n${STRINGS.cookieScopeNotice}`)}</pre><div class="inspector-list">${rows.map(row => `
                    <div class="inspector-row">
                        <span><strong>${escapeHtml(row.name)}</strong><br>${escapeHtml(row.displayValue)}</span>
                        <div class="inspector-row-actions">
                            <button class="mb-btn inspector-mini-btn" data-cookie-action="copy" data-cookie-name="${encodeURIComponent(row.name)}">${STRINGS.cookieCopy}</button>
                            <button class="mb-btn inspector-mini-btn" data-cookie-action="edit" data-cookie-name="${encodeURIComponent(row.name)}">${STRINGS.cookieEdit}</button>
                            <button class="mb-btn inspector-mini-btn error" data-cookie-action="delete" data-cookie-name="${encodeURIComponent(row.name)}">${STRINGS.cookieDelete}</button>
                        </div>
                    </div>`).join('')}</div></div>` : `<div class="inspector-section">${STRINGS.noCookies}</div>`;
			} else if (tab === 'diagnostics') {
				inspectorTextSnapshot = getDiagnosticsText();
				inspectorContent.innerHTML = `<div class="inspector-section"><div class="inspector-section-title">브라우저 및 화면</div><pre class="inspector-pre">${escapeHtml(inspectorTextSnapshot)}</pre></div>`;
			} else if (tab === 'resources') {
				const resources = performance.getEntriesByType('resource').slice(-120).reverse();
				inspectorTextSnapshot = resources.map(entry => `[${entry.initiatorType || 'unknown'}] ${Math.round(entry.duration)}ms ${redactUrl(entry.name)}`).join('\n');
				inspectorContent.innerHTML = `<div class="inspector-section"><div class="inspector-section-title">최근 리소스</div><div class="inspector-list">${resources.map((entry, index) => `
                    <div class="inspector-row">
                        <span><strong>${escapeHtml(entry.initiatorType || 'unknown')}</strong> ${Math.round(entry.duration)}ms<br>${escapeHtml(redactUrl(entry.name))}</span>
                        <button class="mb-btn inspector-mini-btn" data-resource-index="${index}">보기</button>
                    </div>`).join('') || '리소스 없음'}</div></div>`;
			}
		}

		function setBlockMode(enabled) {
			if (!toggleBtn || !panel) return;

			selecting = enabled;
			toggleBtn.classList.toggle('selecting', enabled);
			updateToggleIcon();

			if (enabled) {
				updatePickerDocking();
				setPanelVisibility(panel, true);
				setPickerCompact(false);
				if (selectedEl) {
					applySelectionHighlight(selectedEl);
				}
				refreshNavigationSlider();
				updateInfo();
			} else {
				setPanelVisibility(panel, false);
				if (activePanel === listPanel) setPanelVisibility(listPanel, false);
				if (activePanel === settingsPanel) setPanelVisibility(settingsPanel, false);
				if (activePanel === inspectorPanel) setPanelVisibility(inspectorPanel, false);

				removeSelectionHighlight();
				resetPreview();
				setPickerCompact(false);
				initialTouchedElement = null;
			}
			console.log(SCRIPT_ID, "Selection mode:", enabled ? "ON" : "OFF");
		}

		let domObserver = null;
		let domObserverTimer = null;
		let observedMutationRoots = new WeakSet();

		function setupDomObserver() {
			if (domObserver) {
				domObserver.disconnect();
				domObserver = null;
			}
			if (blockGuardInterval) {
				clearInterval(blockGuardInterval);
				blockGuardInterval = null;
			}
			observedMutationRoots = new WeakSet();
			if (!settings.observeDomChanges || settings.tempBlockingDisabled) return;

			const observeRoot = (root) => {
				if (!root || observedMutationRoots.has(root)) return false;
				try {
					domObserver.observe(root, {
						childList: true,
						subtree: true,
						attributes: true,
						attributeFilter: ['style', 'class', 'id', 'hidden'],
						characterData: true
					});
					observedMutationRoots.add(root);
					return true;
				} catch (e) {}
				return false;
			};

			const observeOpenShadowRoots = (root = document) => {
				if (!settings.shadowDomSupport) return false;
				let addedRoot = false;
				collectOpenShadowRoots(root).forEach(shadowRoot => {
					if (observeRoot(shadowRoot)) addedRoot = true;
				});
				return addedRoot;
			};

			domObserver = new MutationObserver((mutations) => {
				if (applyingBlocking) {
					pendingBlockingApply = true;
					return;
				}
				let shouldRefreshRoots = false;
				const hasBlockingTamper = mutations.some(mutation => {
					if (mutation.type === 'attributes' && hiddenElements.has(mutation.target)) return true;
					if (nodeTouchesOwnedBlockStyle(mutation.target)) return true;
					return Array.from(mutation.removedNodes || []).some(nodeTouchesOwnedBlockStyle);
				});
				const hasSelectorAttributeChange = mutations.some(mutation => {
					return mutation.type === 'attributes' &&
						['class', 'id', 'hidden'].includes(mutation.attributeName) &&
						mutation.target?.nodeType === 1 &&
						!isMesInternalNode(mutation.target);
				});
				const hasPageChange = mutations.some(mutation => {
					const target = mutation.target;
					if (!target || isMesInternalNode(target)) return false;
					return Array.from(mutation.addedNodes || []).some(node => node.nodeType === 1 && !isMesInternalNode(node));
				});
				if (hasBlockingTamper) {
					scheduleBlockingIntegrityCheck(60);
				}
				if (!hasPageChange && !hasSelectorAttributeChange) return;
				if (hasPageChange) {
					mutations.forEach(mutation => {
						Array.from(mutation.addedNodes || []).forEach(node => {
							if (node.nodeType === 1 && !isMesInternalNode(node) && (node.shadowRoot || node.querySelector?.('*'))) {
								shouldRefreshRoots = true;
							}
						});
					});
					if (shouldRefreshRoots) observeOpenShadowRoots(document);
				}

				clearTimeout(domObserverTimer);
				domObserverTimer = setTimeout(() => {
					if (typeof requestIdleCallback === 'function') {
						requestIdleCallback(() => applyBlocking(false), {
							timeout: 500
						});
					} else {
						applyBlocking(false);
					}
				}, 120);
			});

			observeRoot(document.documentElement);
			observeOpenShadowRoots(document);
			blockGuardInterval = setInterval(() => {
				const foundNewShadowRoots = observeOpenShadowRoots(document);
				if (foundNewShadowRoots) {
					applyBlocking(false);
				} else {
					scheduleBlockingIntegrityCheck(0);
				}
			}, 2500);
		}


		console.log(SCRIPT_ID, 'Attaching event listeners...');

		toggleBtn.addEventListener('click', () => {
			setBlockMode(!selecting);
		});

		compactToggleBtn.addEventListener('click', () => {
			setPickerCompact(!pickerCompact);
		});

		parentBtn.addEventListener('click', () => moveNavigation(-1));

		childBtn.addEventListener('click', () => moveNavigation(1));

		moreBtn.addEventListener('click', () => {
			if (pickerCompact) {
				setPickerCompact(false);
			}
			secondaryActions.classList.toggle('visible');
			moreBtn.classList.toggle('active', secondaryActions.classList.contains('visible'));
		});

		copyCssBtn.addEventListener('click', () => {
			if (!selectedEl) {
				showToast(STRINGS.noElementSelected, 'warning');
				return;
			}
			const selector = generateElementSelector(selectedEl, 7, true);
			if (!selector) {
				showToast(STRINGS.cannotGenerateSelector, 'error');
				return;
			}

			if (copyToClipboard(selector)) {
				showToast(STRINGS.selectorCopied, 'success');
				if (settings.autoCloseAfterCopy) setBlockMode(false);
			} else {
				showToast(STRINGS.clipboardError, 'error');
			}
		});

		copyRuleBtn.addEventListener('click', () => {
			if (!selectedEl) {
				showToast(STRINGS.noElementSelected, 'warning');
				return;
			}
			const selector = generateElementSelector(selectedEl, 7, true);
			if (!selector) {
				showToast(STRINGS.cannotGenerateSelector, 'error');
				return;
			}

			const finalSelector = getRuleTextForSelector(selector);
			if (copyToClipboard(finalSelector)) {
				showToast(STRINGS.ruleCopied, 'success');
				if (settings.autoCloseAfterCopy) setBlockMode(false);
			} else {
				showToast(STRINGS.clipboardError, 'error');
			}
		});

		similarRuleBtn.addEventListener('click', async () => {
			if (!selectedEl) {
				showToast(STRINGS.noElementSelected, 'warning');
				return;
			}
			const selector = generateSimilarSelector(selectedEl);
			if (!selector) {
				showToast(STRINGS.cannotGenerateSelector, 'error');
				return;
			}
			const selectorQuality = getSelectorQuality(selector, selectedEl);
			const matchCount = Math.max(selectorQuality.matchCount, 0);
			if (matchCount > 1 && !confirm(STRINGS.confirmBroadSelector(matchCount))) {
				return;
			}
			const result = await addBlockRule(selector);
			if (result.success) {
				showRuleSavedToast(STRINGS.similarRuleReady(matchCount || 1), 'success', 3200, result.rule);
				resetPreview();
				await applyBlocking(false);
				setBlockMode(false);
			} else {
				showToast(result.message || STRINGS.ruleAddError, result.success ? 'success' : 'info');
			}
		});

		urlBtn.addEventListener('click', () => {
			if (!selectedEl) {
				showToast(STRINGS.noElementSelected, 'warning');
				return;
			}
			const url = findNearestUrl(selectedEl);
			if (!url) {
				showToast(STRINGS.urlNotFound, 'info');
				return;
			}
			if (copyToClipboard(url)) {
				showToast(STRINGS.urlCopied, 'success');
			} else {
				showToast(STRINGS.clipboardError, 'error');
			}
		});

		inspectBtn.addEventListener('click', () => {
			setPickerCompact(false);
			renderInspector('element');
			setPanelVisibility(panel, false);
			setPanelVisibility(inspectorPanel, true);
		});

		previewBtn.addEventListener('click', () => {
			if (!selectedEl) {
				showToast(STRINGS.noElementSelected, 'warning');
				return;
			}

			if (!isPreviewHidden) {
				if (window.getComputedStyle(selectedEl).display === 'none') {
					showToast(STRINGS.alreadyHidden, 'info');
					return;
				}
				applyHiddenStyle(selectedEl);

				const label = previewBtn.querySelector('.btn-label');
				if (label) label.textContent = STRINGS.restorePreview;
				else previewBtn.textContent = STRINGS.restorePreview;
				previewBtn.setAttribute('aria-label', STRINGS.restorePreview);
				previewBtn.title = STRINGS.restorePreview;
				previewBtn.classList.remove('secondary');
				previewBtn.classList.add('tertiary');
				isPreviewHidden = true;
				previewedElement = selectedEl;
				clearSelectionHighlight(selectedEl);
				console.log(SCRIPT_ID, "Previewing hide for:", selectedEl);

			} else {
				if (previewedElement && previewedElement !== selectedEl) {
					showToast(STRINGS.previewDifferentElement, 'warning');
					return;
				}
				resetPreview();
				console.log(SCRIPT_ID, "Restored preview for:", previewedElement);
			}
		});

		addBtn.addEventListener('click', async () => {
			console.log('[addBtn] Clicked');
			if (!selectedEl) {
				showToast(STRINGS.noElementSelected, 'warning');
				return;
			}

			try {
				const selector = generateElementSelector(selectedEl, 7, true);
				console.log('[addBtn] Generated selector for saving:', selector);
				if (!selector) {
					showToast(STRINGS.cannotGenerateSelector, 'error');
					return;
				}
				const selectorQuality = getSelectorQuality(selector, selectedEl);
				const risk = analyzeSelectorRisk(selector, selectedEl, selectorQuality);
				const broadConfirmed = selectorQuality.matchCount > 1;
				if (broadConfirmed && !confirm(STRINGS.confirmBroadSelector(selectorQuality.matchCount))) {
					return;
				}
				if (!confirmSelectorRiskIfNeeded(risk, broadConfirmed)) {
					return;
				}

				const result = await addBlockRule(selector);
				console.log('[addBtn] addBlockRule result:', result);

				if (result.success) {
					showRuleSavedToast(STRINGS.ruleSavedReloading, 'success', 3200, result.rule);
					resetPreview();
					try {
						await applyBlocking(false);
					} catch (applyError) {
						console.error(SCRIPT_ID, "Error applying rule immediately after save:", applyError);
						showToast(STRINGS.ruleSavedApplyFailed, 'warning', 3000);
					}
					setBlockMode(false);

				} else {
					showToast(result.message || STRINGS.ruleAddError, result.success ? 'success' : 'info');
				}
			} catch (error) {
				console.error(SCRIPT_ID, "Error during Save Rule click:", error);
				showToast(`${STRINGS.ruleAddError} ${error.message}`, 'error');
			}
		});

		listBtn.addEventListener('click', () => {
			console.log('[listBtn] Clicked');
			setPickerCompact(false);
			setPanelVisibility(panel, false);
			showList();
		});

		settingsBtn.addEventListener('click', () => {
			console.log('[settingsBtn] Clicked');
			setPickerCompact(false);
			setPanelVisibility(panel, false);
			setPanelVisibility(settingsPanel, true);
		});

		cancelBtn.addEventListener('click', () => {
			setBlockMode(false);
		});

		listClose.addEventListener('click', () => {
			console.log('[listClose] Clicked');
			void clearRulePreview(true);
			setPanelVisibility(listPanel, false);
			if (selecting) {
				console.log('[listClose] Restoring main panel');
				setPanelVisibility(panel, true);
			}
		});

		listSearch.addEventListener('input', () => {
			showList();
		});

		listCopySite.addEventListener('click', async () => {
			await loadDisabledSelectors();
			const disabledSet = new Set(disabledSelectorsCache);
			const rules = (await loadBlockedSelectors()).filter(rule => ruleAppliesToHost(rule) && !disabledSet.has(rule));
			if (!rules.length) {
				showToast(STRINGS.noRules, 'info');
				return;
			}
			if (copyToClipboard(rules.join('\n'))) {
				showToast(STRINGS.rulesCopied(rules.length), 'success');
			} else {
				showToast(STRINGS.clipboardError, 'error');
			}
		});

		listCopyAll.addEventListener('click', async () => {
			const rules = await loadBlockedSelectors();
			if (!rules.length) {
				showToast(STRINGS.noRules, 'info');
				return;
			}
			if (copyToClipboard(rules.join('\n'))) {
				showToast(STRINGS.rulesCopied(rules.length), 'success');
			} else {
				showToast(STRINGS.clipboardError, 'error');
			}
		});

		listPruneStale.addEventListener('click', async () => {
			const rules = await loadBlockedSelectors();
			await loadDisabledSelectors();
			const staleRules = getCurrentSiteStaleRules(rules, new Set(disabledSelectorsCache));
			if (!staleRules.length) {
				showToast(STRINGS.blocklistNoMatch, 'info');
				await showList();
				return;
			}
			if (!confirm(STRINGS.confirmPruneStaleRules(staleRules.length))) return;
			const staleSet = new Set(staleRules);
			await saveBlockedSelectors(rules.filter(rule => !staleSet.has(rule)));
			disableAllBlocking(false);
			await applyBlocking(false);
			await showList();
			showToast(STRINGS.staleRulesDeleted(staleRules.length), 'info');
		});

		listDeleteSite.addEventListener('click', async () => {
			const rules = await loadBlockedSelectors();
			const siteRules = rules.filter(rule => isSiteSpecificRuleForHost(rule));
			if (!siteRules.length) {
				showToast(STRINGS.noRules, 'info');
				return;
			}
			if (!confirm(STRINGS.confirmDeleteSiteRules(location.hostname, siteRules.length))) return;
			await saveBlockedSelectors(rules.filter(rule => !isSiteSpecificRuleForHost(rule)));
			disableAllBlocking(false);
			await applyBlocking(false);
			await showList();
			showToast(STRINGS.siteRulesDeleted(siteRules.length), 'info');
		});

		inspectorTabs.forEach(tabButton => {
			tabButton.addEventListener('click', () => {
				renderInspector(tabButton.dataset.tab);
			});
		});

		inspectorCopy.addEventListener('click', () => {
			const sensitiveTabs = new Set(['page', 'cookies', 'diagnostics', 'resources']);
			if (sensitiveTabs.has(inspectorTab) && !confirm(STRINGS.sensitiveCopyConfirm)) {
				return;
			}
			if (copyToClipboard(inspectorTextSnapshot || '')) {
				showToast(STRINGS.infoCopied, 'success');
			} else {
				showToast(STRINGS.clipboardError, 'error');
			}
		});

		inspectorClose.addEventListener('click', () => {
			clearCandidatePreview();
			setPanelVisibility(inspectorPanel, false);
			if (selecting) setPanelVisibility(panel, true);
		});

		inspectorContent.addEventListener('click', async (event) => {
			const actionButton = event.target.closest('[data-inspector-action]');
			if (actionButton) {
				const action = actionButton.dataset.inspectorAction;
				if (action === 'copy-similar') {
					const similar = selectedEl ? generateSimilarSelector(selectedEl) : '';
					if (similar && copyToClipboard(similar)) {
						showToast(STRINGS.similarSelectorCopied, 'success');
					} else {
						showToast(STRINGS.cannotGenerateSelector, 'error');
					}
				} else if (action === 'copy-candidate' || action === 'preview-candidate' || action === 'save-candidate') {
					const candidateIndex = parseInt(actionButton.dataset.candidateIndex, 10);
					const candidate = inspectorContent._mesSelectorCandidates?.[candidateIndex];
					if (!candidate?.selector) {
						showToast(STRINGS.cannotGenerateSelector, 'error');
						return;
					}
					if (action === 'copy-candidate') {
						if (copyToClipboard(candidate.selector)) {
							showToast(STRINGS.selectorCandidateCopied, 'success');
						} else {
							showToast(STRINGS.clipboardError, 'error');
						}
						return;
					}
					if (action === 'preview-candidate') {
						const matchCount = previewSelectorCandidate(candidate.selector);
						showToast(matchCount ? STRINGS.selectorCandidatePreview(matchCount) : STRINGS.cannotGenerateSelector, matchCount ? 'info' : 'error');
						return;
					}
					const broadConfirmed = candidate.matchCount > 1;
					if (broadConfirmed && !confirm(STRINGS.confirmBroadSelector(candidate.matchCount))) {
						return;
					}
					if (!confirmSelectorRiskIfNeeded(candidate.risk, broadConfirmed)) {
						return;
					}
					clearCandidatePreview();
					const result = await addBlockRule(candidate.selector);
					if (result.success) {
						disableAllBlocking(false);
						await applyBlocking(false);
						showRuleSavedToast(STRINGS.selectorCandidateSaved(candidate.matchCount || 1), 'success', 3200, result.rule);
						renderInspector('element');
					} else {
						showToast(result.message, result.message === STRINGS.ruleExists ? 'info' : 'error');
					}
				} else if (action === 'extract-attribute') {
					const attrName = prompt(STRINGS.attributePrompt, 'data-testid');
					if (!attrName) return;
					const value = selectedEl?.getAttribute(attrName.trim());
					if (value === null || value === undefined) {
						showToast(STRINGS.attributeNotFound, 'info');
						return;
					}
					if (shouldConfirmAttributeCopy(attrName, value) && !confirm(STRINGS.sensitiveCopyConfirm)) return;
					if (copyToClipboard(value)) {
						showToast(STRINGS.attributeCopied, 'success');
					} else {
						showToast(STRINGS.clipboardError, 'error');
					}
				} else if (action === 'toggle-isolation') {
					if (isIsolationActive) {
						clearIsolation();
						showToast(STRINGS.focusModeOff, 'info', 1400);
					} else if (selectedEl && applyIsolation(selectedEl)) {
						showToast(STRINGS.focusModeOn, 'info', 1400);
					} else {
						showToast(STRINGS.noElementSelected, 'warning');
					}
					renderInspector('element');
				} else if (action === 'parent') {
					const parent = getParentElement(selectedEl);
					if (parent && !['body', 'html'].includes(parent.tagName.toLowerCase())) {
						selectElement(parent, true);
						renderInspector('element');
					}
				} else if (action === 'children') {
					const children = getChildElements(selectedEl);
					inspectorTextSnapshot = children.map((child, index) => `${index + 1}. ${getElementLabel(child, selectedEl)}`).join('\n') || STRINGS.noChildElements;
					inspectorContent.innerHTML = `<div class="inspector-section"><div class="inspector-section-title">하위 요소</div><div class="inspector-list">${children.map((child, index) => `
                        <div class="inspector-row">
                            <span>${escapeHtml(getElementLabel(child, selectedEl))}</span>
                            <button class="mb-btn inspector-mini-btn" data-child-index="${index}">선택</button>
                        </div>`).join('') || STRINGS.noChildElements}</div></div>`;
					inspectorContent._mesChildList = children;
				}
				return;
			}

			const childButton = event.target.closest('[data-child-index]');
			if (childButton && inspectorContent._mesChildList) {
				const child = inspectorContent._mesChildList[parseInt(childButton.dataset.childIndex, 10)];
				if (child) {
					selectElement(child, true);
					renderInspector('element');
				}
				return;
			}

			const cookieButton = event.target.closest('[data-cookie-action]');
			if (cookieButton) {
				let cookieName = '';
				try {
					cookieName = decodeURIComponent(cookieButton.dataset.cookieName || '');
				} catch (e) {}
				const cookieRow = getCookieRows().find(row => row.name === cookieName);
				const action = cookieButton.dataset.cookieAction;
				if (!cookieName || (action !== 'delete' && !cookieRow)) {
					showToast(STRINGS.cookieActionFailed, 'error');
					return;
				}
				if (action === 'copy') {
					if (settings.privacyMode && !confirm(STRINGS.sensitiveCopyConfirm)) return;
					if (copyToClipboard(cookieRow.value)) {
						showToast(STRINGS.infoCopied, 'success');
					} else {
						showToast(STRINGS.clipboardError, 'error');
					}
					return;
				}
				if (action === 'edit') {
					const nextValue = prompt(STRINGS.cookieEditPrompt(cookieName), settings.privacyMode ? '' : cookieRow.value);
					if (nextValue === null) return;
					if (setCookieValue(cookieName, nextValue)) {
						showToast(STRINGS.cookieUpdated, 'success');
						renderInspector('cookies');
					} else {
						showToast(STRINGS.cookieActionFailed, 'error');
					}
					return;
				}
				if (action === 'delete') {
					if (!confirm(STRINGS.cookieDeleteConfirm(cookieName))) return;
					if (deleteCookieValue(cookieName)) {
						showToast(STRINGS.cookieDeleted, 'info');
						renderInspector('cookies');
					} else {
						showToast(STRINGS.cookieActionFailed, 'error');
					}
					return;
				}
			}

			const resourceButton = event.target.closest('[data-resource-index]');
			if (resourceButton) {
				const resources = performance.getEntriesByType('resource').slice(-120).reverse();
				const entry = resources[parseInt(resourceButton.dataset.resourceIndex, 10)];
				if (!entry) return;
				const text = formatResourceMetadata(entry);
				inspectorTextSnapshot = text;
				inspectorContent.innerHTML = `<div class="inspector-section"><div class="inspector-section-title">${STRINGS.resourceMetadataLabel}</div><pre class="inspector-pre">${escapeHtml(text)}</pre></div>`;
			}
		});

		settingsClose.addEventListener('click', () => {
			console.log('[settingsClose] Clicked');
			setPanelVisibility(settingsPanel, false);
			if (selecting) {
				console.log('[settingsClose] Restoring main panel');
				setPanelVisibility(panel, true);
			}
		});

		function updateSwitch(button, value) {
			if (!button) return;
			button.classList.toggle('active', value);
			button.setAttribute('aria-checked', value ? 'true' : 'false');
		}

		function updateLauncherModeButtons() {
			const mode = settings.hideToggleButton ? 'gesture' : 'button';
			launcherModeButtons.forEach(button => {
				const active = button.dataset.launcherMode === mode;
				button.classList.toggle('active', active);
				button.setAttribute('aria-checked', active ? 'true' : 'false');
				button.setAttribute('aria-pressed', active ? 'true' : 'false');
			});
			if (toggleBtn) {
				toggleBtn.classList.toggle('hidden-toggle', settings.hideToggleButton);
			}
			updateGestureDetailControls();
		}

		function updateGestureDetailControls() {
			gestureDetailSettings?.classList.toggle('visible', settings.hideToggleButton);
			gestureFingerButtons.forEach(button => {
				const active = Number(button.dataset.gestureFingers) === settings.gestureFingerCount;
				button.classList.toggle('active', active);
				button.setAttribute('aria-checked', active ? 'true' : 'false');
				button.setAttribute('aria-pressed', active ? 'true' : 'false');
			});
			gestureTapButtons.forEach(button => {
				const active = Number(button.dataset.gestureTaps) === settings.gestureTapCount;
				button.classList.toggle('active', active);
				button.setAttribute('aria-checked', active ? 'true' : 'false');
				button.setAttribute('aria-pressed', active ? 'true' : 'false');
			});
		}

		function getGestureShortcutLabel() {
			const fingers = settings.gestureFingerCount === 3 ? STRINGS.gestureThreeFingers : STRINGS.gestureTwoFingers;
			const taps = settings.gestureTapCount === 3 ? STRINGS.gestureThreeTaps : STRINGS.gestureTwoTaps;
			return `${fingers} ${taps}`;
		}

		async function refreshLegacyImportControls() {
			if (!legacyImportItem || !legacyImportSummary || !legacyImportBtn) return null;
			const candidates = await getLegacyImportCandidates();
			const detected = candidates.totalCount > 0;
			legacyImportItem.hidden = !detected;
			legacyImportSummary.textContent = detected ? STRINGS.legacyImportSummary(candidates.totalCount, candidates.freshRules.length) : '';
			legacyImportBtn.disabled = !candidates.freshRules.length;
			return candidates;
		}

		toggleSiteBtn.addEventListener('click', async () => {
			settings.includeSiteName = !settings.includeSiteName;
			updateSwitch(toggleSiteBtn, settings.includeSiteName);
			await saveSettings();
			showToast(STRINGS.settingsSaved, 'info', 1500);
		});

		shieldIconToggleBtn.addEventListener('click', async () => {
			settings.showShieldIcon = !settings.showShieldIcon;
			updateSwitch(shieldIconToggleBtn, settings.showShieldIcon);
			updateToggleIcon();
			await saveSettings();
			showToast(STRINGS.settingsSaved, 'info', 1500);
		});

		tempDisableBtn.addEventListener('click', async () => {
			settings.tempBlockingDisabled = !settings.tempBlockingDisabled;
			updateSwitch(tempDisableBtn, settings.tempBlockingDisabled);
			tempDisableBtn.classList.toggle('error', settings.tempBlockingDisabled);

			if (settings.tempBlockingDisabled) {
				disableAllBlocking();
			} else {
				await enableAllBlocking();
			}
			setupDomObserver();
			await saveSettings();
		});

		function bindBooleanSetting(button, key, afterChange) {
			button.addEventListener('click', async () => {
				settings[key] = !settings[key];
				updateSwitch(button, settings[key]);
				if (typeof afterChange === 'function') await afterChange(settings[key]);
				await saveSettings();
				showToast(STRINGS.settingsSaved, 'info', 1500);
			});
		}

		bindBooleanSetting(observeDomBtn, 'observeDomChanges', () => {
			setupDomObserver();
		});
		bindBooleanSetting(shadowDomBtn, 'shadowDomSupport', () => {
			if (selectedEl) {
				updateInfo();
				refreshNavigationSlider();
			}
		});
		bindBooleanSetting(selectorHintsBtn, 'selectorHintMode', () => {
			if (selectedEl) updateInfo();
		});
		bindBooleanSetting(privacyModeBtn, 'privacyMode', () => {
			renderInspector(inspectorTab);
		});
		bindBooleanSetting(autoCloseBtn, 'autoCloseAfterCopy');
		bindBooleanSetting(compactPickerBtn, 'compactPickerMode', (enabled) => {
			if (!enabled) setPickerCompact(false);
			else if (selecting && selectedEl) setPickerCompact(true);
		});

		launcherModeButtons.forEach(button => {
			button.addEventListener('click', async () => {
				const useGesture = button.dataset.launcherMode === 'gesture';
				settings.hideToggleButton = useGesture;
				settings.twoFingerGesture = useGesture;
				updateLauncherModeButtons();
				await saveSettings();
				showToast(useGesture ? STRINGS.launcherGestureReady(getGestureShortcutLabel()) : STRINGS.settingsSaved, 'info', 1800);
			});
		});
		updateLauncherModeButtons();

		gestureFingerButtons.forEach(button => {
			button.addEventListener('click', async () => {
				const nextValue = Number(button.dataset.gestureFingers);
				if (![2, 3].includes(nextValue) || settings.gestureFingerCount === nextValue) return;
				settings.gestureFingerCount = nextValue;
				updateGestureDetailControls();
				await saveSettings();
				showToast(STRINGS.settingsSaved, 'info', 1500);
			});
		});

		gestureTapButtons.forEach(button => {
			button.addEventListener('click', async () => {
				const nextValue = Number(button.dataset.gestureTaps);
				if (![2, 3].includes(nextValue) || settings.gestureTapCount === nextValue) return;
				settings.gestureTapCount = nextValue;
				updateGestureDetailControls();
				await saveSettings();
				showToast(STRINGS.settingsSaved, 'info', 1500);
			});
		});

		const updateCornerButtons = (activeCorner) => {
			cornerButtons.forEach(btn => {
				btn.classList.toggle('active', btn.dataset.corner === activeCorner);
			});
		};

		cornerButtons.forEach(button => {
			button.addEventListener('click', async () => {
				const selectedCorner = button.dataset.corner;
				if (settings.toggleBtnCorner !== selectedCorner) {
					settings.toggleBtnCorner = selectedCorner;
					updateCornerButtons(selectedCorner);
					applyToggleBtnPosition();
					await saveSettings();
					showToast(STRINGS.settingsSaved, 'info', 1500);
				}
			});
		});

		updateCornerButtons(settings.toggleBtnCorner);

		const updateHideStrategyButtons = (activeStrategy) => {
			hideStrategyButtons.forEach(btn => {
				btn.classList.toggle('active', btn.dataset.hideStrategy === activeStrategy);
			});
		};

		hideStrategyButtons.forEach(button => {
			button.addEventListener('click', async () => {
				const selectedStrategy = button.dataset.hideStrategy;
				if (settings.hideStrategy !== selectedStrategy) {
					settings.hideStrategy = selectedStrategy;
					updateHideStrategyButtons(selectedStrategy);
					disableAllBlocking(false);
					await applyBlocking(false);
					await saveSettings();
					showToast(STRINGS.settingsSaved, 'info', 1500);
				}
			});
		});

		updateHideStrategyButtons(settings.hideStrategy);
		refreshLegacyImportControls();


		let saveTimeout;
		const debounceSaveSettings = () => {
			clearTimeout(saveTimeout);
			saveTimeout = setTimeout(async () => {
				await saveSettings();
				console.log(SCRIPT_ID, "Settings saved via debounce");
			}, 500);
		};

		panelOpacitySlider.addEventListener('input', e => {
			const newValue = parseFloat(e.target.value);
			settings.panelOpacity = newValue;
			panelOpacityValue.textContent = newValue.toFixed(2);
			document.documentElement.style.setProperty('--panel-opacity', newValue);
			document.querySelectorAll('#mobile-block-panel, #mobile-settings-panel, #mobile-blocklist-panel, #mobile-inspector-panel').forEach(p => {
				p.style.setProperty('background-color', `rgba(248, 248, 250, ${newValue})`, 'important');
			});
			debounceSaveSettings();
		});

		toggleSizeSlider.addEventListener('input', e => {
			const newValue = parseFloat(e.target.value);
			settings.toggleSizeScale = newValue;
			toggleSizeValue.textContent = newValue.toFixed(1) + 'x';
			document.documentElement.style.setProperty('--toggle-size', `${TOGGLE_BASE_SIZE * newValue}px`);
			if (toggleBtn) {
				toggleBtn.style.setProperty('width', `var(--toggle-hitbox-size)`, 'important');
				toggleBtn.style.setProperty('height', `var(--toggle-hitbox-size)`, 'important');
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

		legacyImportBtn?.addEventListener('click', async () => {
			try {
				const candidates = await getLegacyImportCandidates();
				if (!candidates.freshRules.length) {
					await refreshLegacyImportControls();
					showToast(STRINGS.legacyImportNone, 'info', 1600);
					return;
				}
				const existingRules = await loadBlockedSelectors();
				await saveBlockedSelectors([...existingRules, ...candidates.freshRules]);
				disableAllBlocking(false);
				await applyBlocking(false);
				if (listPanel.classList.contains('visible')) {
					await showList();
				}
				await refreshLegacyImportControls();
				showToast(STRINGS.legacyImportSuccess(candidates.freshRules.length), 'success', 2200);
			} catch (err) {
				console.error(SCRIPT_ID, 'Legacy import failed:', err);
				showToast(STRINGS.restoreErrorGeneral, 'error');
			}
		});

		backupBtn.addEventListener('click', async () => {
			try {
				const rules = await loadBlockedSelectors();
				const disabledRules = await loadDisabledSelectors();
				if (rules.length === 0) {
					showToast(STRINGS.backupNoRules, 'info');
					return;
				}
				const jsonString = JSON.stringify({
					version: '2.0.0',
					exportedAt: new Date().toISOString(),
					settings,
					rules,
					disabledRules
				}, null, 2);
				const blob = new Blob([jsonString], {
					type: 'application/json'
				});
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
			restoreInput.click();
		});

		restoreInput.addEventListener('change', async (event) => {
			const file = event.target.files[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = async (e) => {
				try {
					const content = e.target.result;
					const parsedBackup = JSON.parse(content);
					const parsedRules = Array.isArray(parsedBackup) ? parsedBackup : parsedBackup?.rules;

					if (!Array.isArray(parsedRules) || !parsedRules.every(item => typeof item === 'string')) {
						throw new Error("Invalid file content - expected an array of strings.");
					}
					const normalized = normalizeRulesForStorage(parsedRules);
					if (normalized.invalidCount > 0) {
						console.warn(SCRIPT_ID, `Skipped ${normalized.invalidCount} invalid restored rules.`);
					}

					await saveBlockedSelectors(normalized.rules);
					const restoredDisabledRules = Array.isArray(parsedBackup?.disabledRules) ? parsedBackup.disabledRules : [];
					const normalizedDisabled = normalizeRulesForStorage(restoredDisabledRules).rules.filter(rule => normalized.rules.includes(rule));
					await saveDisabledSelectors(normalizedDisabled);
					if (parsedBackup && !Array.isArray(parsedBackup) && parsedBackup.settings && typeof parsedBackup.settings === 'object') {
						settings = {
							...DEFAULT_SETTINGS,
							...settings,
							...parsedBackup.settings
						};
						await saveSettings();
						await loadSettings();
						await saveSettings();
						updateCSSVariables();
						updateToggleIcon();
						applyToggleBtnPosition();
						updateHideStrategyButtons(settings.hideStrategy);
						setupDomObserver();
					}
					disableAllBlocking(false);
					await applyBlocking(true);
					showToast(normalized.duplicateCount > 0 ? STRINGS.restoreSuccessDeduped(normalized.duplicateCount) : STRINGS.restoreSuccess, 'success', 2500);

					if (listPanel.classList.contains('visible')) {
						await showList();
					}
					if (settingsPanel.classList.contains('visible')) {
						[
							[toggleSiteBtn, settings.includeSiteName],
							[shieldIconToggleBtn, settings.showShieldIcon],
							[observeDomBtn, settings.observeDomChanges],
							[shadowDomBtn, settings.shadowDomSupport],
							[selectorHintsBtn, settings.selectorHintMode],
							[privacyModeBtn, settings.privacyMode],
							[autoCloseBtn, settings.autoCloseAfterCopy],
							[compactPickerBtn, settings.compactPickerMode]
						].forEach(([button, value]) => {
							updateSwitch(button, value);
						});
						updateSwitch(tempDisableBtn, settings.tempBlockingDisabled);
						tempDisableBtn.classList.toggle('error', settings.tempBlockingDisabled);
						updateLauncherModeButtons();
						panelOpacitySlider.value = settings.panelOpacity;
						panelOpacityValue.textContent = settings.panelOpacity.toFixed(2);
						toggleSizeSlider.value = settings.toggleSizeScale;
						toggleSizeValue.textContent = settings.toggleSizeScale.toFixed(1) + 'x';
						toggleOpacitySlider.value = settings.toggleOpacity;
						toggleOpacityValue.textContent = settings.toggleOpacity.toFixed(2);
						updateCornerButtons(settings.toggleBtnCorner);
						await refreshLegacyImportControls();
					}

				} catch (err) {
					console.error(SCRIPT_ID, "Restore failed:", err);
					if (err instanceof SyntaxError || err.message.includes("Invalid file content")) {
						showToast(STRINGS.restoreErrorInvalidFile, 'error');
					} else {
						showToast(STRINGS.restoreErrorGeneral, 'error');
					}
				} finally {
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

		document.addEventListener('touchstart', e => {
			if (!selecting) return;

			if (e.target.closest('.mobile-block-ui')) {
				return;
			}

			const touch = e.touches[0];
			touchStartX = touch.clientX;
			touchStartY = touch.clientY;
			touchMoved = false;

			const potentialTarget = getDeepElementFromPoint(touchStartX, touchStartY);
			if (potentialTarget && !potentialTarget.closest('.mobile-block-ui') && potentialTarget.tagName !== 'BODY' && potentialTarget.tagName !== 'HTML') {
				initialTouchedElement = potentialTarget;
			} else {
				initialTouchedElement = null;
			}
		}, {
			passive: true
		});

		document.addEventListener('touchmove', e => {
			if (!selecting || touchMoved || !e.touches[0]) return;

			if (e.target.closest('.mobile-block-ui')) return;


			const touch = e.touches[0];
			const dx = touch.clientX - touchStartX;
			const dy = touch.clientY - touchStartY;
			if (Math.sqrt(dx * dx + dy * dy) > moveThreshold) {
				touchMoved = true;
				if (selectedEl) {
					clearSelectionHighlight(selectedEl);
				}
				initialTouchedElement = null;
			}
		}, {
			passive: true
		});

		let launcherGestureLastTapAt = 0;
		let launcherGestureTapProgress = 0;
		let launcherGestureSuppressUntil = 0;
		document.addEventListener('touchstart', e => {
			const requiredFingers = settings.gestureFingerCount || 2;
			const requiredTaps = settings.gestureTapCount || 2;
			if (!settings.twoFingerGesture || e.touches.length !== requiredFingers) return;
			if (e.target.closest('.mobile-block-ui')) return;

			const now = Date.now();
			if (now - launcherGestureLastTapAt > 560) {
				launcherGestureTapProgress = 0;
			}
			launcherGestureLastTapAt = now;
			launcherGestureTapProgress += 1;

			if (launcherGestureTapProgress >= requiredTaps) {
				try {
					e.preventDefault();
					e.stopImmediatePropagation();
				} catch (err) {}
				launcherGestureLastTapAt = 0;
				launcherGestureTapProgress = 0;
				launcherGestureSuppressUntil = now + 260;
				touchMoved = true;
				initialTouchedElement = null;
				setBlockMode(!selecting);
			}
		}, {
			capture: true,
			passive: false
		});

		document.addEventListener('touchend', e => {
			if (Date.now() < launcherGestureSuppressUntil) {
				try {
					e.preventDefault();
					e.stopImmediatePropagation();
				} catch (err) {}
				touchMoved = false;
				initialTouchedElement = null;
				return;
			}
			if (!selecting) return;

			const touchEndTarget = e.target;

			if (touchEndTarget.closest('.mobile-block-ui .mb-btn') || touchEndTarget === toggleBtn || toggleBtn.contains(touchEndTarget)) {
				touchMoved = false;
				return;
			}
			if (touchEndTarget.closest('.mobile-block-ui')) {
				touchMoved = false;
				return;
			}


			if (!touchMoved) {
				try {
					e.preventDefault();
					e.stopImmediatePropagation();
				} catch (err) {
					console.warn(SCRIPT_ID, "Could not preventDefault/stopImmediatePropagation on touchend:", err);
				}
			} else {
				touchMoved = false;
				return;
			}

			const touch = e.changedTouches[0];
			if (!touch) return;

			let targetEl = initialTouchedElement;
			if (!targetEl || targetEl.closest('.mobile-block-ui')) {
				targetEl = getDeepElementFromPoint(touch.clientX, touch.clientY);
			}
			while (targetEl && (targetEl.nodeType !== 1 || targetEl.closest('.mobile-block-ui'))) {
				targetEl = getParentElement(targetEl);
			}

			if (targetEl && targetEl.tagName !== 'BODY' && targetEl.tagName !== 'HTML') {
				selectElement(targetEl, false);
			} else {
				removeSelectionHighlight();
				resetPreview();
				updateInfo();
				initialTouchedElement = null;
			}
		}, {
			capture: true,
			passive: false
		});

		slider.addEventListener('input', (e) => {
			if (!initialTouchedElement) {
				if (selectedEl) {
					initialTouchedElement = selectedEl;
				} else {
					return;
				}
			}
			resetPreview();
			const items = buildNavigationItems(initialTouchedElement);
			const next = items[parseInt(e.target.value, 10)];
			if (next && selectedEl !== next) selectElement(next, true);
		});

		function makePanelDraggable(el) {
			if (!el) return;
			let startX, startY, elementStartX, elementStartY, dragDeltaX, dragDeltaY, dragBounds;
			let dragging = false;
			let movedSinceStart = false;
			const dragThreshold = 5;
			const snapTransition = 'left 220ms cubic-bezier(0.22, 1, 0.36, 1), top 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1)';

			function clamp(value, min, max) {
				if (max < min) return min;
				return Math.max(min, Math.min(value, max));
			}

			function parsePx(value) {
				const parsed = parseFloat(value);
				return Number.isFinite(parsed) ? parsed : 0;
			}

			function getSafeAreaInsets() {
				const probe = document.createElement('div');
				probe.style.cssText = 'position:fixed;top:env(safe-area-inset-top,0px);right:env(safe-area-inset-right,0px);bottom:env(safe-area-inset-bottom,0px);left:env(safe-area-inset-left,0px);width:0;height:0;visibility:hidden;pointer-events:none;';
				document.documentElement.appendChild(probe);
				const style = getComputedStyle(probe);
				const insets = {
					top: parsePx(style.top),
					right: parsePx(style.right),
					bottom: parsePx(style.bottom),
					left: parsePx(style.left)
				};
				probe.remove();
				return insets;
			}

			function getPanelBounds() {
				const viewportWidth = window.innerWidth || document.documentElement.clientWidth || el.offsetWidth;
				const viewportHeight = window.innerHeight || document.documentElement.clientHeight || el.offsetHeight;
				const margin = viewportWidth >= 700 ? 20 : 16;
				const safeArea = getSafeAreaInsets();
				const width = Math.min(el.offsetWidth || el.getBoundingClientRect().width || viewportWidth, viewportWidth - margin * 2);
				const height = Math.min(el.offsetHeight || el.getBoundingClientRect().height || viewportHeight, viewportHeight - margin * 2);
				const minLeft = margin + safeArea.left;
				const maxLeft = Math.max(minLeft, viewportWidth - width - margin - safeArea.right);
				const minTop = margin + safeArea.top;
				const maxTop = Math.max(minTop, viewportHeight - height - margin - safeArea.bottom);
				return { viewportWidth, viewportHeight, width, height, minLeft, maxLeft, minTop, maxTop };
			}

			function getSnapCandidates() {
				const { viewportWidth, viewportHeight, width, height, minLeft, maxLeft, minTop, maxTop } = getPanelBounds();
				const centerLeft = clamp((viewportWidth - width) / 2, minLeft, maxLeft);
				const centerTop = clamp((viewportHeight - height) / 2, minTop, maxTop);
				const centerY = clamp((viewportHeight - height) / 2, minTop, maxTop);

				const candidates = [
					{ name: 'top-center', left: centerLeft, top: minTop },
					{ name: 'bottom-center', left: centerLeft, top: maxTop }
				];

				if (el !== panel) {
					candidates.push(
						{ name: 'center', left: centerLeft, top: centerTop },
						{ name: 'left-center', left: minLeft, top: centerY },
						{ name: 'right-center', left: maxLeft, top: centerY }
					);
				}

				return candidates;
			}

			function pickSnapCandidate(candidates) {
				if (!candidates.length) return null;
				const absoluteX = Math.abs(dragDeltaX || 0);
				const absoluteY = Math.abs(dragDeltaY || 0);
				let preferredName = '';

				if (el === panel) {
					if (absoluteY > 48) preferredName = dragDeltaY < 0 ? 'top-center' : 'bottom-center';
				} else if (absoluteX > 64 && absoluteX > absoluteY * 1.12) {
					preferredName = dragDeltaX < 0 ? 'left-center' : 'right-center';
				} else if (absoluteY > 64) {
					preferredName = dragDeltaY < 0 ? 'top-center' : 'bottom-center';
				}

				const preferred = preferredName && candidates.find(candidate => candidate.name === preferredName);
				if (preferred) return preferred;

				const rect = el.getBoundingClientRect();
				const centerX = rect.left + rect.width / 2;
				const centerY = rect.top + rect.height / 2;
				return candidates.reduce((best, candidate) => {
					const candidateCenterX = candidate.left + rect.width / 2;
					const candidateCenterY = candidate.top + rect.height / 2;
					const distance = Math.hypot(centerX - candidateCenterX, centerY - candidateCenterY);
					return !best || distance < best.distance ? { candidate, distance } : best;
				}, null)?.candidate || candidates[0];
			}

			function applySnap(candidate, animate = true) {
				if (!candidate) return;
				el.dataset.wasDragged = 'true';
				el.dataset.snapAnchor = candidate.name;
				if (el === panel) {
					panel.classList.toggle('dock-top', candidate.name === 'top-center');
					panel.classList.toggle('dock-bottom', candidate.name === 'bottom-center');
				}

				el.style.transition = animate ? snapTransition : 'none';
				el.style.left = `${Math.round(candidate.left)}px`;
				el.style.top = `${Math.round(candidate.top)}px`;
				el.style.right = 'auto';
				el.style.bottom = 'auto';
				el.style.transform = '';

				window.setTimeout(() => {
					if (!dragging && el.dataset.snapAnchor === candidate.name) {
						el.style.transition = '';
					}
				}, animate ? 220 : 0);
			}

			function snapToNearestAnchor(animate = true, anchorName = '') {
				const candidates = getSnapCandidates();
				const anchoredCandidate = anchorName && candidates.find(candidate => candidate.name === anchorName);
				applySnap(anchoredCandidate || pickSnapCandidate(candidates), animate);
			}

			el.addEventListener('touchstart', (e) => {
				const isInsideScrollable = e.target.closest('.scrollable-container');
				if (isInsideScrollable) {
					dragging = false;
					return;
				}

				const ignore = e.target.closest('button, input, select, textarea, .blocklist-item, .mb-slider, #blocker-info, #blocklist-container, #inspector-content, .inspector-pre, .inspector-row');
				if (ignore && el.contains(ignore)) return;

				if (e.touches.length > 1) return;
				dragging = true;
				movedSinceStart = false;

				const touch = e.touches[0];
				startX = touch.clientX;
				startY = touch.clientY;
				dragDeltaX = 0;
				dragDeltaY = 0;

				const rect = el.getBoundingClientRect();

				el.style.transition = 'none';
				el.style.transform = 'none';
				el.style.left = `${rect.left}px`;
				el.style.top = `${rect.top}px`;
				el.style.right = 'auto';
				el.style.bottom = 'auto';

				elementStartX = rect.left;
				elementStartY = rect.top;
				dragBounds = getPanelBounds();
				el.style.cursor = 'grabbing';
			}, {
				passive: true
			});

			el.addEventListener('touchmove', (e) => {
				if (!dragging || e.touches.length > 1) return;
				const touch = e.touches[0];
				const dx = touch.clientX - startX;
				const dy = touch.clientY - startY;
				dragDeltaX = dx;
				dragDeltaY = dy;

				if (!movedSinceStart && Math.sqrt(dx * dx + dy * dy) > dragThreshold) {
					movedSinceStart = true;
				}
				if (movedSinceStart) {
					e.preventDefault();
					const bounds = dragBounds || getPanelBounds();
					const newX = clamp(elementStartX + dx, bounds.minLeft, bounds.maxLeft);
					const newY = clamp(elementStartY + dy, bounds.minTop, bounds.maxTop);
					el.style.left = `${newX}px`;
					el.style.top = `${newY}px`;
				}
			}, {
				passive: false
			});

			el.addEventListener('touchend', () => {
				if (dragging && movedSinceStart) {
					snapToNearestAnchor();
				}
				dragging = false;
				movedSinceStart = false;
				dragBounds = null;
				el.style.cursor = 'grab';
			});

			el.addEventListener('touchcancel', () => {
				dragging = false;
				movedSinceStart = false;
				dragBounds = null;
				el.style.cursor = 'grab';
			});

			window.addEventListener('resize', () => {
				if (el.dataset.wasDragged === 'true' && el.dataset.snapAnchor && getComputedStyle(el).display !== 'none') {
					snapToNearestAnchor(false, el.dataset.snapAnchor);
				}
			}, { passive: true });
		}

		makePanelDraggable(panel);
		makePanelDraggable(settingsPanel);
		makePanelDraggable(listPanel);
		makePanelDraggable(inspectorPanel);

		const settingsScrollable = settingsPanel.querySelector('.scrollable-container');
		if (settingsScrollable) applyGradientMask(settingsScrollable);
		setupDomObserver();

		console.log(SCRIPT_ID, 'Initialization complete.');
	}

	async function run() {
		await loadSettings();
		registerRecoveryCommand();
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
