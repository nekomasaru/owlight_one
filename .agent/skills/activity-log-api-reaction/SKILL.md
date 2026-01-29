name: "activity-log-api-reaction"

description: "活動ログ（庁内掲示板）の投稿に対して、いいね等のリアクションをトグル（追加または削除）するAPIを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "activity-log", "api"]

triggers:

&nbsp; - "リアクションAPI"

&nbsp; - "いいねトグル"

&nbsp; - "Reaction Toggle"

---



\## 概要



庁内掲示板の投稿（Activity Log）に対して、職員がリアクション（いいね、拍手など）を行うためのエンドポイントを実装します。

このAPIは「トグル方式」で動作し、既にリアクション済みの場合は削除（取り消し）、未リアクションの場合は追加（新規登録）を行います。レスポンスには更新後のリアクション総数を含め、UIを即座に反映できるようにします。



\## このスキルが前提とするもの



\- `activity\_logs` および `reactions` テーブルが作成済みであること（`activity-log-table-schema` 完了済み）

\- `users` テーブルおよび認証基盤（`auth-api-session`）が存在すること

\- データベースのユニーク制約（`activity\_log\_id`, `user\_id`, `reaction\_type`）が設定されていること



\## 実装内容



\### API 設計



\*\*POST /api/v1/activity-logs/:id/reactions\*\*



\- 説明：指定した投稿へのリアクションをトグル（追加/削除）する

\- パスパラメータ：`id` (Activity Log UUID)

\- リクエスト：`{ reaction\_type: "like" | "clap" | "heart" }`

\- レスポンス：

&nbsp; ```json

&nbsp; {

&nbsp;   "success": true,

&nbsp;   "data": {

&nbsp;     "action": "added", // "added" または "removed"

&nbsp;     "reaction\_type": "like",

&nbsp;     "current\_count": 13, // 更新後の該当リアクションの総数

&nbsp;     "is\_active": true // ユーザーが現在リアクションしている状態か

&nbsp;   }

&nbsp; }

認証：Required



ロジック：



reactions テーブルを検索（activity\_log\_id, user\_id, reaction\_type）。



レコードが存在する場合 → DELETE（削除）を実行。



レコードが存在しない場合 → INSERT（追加）を実行。



該当 reaction\_type の最新カウントを集計して返却。



エラーハンドリング

400 Bad Request: reaction\_type が許可されていない文字列の場合。



404 Not Found: 指定された activity\_log\_id が存在しない場合。



409 Conflict: 同時アクセス等で整合性が取れない場合（通常はトグル処理で回避）。



参考資料

/docs/04\_API\_SPECIFICATION.md （API仕様書全体）



/docs/01\_DATABASE\_SCHEMA.md （reactions テーブル定義）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] POST /api/v1/activity-logs/:id/reactions が実装されていること



\[ ] 初回リクエストでリアクションが追加（INSERT）され、action: "added" が返ること



\[ ] 2回目のリクエストでリアクションが削除（DELETE）され、action: "removed" が返ること



\[ ] レスポンスの current\_count が正しく増減していること



\[ ] reaction\_type のバリデーション（許可リストチェック）が機能すること



\[ ] 存在しない投稿IDを指定した場合に 404 エラーが返ること



\[ ] 認証ヘッダーがない場合に 401 エラーが返ること



補足・注意事項

リアクション連打による負荷対策として、フロントエンド側でデバウンス（Debounce）処理を入れることが望ましいですが、API側でも短時間の連続リクエストを捌けるよう、トランザクション管理に注意してください。



将来的には reactions テーブルへの INSERT をトリガーにして、投稿者に通知を送る機能（notify-api-realtime）と連携します。

