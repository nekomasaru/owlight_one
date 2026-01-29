name: "auth-api-session"
description: "Supabase Auth と連携し、ログイン・ログアウト処理およびフロントエンドへのセッション情報提供（UserContext）を行うAPIを実装する。"
version: "1.0.0"
author: "OWLight Development Team"
tags: ["feature", "auth", "api"]
triggers:
  - "セッションAPI"
  - "ログイン処理"
  - "UserContext"
---

## 概要

認証プロセスのバックエンドロジックと、フロントエンドの状態管理（UserContext）にデータを提供するAPI群を実装します。
具体的には、Supabase Auth のラッパーとなるログイン・ログアウトエンドポイントと、現在のユーザー情報（プロフィール含む）を取得するセッション確認エンドポイントを作成します。

## このスキルが前提とするもの

- `users` テーブルおよび `profiles` テーブルが作成済みであること（`auth-table-schema` 完了済み）
- Supabase クライアントの初期設定（環境変数 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 等）が完了していること
- Next.js の API Routes (App Router / Route Handlers) 基盤が存在すること

## 実装内容

### API 設計

**POST /api/v1/auth/login**

- 説明：メールアドレスとパスワードによるログイン処理（Supabase Auth `signInWithPassword` のラッパー）
- リクエスト：`{ email: string, password: string }`
- レスポンス成功：`{ success: true, session: { access_token, user: { id, email, ... } } }`
- レスポンスエラー：`{ success: false, error: { message: "Invalid credentials" } }`
- 備考：HttpOnly Cookie によるセッション管理を行う場合は、Supabase SSR パッケージの使用を検討

**POST /api/v1/auth/logout**

- 説明：ログアウト処理（Supabase Auth `signOut` のラッパー）
- リクエスト：なし
- レスポンス成功：`{ success: true }`
- 認証：Required

**GET /api/v1/auth/session**

- 説明：現在のセッションユーザー情報と、紐づく `public.users` / `public.profiles` 情報を結合して取得
- リクエスト：なし（Cookie/Header からトークン参照）
- レスポンス成功：
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "山田 太郎",
      "avatar_url": "...",
      "role": "authenticated"
    }
  }

```

* 認証：Required（未認証時は 401）

### フロントエンド連携用フック（参考）

API 実装に加え、これらを利用する React Context (`UserContext.tsx`) のための型定義を含めます。

```typescript
// types/auth.ts
export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  // ...その他 profile 情報
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

```

## 参考資料

* `/docs/04_API_SPECIFICATION.md` （認証API仕様）
* `/docs/06_SECURITY_RLS.md` （認証後のアクセス制御）
* [Supabase Auth Helpers for Next.js Documentation]

## チェックリスト

実装完了時に、以下をすべて確認：

* [ ] `POST /api/v1/auth/login` が実装され、正しい認証情報でトークンが返る
* [ ] `POST /api/v1/auth/logout` が実装され、セッションが無効化される
* [ ] `GET /api/v1/auth/session` が実装され、`public.users` の情報（display_name等）も結合されて返る
* [ ] エラーハンドリング（パスワード間違い、存在しないユーザー等）が実装されている
* [ ] レスポンス形式が共通フォーマット `{ success: boolean, data?: ..., error?: ... }` に準拠している
* [ ] API ルートが Next.js App Router 形式（`app/api/.../route.ts`）で記述されている

## 補足・注意事項

* Supabase のクライアントサイド認証（`supabase.auth.signInWith...`）を直接使う場合でも、`GET /api/v1/auth/session` はサーバーサイドでの検証やプロフィール情報の取得に有用です。
* UserContext の完全な実装は、次の `auth-ui-login` や `auth-ui-morning-ritual` スキルで行いますが、ここではそのためのデータ供給路を確保します。
