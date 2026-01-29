name: "notify-api-realtime"

description: "Supabase Realtime 機能を使用して、通知（notifications）テーブルの変更イベントをクライアントにプッシュ配信する設定とロジックを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "notify", "api"]

triggers:

&nbsp; - "リアルタイム通知"

&nbsp; - "Push配信"

&nbsp; - "Realtime API"

---



\## 概要



通知テーブル（`notifications`）に新しいレコードが挿入された際、該当ユーザーのブラウザへ即座にプッシュ通知を送るためのバックエンド設定とクライアントサイドロジックを実装します。

Supabase の Realtime 機能（PostgreSQL Replication）を利用し、追加の WebSocket サーバーを立てずにセキュアなリアルタイム配信を実現します。



\## このスキルが前提とするもの



\- `notifications` テーブルが作成済みであり、Publication 設定が完了していること（`notify-table-schema` 完了済み）

\- `users` テーブルおよび認証基盤（`auth-api-session`）が存在すること

\- フロントエンドで `UserContext` 等から `user\_id` が取得可能であること



\## 実装内容



\### API / Backend 設定



\*\*Realtime 設定（SQL）\*\*



`notify-table-schema` で `ALTER PUBLICATION supabase\_realtime ADD TABLE public.notifications;` は実行済みであることを前提とします。

本スキルでは、RLSポリシーが正しく機能し、`INSERT` イベントが `receiver\_id` (user\_id) にのみ配信されることを確認します。



\### クライアントサイド実装（Hook）



\*\*Hook: `useNotificationSubscription.ts`\*\*



\- 機能：`notifications` テーブルの `INSERT` イベントを購読し、コールバックを実行

\- 引数：`userId` (string)

\- ロジック：

&nbsp; 1. `supabase.channel` を作成

&nbsp; 2. `postgres\_changes` をリッスン

&nbsp;    - event: `INSERT`

&nbsp;    - schema: `public`

&nbsp;    - table: `notifications`

&nbsp;    - filter: `user\_id=eq.${userId}`

&nbsp; 3. イベント受信時に `onNewNotification` コールバックを実行

&nbsp; 4. クリーンアップ時に `unsubscribe`



\### 通知作成ユーティリティ（Backend/Edge Functions用）



\*\*Utility: `createNotification`\*\*



\- 機能：他機能（ナレッジ作成、感謝、コメント等）から通知を作成するための共通関数

\- 引数：`{ userId, type, title, message, linkUrl, actorId }`

\- 処理：`notifications` テーブルへ `INSERT`（これにより Realtime が発火）



\## 参考資料



\- `/docs/14\_OWLIGHT\_BELL\_NOTIFICATIONS.md` （通知システム設計）

\- \[Supabase Realtime Documentation] (Listen to database changes)



\## チェックリスト



実装完了時に、以下をすべて確認：



\- \[ ] `useNotificationSubscription` フックが実装されていること

\- \[ ] ログインユーザーIDに対してフィルタリングされたイベントのみを受信すること

\- \[ ] 別のブラウザ/ウィンドウで通知を作成（INSERT）した際、即座にイベントが発火すること

\- \[ ] 受信したイベントデータにタイトルやメッセージが含まれていること

\- \[ ] ログアウト時に購読が解除（unsubscribe）されること

\- \[ ] RLSにより、他人の通知イベントが受信できないことを確認すること



\## 補足・注意事項



\- Supabase Realtime は「接続数」や「メッセージ数」に制限がある（プラン依存）ため、無駄な再接続を避けるよう `useEffect` の依存配列に注意してください。

\- ブラウザのデスクトップ通知（Web Push API）とは異なり、これは「アプリを開いている間のリアルタイム更新」です。オフライン時の通知が必要な場合は、別途 FCM 等の統合が必要ですが、MVPではアプリ内通知のみとします。

