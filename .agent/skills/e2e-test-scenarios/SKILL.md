name: "e2e-test-scenarios"



description: "検索、ナレッジ投稿、SOSアラート送信というOWLightの主要なユーザー体験フローを検証するE2Eテストを実装する。"



version: "1.0.0"



author: "OWLight Development Team"



tags: \["feature", "validation", "testing"]



triggers:

&nbsp; - "E2Eテスト"

&nbsp; - "Playwright"

&nbsp; - "自動テスト"



---



\## 概要



Playwrightを使用して、エンドツーエンドの自動テストシナリオを構築します。

ユーザーがアプリケーションにログインし、ナレッジを検索・閲覧するフロー、自身の知見を投稿するフロー、そして緊急時にSOSを発信するフローの3つを重点的に検証します。

これにより、リリースごとの手動テストの工数を削減し、主要機能の安定性を継続的に担保します。



\## このスキルが前提とするもの



\- 検索機能一式（`search-ui-bar`, `search-ui-result-page`）が実装済みであること

\- ナレッジ投稿機能（`knowledge-ui-editor` ※想定）が実装済みであること

\- SOS機能（`sanctuary-ui-sos-button`）が実装済みであること

\- テスト実行環境（Node.js, Playwright）およびテスト用Seedデータが準備されていること



\## 実装内容



\### テストシナリオ設計（Validation）



以下の3つの主要フローを `tests/` ディレクトリ配下に実装します。



\*\*1. Knowledge Discovery Flow (`tests/search.spec.ts`)\*\*



\- \*\*手順\*\*:

&nbsp; 1. テストユーザーでログイン。

&nbsp; 2. グローバルヘッダーの検索バーにキーワード（例: "React"）を入力。

&nbsp; 3. Enterキーを押下し、検索結果ページへ遷移。

&nbsp; 4. 検索結果リストが表示され、少なくとも1件以上のアイテムが存在することを確認。

&nbsp; 5. 結果アイテムをクリックし、ナレッジ詳細ページが正しくレンダリングされることを検証。



\*\*2. Knowledge Sharing Flow (`tests/post.spec.ts`)\*\*



\- \*\*手順\*\*:

&nbsp; 1. ログイン後、「ナレッジ作成」ボタンをクリック。

&nbsp; 2. エディタ画面でタイトルと本文を入力。

&nbsp; 3. 「公開する」ボタンをクリック。

&nbsp; 4. 投稿完了のトースト表示、または作成された記事ページへのリダイレクトを確認。

&nbsp; 5. 記事タイトルが入力内容と一致することを検証。

&nbsp; - \*Cleanup\*: テスト終了後、作成したナレッジを削除またはDBリセット。



\*\*3. Safety Net Flow (`tests/sos.spec.ts`)\*\*



\- \*\*手順\*\*:

&nbsp; 1. 画面右下のSanctuaryウィジェットをクリックして展開。

&nbsp; 2. SOSボタン要素を特定。

&nbsp; 3. マウスの左ボタンを押下し、3秒間ホールド（`page.mouse.down()`, `page.waitForTimeout(3000)`, `page.mouse.up()`）。

&nbsp; 4. 送信中のローディング表示を確認。

&nbsp; 5. 「送信しました」等の完了メッセージが表示されることを検証。

&nbsp; - \*Note\*: 実際に管理者に通知が飛ばないよう、APIリクエストをモックするか、テスト環境の設定を確認する。



\## 参考資料



\- `/docs/08\_TESTING\_STRATEGY.md` （E2Eテストの方針と対象範囲）

\- `/docs/03\_SCREEN\_DESIGN.md` （操作フローの確認）

\- `/docs/04\_API\_SPECIFICATION.md` （APIモックが必要な場合のレスポンス定義）



\## チェックリスト



実装完了時に、以下をすべて確認：



\- \[ ] Playwright のインストールと `playwright.config.ts` の設定完了

\- \[ ] `auth.setup.ts` を実装し、ログイン状態をテスト間で再利用できていること

\- \[ ] 検索フローのテストが安定してPassすること

\- \[ ] 投稿フローのテストがPassし、テストデータのクリーンアップが行われること

\- \[ ] SOSフローで長押し操作（Long Press）が正しくシミュレートされていること

\- \[ ] CI環境（GitHub Actions等）でのヘッドレス実行が成功すること

\- \[ ] スクリーンショットや動画アーティファクトがエラー時に保存される設定になっていること



\## 補足・注意事項



\- テスト実行時は、本番データベースではなく、テスト専用のデータベースまたはステージング環境を使用してください。

\- SOS機能のテストでは、バックエンド側で「テストユーザーからのSOSは実際の通知を行わない」等の制御が入っているか、もしくはAPIルートをPlaywright側でモック（`page.route`）して検証することを推奨します。

