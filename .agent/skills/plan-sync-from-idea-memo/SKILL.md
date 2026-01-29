name: "plan-sync-from-idea-memo"

description: "アイデアメモ（IDEAS.md）を解析し、仕様書への反映案（ドラフト）を作成する。※直接の上書きは行わない"

version: "1.0.3"

author: "OWLight Development Team"

tags: \["workflow", "planning", "draft"]

triggers:

&nbsp; - "アイデア反映案作成"

&nbsp; - "仕様変更ドラフト"

---



\## 概要



`IDEAS.md` の内容を読み取り、`docs/` 配下の仕様書にどう組み込むべきかを分析します。

既存ドキュメントを直接変更するのではなく、\*\*変更差分案をまとめた `PLAN\_UPDATE\_PROPOSAL.md` を生成\*\*します。開発者はその内容を確認し、問題なければ手動（または別の承認コマンド）で反映します。



\## 実装内容



\### プロセス設計



1\.  \*\*Read \& Validate\*\*:

&nbsp;   - `IDEAS.md` を読み込む。

&nbsp;   - 既存の `docs/` ドキュメントと矛盾がないか強力にチェックする。

&nbsp;   - \*\*警告\*\*: 明らかな矛盾（例: RDB前提なのにNoSQLを提案など）がある場合は、処理を中断しレポートする。



2\.  \*\*Drafting (案の作成)\*\*:

&nbsp;   - 以下の形式で `PLAN\_UPDATE\_PROPOSAL.md` を作成する。

&nbsp;   ```markdown

&nbsp;   # 仕様変更提案レポート

&nbsp;   

&nbsp;   ## 1. docs/00\_PROJECT\_OVERVIEW.md への変更案

&nbsp;   - \[追加] Future Scope に「ログインボーナス」を追加

&nbsp;   

&nbsp;   ## 2. docs/01\_DATABASE\_SCHEMA.md への変更案

&nbsp;   - \[追加] `users` テーブルに `last\_login\_at` カラムを追加

&nbsp;   ```



3\.  \*\*Review Request\*\*:

&nbsp;   - 「提案ファイルを作成しました。内容を確認し、問題なければ反映してください」とメッセージを出力して終了する。



\## 安全装置（Guardrails）



\- \*\*No Auto-Merge\*\*: このスキルは決して既存の `.md` ファイルを上書きしてはいけません。

\- \*\*Scope Check\*\*: アイデアが「MVPスコープ」を逸脱していないか、AIが批判的に評価します。



\## チェックリスト

\- \[ ] `PLAN\_UPDATE\_PROPOSAL.md` が生成されているか

\- \[ ] 既存ファイルが変更されていないこと

