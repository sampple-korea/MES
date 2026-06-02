# MES (Mobile Element Selector)

Documentation: [한국어](README.md) · English · [中文](README-zh.md) · [日本語](README-ja.md)

MES is an advanced userscript for selecting and hiding web page elements on mobile browsers. It focuses on a compact touch-first UI, reliable selector generation, rule management, dynamic page reapplication, and privacy-aware inspection tools.

[Install from GitHub](https://raw.githubusercontent.com/sampple-korea/MES/refs/heads/main/MES.min.js) · [Source code](https://github.com/sampple-korea/MES)

## 2.1.3

MES 2.1.3 strengthens UI front-order protection so the MES button and panels stay on top even when external overlays or page UI are added later.

## 2.1.2

MES 2.1.2 prevents duplicate dashboard buttons from appearing inside iframes. Saved blocking rules and DOM watching still run inside iframes, but the visible button and panels are only created in the top-level page.

## 2.1.1

MES 2.1.1 adds UI language switching for Korean, English, Chinese, and Japanese. Korean remains the default language, and installation/update continues through GitHub raw `MES.min.js`.

## Key Features

- Mobile-first element picker with parent/child traversal
- Selection mode suppresses ad link, iframe, and fixed-layer click leakage
- Selector quality, risk, match count, preview, and save confirmation
- Precise, similar-pattern, attribute, class, resource, and advanced ad-pattern selector candidates
- Saved rule search, copy, enable/disable, current-site cleanup, backup, and restore
- Open Shadow DOM selection and host-scoped rules
- Dynamic page reapplication with optional low-power mode
- Blocking integrity protection when a page modifies hiding styles or rule stylesheets
- Inspector for HTML, computed CSS, script hints, page source, cookies, resources, and diagnostics
- Privacy mode for sensitive cookie and resource URL data
- Compact picker, magnetic panel snapping, gesture launcher, button launcher, and tablet layout support
- UI language setting: Korean, English, Chinese, Japanese

## Install

Open this userscript URL with Tampermonkey, Violentmonkey, or another userscript manager:

```text
https://raw.githubusercontent.com/sampple-korea/MES/refs/heads/main/MES.min.js
```

The same GitHub URL is used for updates.

## Basic Use

1. Install the script and open a website.
2. Tap the small MES launcher.
3. Touch the element you want to hide.
4. Adjust the parent/child range and preview the result.
5. Save the selector rule.
6. Manage saved rules from the list and settings panels.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `uiLanguage` | ko | UI language: Korean, English, Chinese, Japanese |
| `observeDomChanges` | true | Reapply rules on dynamic DOM changes |
| `lowPowerMode` | false | Reduce dynamic monitoring intensity |
| `shadowDomSupport` | true | Traverse open Shadow DOM |
| `selectorHintMode` | true | Generate enhanced selector hints |
| `privacyMode` | true | Mask sensitive cookie and resource URL data |
| `compactPickerMode` | true | Compact the picker after selecting an element |
| `hideToggleButton` | false | Use gesture launcher instead of button launcher |
| `hideStrategy` | stylesheet | Default hiding method |

## Development

```bash
npm ci
npm test
```

`npm test` builds the minified file, checks syntax, runs UI noise checks, and smoke-tests both source and minified builds.
