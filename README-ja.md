# MES (Mobile Element Selector)

ドキュメント: [한국어](README.md) · [English](README-en.md) · [中文](README-zh.md) · 日本語

MES は、モバイルブラウザでページ要素を直接選択して非表示ルールを管理できる高度な userscript です。タッチ操作向けのコンパクト UI、安定したセレクタ生成、ルール管理、動的ページへの再適用、プライバシーを意識した検査機能を重視しています。

[GitHub からインストール](https://raw.githubusercontent.com/sampple-korea/MES/refs/heads/main/MES.min.js) · [ソースコード](https://github.com/sampple-korea/MES)

## 2.1.1

MES 2.1.1 では、韓国語、英語、中国語、日本語の UI 言語切り替えを追加しました。既定言語は韓国語のままで、インストールと更新は GitHub raw の `MES.min.js` を使用します。

## 主な機能

- モバイルタッチ向けの要素選択と親/子要素の探索
- 選択モードで広告リンク、iframe、固定レイヤーのクリック漏れを抑制
- 保存前のセレクタ品質、リスク、マッチ数、プレビュー確認
- 精密、類似パターン、属性、クラス、リソース、高度な広告パターン候補
- 保存ルールの検索、コピー、有効/無効、現在サイト整理、バックアップ、復元
- open Shadow DOM 内部の選択と host 範囲ルール
- 動的ページへの再適用と低負荷モード
- ページが非表示スタイルやルール stylesheet を変更した場合の復旧ロジック
- HTML、計算済み CSS、スクリプト手がかり、ページソース、Cookie、リソース、診断情報のインスペクタ
- Cookie とリソース URL の機密情報を保護するプライバシーモード
- コンパクト選択パネル、磁吸着パネル整列、ジェスチャー起動、ボタン起動、タブレットレイアウト
- 設定で韓国語、英語、中国語、日本語の UI 切り替え

## インストール

Tampermonkey、Violentmonkey などの userscript マネージャーで次の URL を開いてください。

```text
https://raw.githubusercontent.com/sampple-korea/MES/refs/heads/main/MES.min.js
```

更新にも同じ GitHub URL を使用します。

## 基本的な使い方

1. スクリプトをインストールし、対象サイトを開きます。
2. 小さな MES ランチャーをタップします。
3. 非表示にしたい要素をタッチします。
4. 親/子要素の範囲を調整してプレビューします。
5. セレクタルールを保存します。
6. 一覧と設定パネルで保存済みルールを管理します。

## 設定

| 設定 | 既定値 | 説明 |
| --- | --- | --- |
| `uiLanguage` | ko | UI 言語: 韓国語、英語、中国語、日本語 |
| `observeDomChanges` | true | DOM の動的変更時にルールを再適用 |
| `lowPowerMode` | false | 動的監視の強度を下げる |
| `shadowDomSupport` | true | open Shadow DOM を探索 |
| `selectorHintMode` | true | 強化セレクタヒントを生成 |
| `privacyMode` | true | 機密 Cookie とリソース URL 情報を保護 |
| `compactPickerMode` | true | 要素選択後にパネルをコンパクト化 |
| `hideToggleButton` | false | ボタンランチャーの代わりにジェスチャー起動を使用 |
| `hideStrategy` | stylesheet | 既定の非表示方式 |

## 開発

```bash
npm ci
npm test
```

`npm test` は minified ファイルをビルドし、構文チェック、UI ノイズチェック、source/minified 両方の smoke test を実行します。
