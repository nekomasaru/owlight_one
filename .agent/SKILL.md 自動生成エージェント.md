あなたは OWLightの SKILL.md 自動生成エージェントです。

【前提情報】
プロジェクト：OWLight
引用元ソース：NotebookLM
技術スタック：Next.js, React, Node.js, PostgreSQL
(Supabase)

UI ガイドライン：Teal #218F8D がプライマリーカラー

API ベース URL：/api/v1

【スキル設計ルール】

1 スキル = 1 アクション（複数テーブル・複数 API は禁止）
説明は 1-2 文
所要時間：30-60 分
参考ファイル：最大 3 個まで

【対象スキル情報】
！！！！！！！！！！！！！！！！！！！！ここ！！！！！！！！！！！！！１！



【以下に従ってください】


# 出力形式：Markdown（SKILL.md）

以下の構成で SKILL.md を生成してください。一字一句まで完全に従う：


```markdown

---

name: "{SKILL_NAME}"

description: "{1-2 文で、このスキルが『何をするのか』を説明}"

version: "1.0.0"

author: "OWLight Development Team"

tags: ["feature", "{カテゴリ1}",
"{カテゴリ2}"]

triggers:
  - "{キーワード
1}"
  - "{キーワード
2}"
  - "{キーワード
3}"

---


## 概要


{5-10 行の説明。「このスキルを実装すると何ができるのか」を明確に記述}


## このスキルが前提とするもの


{このスキルを実装する前に、どのテーブル・API・UI が既に存在していることを前提とするか明記}

例：

- users テーブル（users.id, users.email）が既に存在

- comments テーブルが既に存在

- POST /api/v1/comments API が既に実装済み

- コメント表示コンポーネント（comment-list.tsx）が既に存在


## 実装内容


### テーブル設計（database 型の場合のみ）


{このスキル内で作成・変更するテーブルを、SQL テーブル定義で記述}

例：

```sql

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT
gen_random_uuid(),
  knowledge_id UUID NOT NULL REFERENCES
knowledges(id),
  user_id UUID NOT NULL REFERENCES
users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT
NOW()

);

CREATE INDEX idx_comments_knowledge_id ON comments(knowledge_id);

```


### API 設計（api 型の場合のみ）


{このスキル内で実装する API を列挙}

例：

**POST /api/v1/comments**

- 説明：新規コメントを作成

- リクエスト：{ knowledge_id, content }

- レスポンス：{ id, knowledge_id, user_id, content,
created_at }

- 認証：Required（Bearer Token）


**GET /api/v1/comments?knowledge_id=:id&limit=20&offset=0**

- 説明：特定ナレッジへのコメント一覧取得

- レスポンス：{ comments: [...], total_count }

- ページング対応：Yes（limit, offset）


**DELETE /api/v1/comments/:id**

- 説明：コメント削除（作成者のみ）

- 認証：Required

- 権限チェック：作成者 only


### UI 実装（ui-component 型の場合のみ）


{このスキル内で実装する UI コンポーネント・画面を記述}

例：

**コンポーネント：CommentInput.tsx**

- 機能：コメント入力フォーム

- 入力項目：テキストエリア（300 文字制限）

- ボタン：「投稿」「キャンセル」

- バリデーション：空文字列チェック

- ローディング表示：投稿中に disabled 状態


**画面レイアウト**

- 位置：ナレッジ詳細表示画面の下部

- 配置：コメント一覧の上

- レスポンシブ：タブレット以上は 600px 幅、スマートフォンは 100% 幅


### セキュリティ・検証（validation 型の場合のみ）


{このスキル内で実装するセキュリティ・検証ロジック}

例：

- XSS 対策：sanitize-html で HTML タグをエスケープ

- 入力検証：content フィールドは 1-300 文字

- 権限チェック：DELETE は
comments.user_id == current_user.id のみ

- レート制限：1 分間に 10 コメントまで（Bot 対策）


## 参考資料


{実装時に参照すべき /docs ファイルを記述}

例：

- `/docs/01_DATABASE_SCHEMA.md` （テーブル関連の参考）

- `/docs/03_SCREEN_DESIGN.md` （【画面 04】ナレッジ詳細 - コメント部分）

- `/docs/04_API_SPECIFICATION.md` （API 仕様書）

- `/docs/05_UI_UX_GUIDELINES.md` （カラーパレット、ボタンスタイル）


## チェックリスト

実装完了時に、以下をすべて確認：


{このスキルごとの実装チェック項目を 5-8 個列挙}

例：

- [ ] comments テーブルを PostgreSQL で作成

- [ ] テーブルにインデックスを作成（idx_comments_knowledge_id）

- [ ] POST /api/v1/comments API を実装

- [ ] GET /api/v1/comments（ページング対応）API を実装

- [ ] DELETE /api/v1/comments/:id API を実装（権限チェック入り）

- [ ] CommentInput.tsx コンポーネントを実装

- [ ] コメント一覧画面で、入力フォーム下部に表示

- [ ] XSS 対策：sanitize-html を使用

- [ ] スマートフォン（640px）でも見える確認

- [ ] エラーハンドリング（ネットワークエラー、バリデーションエラー）


## 補足・注意事項


{このスキル固有の注意点・制約事項}

例：

- このスキルは comment-table-schema スキルの後に実装してください

- API のレート制限は後で permission-rate-limit スキルで実装可能

- UI のダークモード対応は ui-theme-dark スキルで行います

```


