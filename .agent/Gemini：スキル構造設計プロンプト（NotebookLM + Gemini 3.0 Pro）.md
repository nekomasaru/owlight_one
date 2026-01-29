Gemini：スキル構造設計プロンプト（NotebookLM + Gemini 3.0 Pro）

目的

NotebookLM に OWLight の仕様やドキュメントをソースとしてアップロード済です。Geminiが 以下を決めてください。




アクション単位（各フォルダ内のスキル）

実装順序（依存関係）

結果として、スキル一覧を CSV 形式で出力。その後、プロンプトで SKILL.md を自動生成する予定です。



以下、指示内容です。

【プロンプト】



text

あなたは OWLight プロジェクトのスキル構造設計エージェントです。【背景】OWLight は「ナレッジ駆動型組織変革AIプラットフォーム」です。NotebookLMの各ソースを参考にしてください。

【タスク】



OWLight を実装する際の「スキル構造」を設計してください。



具体的には、以下を決定して、CSV 形式で出力してください：



【出力形式】





```csv

スキル ID,スキル名,説明（1-2文）,コンポーネント種別,依存スキル,所要時間（分）



```





\### 【定義】





\*\*サブフォルダ ID\*\*：ケバブケース（例：tag-management）



\*\*サブフォルダ名\*\*：日本語で機能名（例：タグ管理機能）



\*\*スキル ID\*\*：ケバブケース、3-4 語（例：tag-api-crud）



\*\*スキル名\*\*：日本語でアクション内容（例：タグ API（CRUD）実装）



\*\*説明\*\*：1-2 文。「何をするのか」を明確に



\*\*コンポーネント種別\*\*：database / api /

ui-component / validation / integration のいずれか



\*\*依存スキル\*\*：前提となるスキル ID（カンマ区切り。なければ空欄）







\### 【スキル設計ルール】





1\. \*\*1 スキル = 1 アクション\*\*（以下を満たすことを確認）

   - 説明が 1-2 文で済む

   - テーブル 1-2 個、API 1-3 個、UI コンポーネント

1 個のみ

   - 所要時間 30-60 分

   - ファイル行数

100-300 行（推定）





2\. \*\*依存関係\*\*

   - database スキル

→ api スキル → ui-component スキル の順

   - 同じ機能内で最小限の依存関係（循環依存なし）





3\. \*\*実装順序\*\*

   - database スキルから開始

   - api スキル（最初の

API は database スキルに依存）

   - ui-component スキル（API スキルに依存）

   - validation スキル（最後に追加）





\### 【要件：OWLight の機能から導出】





【各機能のスキル分割例】



例：ナレッジ作成機能



```

サブフォルダ：knowledge-creation

スキル：

  1. knowledge-table-schema （テーブル作成）

  2. knowledge-api-create （API 実装）

  3. knowledge-api-update （API 実装）

  4. knowledge-markdown-parser （バリデーション・解析）

  5. knowledge-editor-ui （エディタコンポーネント）

  6. knowledge-preview-ui （プレビュー表示）

  7. knowledge-publish-dialog （公開確認ダイアログ）



```





\### 【出力内容】





1\. \*\*CSV テーブル\*\* → スキル一覧（全スキル）



2\. \*\*依存関係図\*\*（テキスト ASCII アート）→ スキル間の依存関係



3\. \*\*実装順序チェックリスト\*\* → 優先順位（Week

2 の実装スケジュール用）



4\. \*\*サマリー統計\*\* → 総スキル数、カテゴリ別スキル数など





\### 【制約条件】





\- 総スキル数：30-45 個（多すぎない）



\- 各サブフォルダあたりのスキル数：3-7 個



\- 各スキルの説明は必ず 1-2 文



\- 依存スキルは「同じサブフォルダ内」か「データレイヤー」のみ参照（UI スキル同士は依存させない）



\- 実装不可能な依存関係（循環など）はなし





\### 【出力例】





```csv

サブフォルダID,サブフォルダ名,スキルID,スキル名,説明,種別,依存スキル,時間



auth,ユーザー認証,auth-table-schema,ユーザーテーブル作成,users テーブルを作成する。,database,,45



auth,ユーザー認証,auth-api-login,ログイン

API,POST /auth/login を実装する。,api,auth-table-schema,40



auth,ユーザー認証,auth-api-logout,ログアウト API,POST /auth/logout を実装する。,api,auth-api-login,20



auth,ユーザー認証,auth-ui-login-form,ログインフォーム,ログイン画面の UI を実装する。,ui-component,auth-api-login,50



auth,ユーザー認証,auth-jwt-validation,JWT 検証,JWT トークン検証処理を実装する。,validation,auth-api-login,30



...



```





\### 【出力フォーマット】





\*\*1. CSV テーブル\*\*

（コピペで Excel にペースト可能な形式）





\*\*2. 依存関係図\*\*



```



auth-table-schema

    ↓



auth-api-login ← 他の API の共通依存

    ↓



auth-jwt-validation

    ↓



auth-ui-login-form





tag-table-schema

    ↓



tag-api-crud

    ↓



tag-ui-input / tag-ui-display / tag-search-filter



```





\*\*3. 実装順序（Week 2 の実装スケジュール）\*\*





```





\*\*4. サマリー統計\*\*





 【注意事項】





1\. \*\*NotebookLM を活用\*\*：ソースの内容から自動導出（矛盾がないか確認）



2\. \*\*Anthropic 公式ルール\*\*：「1 スキル = 1 アクション」を厳密に適用



3\. \*\*依存関係は最小限\*\*：スキル間の結合度を低くする



4\. \*\*実装順序は重要\*\*：database → api →

ui の順で、並列実装可能な設計



5\. \*\*CSV は Excel 対応\*\*：コンマ区切り、UTF-8 エンコード





---





\## 【完成後の流れ】





1\. \*\*このプロンプトで CSV 取得\*\* → スキル一覧確認



2\. \*\*スキル一覧を修正\*\*（削除・追加・リネーム）



3\. \*\*修正版 CSV をもとに、スキルごとのプロンプトを作成\*\*



4\. \*\*Gemini で SKILL.md 自動生成\*\*（バッチ実行）





---





\## 【成功条件】





```

✅ CSV が出力される

✅ 総スキル数が 30-45 個

✅ 各スキルの説明が 1-2 文

✅ 依存関係が循環していない

✅ 実装順序が妥当（database → api → ui）

✅ サマリー統計に説得力がある





