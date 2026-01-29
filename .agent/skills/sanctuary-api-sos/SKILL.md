name: "sanctuary-api-sos"

description: "心理的安全性確保のため、緊急時に管理者やメンターへ匿名でアラート（SOS）を送信するAPIを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "safety", "api"]

triggers:

&nbsp; - "SOS API"

&nbsp; - "緊急アラート"

&nbsp; - "匿名通報"

---



\## 概要



心理的安全性機能「サンクチュアリ（隠れ家）」の一部として、ユーザーが精神的に追い詰められた際や緊急のトラブル時に、ワンタップで管理者またはメンターに助けを求めることができる「SOSビーコン」のエンドポイントを実装します。

このAPIは、報告者の心理的負担を下げるために「匿名」での送信をサポートし、受信者（管理者）には「誰かからSOSが届きました」という形式で即時通知（`notifications` テーブルへの挿入）を行います。



\## このスキルが前提とするもの



\- `users` テーブルおよび `notifications` テーブルが既に存在すること

\- 認証基盤により `current\_user` が特定できること

\- 管理者権限（Role: manager/admin）を持つユーザーが特定可能であること



\## 実装内容



\### API 設計



\*\*POST /api/v1/safety/sos\*\*



\- 説明：管理者およびメンターへ緊急通知（SOS）を送信する

\- リクエスト：

&nbsp; ```json

&nbsp; {

&nbsp;   "is\_anonymous": true, // 匿名希望フラグ（デフォルト: true）

&nbsp;   "message": "緊急の相談があります。", // 任意メッセージ

&nbsp;   "context\_url": "/knowledge/123" // 困っている場所（任意）

&nbsp; }

レスポンス：



JSON



{

&nbsp; "success": true,

&nbsp; "message": "SOS sent successfully"

}

認証：Required



ロジック：



システム内の「管理者（Manager）」または「メンター」ロールを持つユーザーIDを検索。



対象ユーザーの notifications テーブルにレコードを作成。



type: 'sos\_alert'



sender\_id: is\_anonymous が true の場合は NULL（またはシステムID）、false の場合は current\_user.id。



content: { "message": "...", "original\_sender\_id": "uuid" } ※ 匿名の場合でも、万が一の生命の危機等のためにペイロード内には監査用としてIDを含めるが、UI上では隠す設計とする。



通知データ構造例（notifications テーブルへのINSERT）

JSON



{

&nbsp; "user\_id": "manager\_uuid",

&nbsp; "type": "sos\_alert",

&nbsp; "title": "⚡ SOSビーコンが受信されました",

&nbsp; "body": "メンバーから緊急の支援要請があります。確認してください。",

&nbsp; "link\_url": "/safety/inbox",

&nbsp; "is\_read": false

}

参考資料

/docs/04\_API\_SPECIFICATION.md （API仕様書全体）



/docs/01\_DATABASE\_SCHEMA.md （notifications テーブル定義）



/docs/06\_VALIDATION\_CHECKLIST.md （匿名性の検証項目）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] POST /api/v1/safety/sos が実装されていること



\[ ] 管理者ユーザー全員（または特定グループ）に対して通知が作成されること



\[ ] is\_anonymous: true の場合、通知の sender\_id が伏せられる（NULL等）こと



\[ ] 連続送信（スパム）を防ぐためのレート制限（例: 1分に1回まで）が考慮されていること



\[ ] 必須パラメータがない場合でもデフォルト値で動作すること



\[ ] 認証エラー（401）が適切にハンドリングされていること



補足・注意事項

このAPIは「命綱」となる機能です。サーバーエラー等で送信に失敗した場合は、クライアント側にはっきりとエラーを伝え、別の手段（直接連絡など）を促すようなレスポンス設計にしてください。



将来的にはメール送信やSlack連携も行いますが、本スキルでは notifications テーブルへの保存までをスコープとします。