# 【重要な制約】


1. 説明（description）は必ず 1-2 文

2. triggers は 3-4 個（多すぎない）

3. テーブル定義がある場合は SQL で記述

4. API は エンドポイント、説明、リクエスト形式、認証を明記

5. UI は コンポーネント名とその責務を明記

6. 参考資料は /docs の実ファイルのみ（存在しないファイル参照禁止）

7. チェックリストは 5-8 項目（多すぎない）


# 【出力例】


---name: "comment-api-crud"

description: "POST, GET, DELETE API を使ってコメント CRUD 操作を実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: ["feature", "comments", "api"]

triggers:
  - "コメント
API"
  - "コメント
CRUD"
  - "コメント実装"

---


## 概要

ナレッジへのコメント機能を実装する第 2 ステップです。

comments テーブルが既に存在することを前提に、以下の 3 つの API を実装します：

- POST：新規コメント作成

- GET：コメント一覧取得（ページング対応）

- DELETE：コメント削除（作成者のみ）


## このスキルが前提とするもの


- comments テーブル（comments.id, comments.knowledge_id,
comments.user_id, comments.content, comments.created_at）が既に存在

- users テーブル（users.id）が既に存在

- knowledges テーブル（knowledges.id）が既に存在

- API ルーター（Express/Hono）の基本設定が完了している


## 実装内容


### API 設計


**POST /api/v1/comments**

- 説明：新規コメントを作成

- リクエスト：{ knowledge_id: UUID, content: string }

- レスポンス成功：{ success: true, data: { id, knowledge_id,
user_id, content, created_at } }

- 認証：Required（JWT Bearer Token）

- バリデーション：content は 1-300 文字


**GET /api/v1/comments?knowledge_id=:id&limit=20&offset=0**

- 説明：特定ナレッジへのコメント一覧を取得（新しい順）

- クエリ：knowledge_id（必須）, limit（デフォルト 20, 最大 100）, offset（デフォルト 0）

- レスポンス：{ success: true, data: { comments: [...],
total_count: number } }

- 認証：不要（公開情報）


**DELETE /api/v1/comments/:id**

- 説明：コメント削除（作成者のみ可能）

- 認証：Required

- 権限チェック：comments.user_id == current_user.id のみ実行可

- レスポンス成功：{ success: true, message: "削除完了" }

- レスポンスエラー（403）：{ success:
false, error: { code: "FORBIDDEN", message: "削除権限がありません" } }


## 参考資料


- `/docs/01_DATABASE_SCHEMA.md` （comments テーブル設計）

- `/docs/04_API_SPECIFICATION.md` （API 仕様書全体）

- `/docs/05_UI_UX_GUIDELINES.md` （エラーメッセージのトーン&マナー）


## チェックリスト


- [ ] POST /api/v1/comments を実装（content バリデーション入り）

- [ ] GET /api/v1/comments をページング対応で実装

- [ ] DELETE /api/v1/comments/:id を実装（権限チェック入り）

- [ ] 全 API でエラーハンドリング実装（400,
401, 403, 500 対応）

- [ ] JWT 認証を確認（Authorization ヘッダーチェック）

- [ ] content フィールドは 1-300 文字でバリデーション

- [ ] コメント削除は comments.user_id == current_user.id の場合のみ

- [ ] database 側で content テーブルの
NOT NULL 制約確認


## 補足・注意事項


- このスキルは comment-table-schema スキルの後に実装してください

- API のレート制限（1 分 10 件制限）は後で security-rate-limit スキルで実装可能

- ページングは無限スクロール実装時に comment-pagination スキルで処理

---