# MES (Mobile Element Selector)

Mobile Element Selector is a mobile-first userscript for selecting page elements and saving hide rules from an on-page Material 3 control panel.

[Greasy Fork](https://greasyfork.org/en/scripts/534270-mes-mobile-element-selector) · [Install script](https://update.greasyfork.org/scripts/534270/MES%28Mobile%20Element%20Selector%29.user.js) · [Source](https://github.com/sampple-korea/MES)

## Overview

MES helps you build element-blocking rules directly from a mobile browser. It focuses on touch-friendly selection, previewing, rule persistence, and simple export/import so the script can be used as a lightweight companion to browser or DNS-level filtering.

## Features

- Touch-friendly element picker for mobile pages
- CSS selector generation with preview and restore controls
- Saved hide rules through userscript storage
- Optional site-scoped rule output
- AdGuard-style selector copy flow
- Adjustable panel opacity, toggle size, and toggle opacity
- Rule backup and restore through JSON
- Optional AdGuard icon on the floating toggle

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
| `panelOpacity` | 0.55 | 설정/차단 패널의 투명도 |
| `toggleSizeScale` | 1.0 | 토글 버튼 크기 비율 |
| `toggleOpacity` | 1.0 | 토글 버튼 투명도 |
| `showAdguardLogo` | false | AdGuard 로고 표시 여부 |

## Notes

- MES is optimized for mobile layouts and touch interaction.
- Some websites may block userscript behavior or rebuild hidden elements dynamically.
- Back up your rule list before clearing browser storage or changing userscript managers.
- The project is distributed under the Apache License, Version 2.0. Redistributions must preserve the attribution notices in `NOTICE`.
