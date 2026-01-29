name: "plan-skill-create"

description: "アイデアから新規 SKILL.md のドラフトを生成し、\_drafts フォルダに保存する。"

version: "1.0.3"

author: "OWLight Development Team"

tags: \["workflow", "automation", "scaffold"]

triggers:

&nbsp; - "スキルドラフト作成"

&nbsp; - "タスク案作成"

---



\## 概要



機能のアイデアを入力とし、OWLight標準フォーマットの `SKILL.md` を生成しますが、\*\*あくまで「下書き（Draft）」として扱います。\*\*

生成物は `skills/\_drafts/` ディレクトリに保存され、人間が内容（特に依存関係やトリガー）をレビューし、正式なフォルダへ移動することで初めて有効化されます。



\## 実装内容



\### プロセス設計



1\.  \*\*Analyze \& ID Generation\*\*:

&nbsp;   - アイデアを解析し、スキルID（命名規則準拠）を仮決定する。



2\.  \*\*Draft Generation\*\*:

&nbsp;   - 必要な項目（概要、前提、実装内容、チェックリスト）を埋める。

&nbsp;   - \*\*注意\*\*: Descriptionには「（AI生成ドラフト）」と明記する。



3\.  \*\*Output to Draft\*\*:

&nbsp;   - `.cursor/skills/\_drafts/{SKILL\_ID}.md` に保存する。

&nbsp;   - もし `\_drafts` フォルダがない場合は作成する。



4\.  \*\*Notification\*\*:

&nbsp;   - 「ドラフトを作成しました: `.cursor/skills/\_drafts/{SKILL\_ID}.md`。内容を確認して正式な場所に移動してください」と出力する。



\## 安全装置（Guardrails）



\- \*\*Draft Isolation\*\*: 生成されたスキルは、レビューを経るまでエージェントから参照されない場所（`\_drafts`）に置かれます。

\- \*\*Over-Engineering Check\*\*: 1つのスキルに「DB設計」「API」「UI」すべてを詰め込もうとしている場合、AIはファイルを分割して作成するよう自律的に判断します。



\## チェックリスト

\- \[ ] `\_drafts/` 配下にファイルが生成されているか

\- \[ ] Descriptionにドラフトである旨が記載されているか

