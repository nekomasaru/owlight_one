name: "a11y-check"

description: "自動ツール（axe-core）と手動チェックリストを用いて、主要画面のWCAG 2.1 Level AA準拠状況（キーボード操作、コントラスト比等）を検証する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "validation", "accessibility"]

triggers:

&nbsp; - "アクセシビリティ"

&nbsp; - "a11y"

&nbsp; - "WCAGチェック"

---



\## 概要



アプリケーションが全てのユーザーにとって利用可能であることを保証するため、アクセシビリティ検証を実施します。

CIパイプラインに `axe-core` ベースの自動スキャンを組み込んで基本的な違反（コントラスト比不足、ARIA属性ミス等）を検知するとともに、人間の手によるキーボードナビゲーションテストを行い、Tabキーでの操作性やフォーカスインジケータの視認性を確認します。







\## このスキルが前提とするもの



\- 主要なUIコンポーネント（ヘッダー、サイドバー、フォーム、ボタン）が実装済みであること

\- E2Eテスト環境（Playwright）が構築済みであること（`e2e-test-scenarios` 完了推奨）

\- UI ガイドライン（Teal #218F8D）に基づいた配色が適用されていること



\## 実装内容



\### 検証ロジック（Automated \& Manual）



\*\*1. 自動検証スクリプト (`tests/a11y.spec.ts`)\*\*



Playwright と `@axe-core/playwright` を統合し、主要ページごとのスナップショット検証を実装します。



```typescript

// 実装例

import { test, expect } from '@playwright/test';

import AxeBuilder from '@axe-core/playwright';



test.describe('Accessibility Checks', () => {

&nbsp; test('Dashboard should not have any automatically detectable a11y issues', async ({ page }) => {

&nbsp;   await page.goto('/home');

&nbsp;   const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

&nbsp;   expect(accessibilityScanResults.violations).toEqual(\[]);

&nbsp; });

&nbsp; 

&nbsp; // ログイン画面、検索画面、設定画面なども同様にテスト

});

2\. コントラスト比の検証



プライマリーカラー（Teal #218F8D）およびテキストカラーが、背景色に対して十分なコントラスト比（WCAG AA基準: 4.5:1以上）を確保しているか確認します。 特に、ボタン内の白文字や、ホバー時の色変化に注意します。



3\. キーボード操作チェックリスト



以下の項目を手動（または可能なら自動）で検証します：



Tab順序: 論理的な順序（左上→右下）でフォーカスが移動するか。



Focus Visible: フォーカスが当たっている要素に視覚的なインジケータ（青枠など）が表示されるか。



Keyboard Trap: 特定の要素にフォーカスが閉じ込められず、外に出られるか。



Interactive Elements: すべてのボタン、リンク、フォーム要素がEnter/Spaceキーで操作可能か。



Esc Key: モーダルやドロップダウンメニューがEscキーで閉じられるか。



参考資料

/docs/05\_UI\_UX\_GUIDELINES.md （アクセシビリティ基準とカラーパレット）



/docs/08\_TESTING\_STRATEGY.md （テスト戦略におけるa11yの位置付け）



Web Content Accessibility Guidelines (WCAG) 2.1



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] @axe-core/playwright をプロジェクトにインストール



\[ ] 主要ページ（Home, Search, Profile）に対する自動a11yテストを作成・パスすること



\[ ] 全てのインタラクティブ要素にフォーカスインジケータ（focus-visible）が表示されること



\[ ] 検索バー（GlobalSearchBar）が Cmd+K で開き、キーボードのみで操作・選択できること



\[ ] SOSボタンなどの画像/アイコンのみのボタンに aria-label が設定されていること



\[ ] フォーム入力エラー時、スクリーンリーダーがエラーメッセージを読み上げる設定（aria-describedby 等）になっていること



\[ ] プライマリーボタン（Teal背景）の文字色が読みやすいコントラスト比であること



補足・注意事項

自動テストで検出できるアクセシビリティの問題は全体の約30%〜50%と言われています。必ず実際のキーボード操作や、必要に応じてスクリーンリーダー（NVDA, VoiceOver）を用いた実機確認を行ってください。



「隠れ家ウィジェット」のような特殊なUIは、フォーカス管理（開いたときにフォーカスを移動、閉じたときに戻す）の実装漏れが起きやすいため、重点的に確認してください。

