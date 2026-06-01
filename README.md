# MES (Mobile Element Selector)

Mobile Element Selector is a mobile-first userscript for selecting page elements and saving hide rules from an on-page Material 3 control panel.

[Greasy Fork](https://greasyfork.org/en/scripts/534270-mes-mobile-element-selector) · [Install script](https://update.greasyfork.org/scripts/534270/MES%28Mobile%20Element%20Selector%29.user.js) · [Source](https://github.com/sampple-korea/MES)

## Overview

MES helps you build and manage element-blocking rules directly from a mobile browser. It focuses on touch-friendly selection, resilient selector generation, clean inspection tools, and persistent per-site hiding rules without requiring desktop developer tools.

## Features

- Touch-friendly element picker with parent/child hierarchy navigation
- Stable CSS selector generation with match-quality hints and broad-selector confirmation
- Persistent hide rules with search, copy, current-site cleanup, backup, and restore
- Shadow DOM selection with host-scoped rules for open shadow roots
- Dynamic page monitoring that reapplies rules to later DOM and Shadow DOM changes
- Preview/restore flow plus display, visibility, and opacity hiding strategies
- Element inspector for HTML, computed CSS, script hints, page source, cookies, resources, and diagnostics
- Privacy mode that masks cookies and redacts sensitive resource URLs by default
- Cookie copy/edit/delete controls for browser-visible cookies, with privacy confirmation on raw value copy
- URL and arbitrary attribute extraction helpers with sensitive-value confirmation
- Compact Apple-style mobile UI, tablet-aware layout, switch controls, and gesture or button launcher modes
- Small low-contrast launcher with a fixed 44px touch target and optional shield icon

## Install

Install a userscript manager such as Tampermonkey, Violentmonkey, or AdGuard userscripts, then open the install URL:

```text
https://update.greasyfork.org/scripts/534270/MES%28Mobile%20Element%20Selector%29.user.js
```

## Usage

1. Open a website after installing the script.
2. Tap the floating MES toggle.
3. Select the element you want to hide.
4. Preview the result, then save the rule.
5. Use the list/settings panel to copy, delete, back up, or restore rules.

## Settings

| 설정 항목 | 기본값 | 설명 |
| --- | --- | --- |
| `includeSiteName` | true | 차단 규칙에 사이트 이름을 포함할지 여부 |
| `panelOpacity` | 0.94 | 설정/차단 패널의 투명도 |
| `toggleSizeScale` | 1.0 | 토글 버튼 크기 비율 |
| `toggleOpacity` | 1.0 | 토글 버튼 투명도 |
| `showAdguardLogo` | false | AdGuard 로고 표시 여부 |
| `observeDomChanges` | true | 동적 DOM 변경 시 저장 규칙 재적용 |
| `shadowDomSupport` | true | open Shadow DOM 내부 요소 탐색 |
| `selectorHintMode` | true | 안정적인 선택자 힌트 생성 |
| `privacyMode` | true | 쿠키와 리소스 URL의 민감 정보 보호 |
| `hideStrategy` | display | 요소 숨김 방식 |

## Notes

- MES is optimized for mobile layouts and touch interaction.
- Some websites may block userscript behavior or rebuild hidden elements dynamically.
- Cookie editing and deletion are limited to cookies exposed by `document.cookie`; HttpOnly cookies and some original Domain/Path/SameSite attributes cannot be inspected by browser userscripts.
- Back up your rule list before clearing browser storage or changing userscript managers.
- The project is distributed under the Apache License, Version 2.0. Redistributions must preserve the attribution notices in `NOTICE`.
