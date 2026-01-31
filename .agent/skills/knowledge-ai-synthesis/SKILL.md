name: "knowledge-ai-synthesis"
description: "Gemini 2.5 Flash を使用し、チャットログや添付ファイルから背景・根拠・具体例を含む構造化された知恵（Wisdom）JSONを生成するAPIを実装する。"
version: "2.0.0"
author: "OWLight Development Team"
tags: ["feature", "wisdom", "api", "ai"]
triggers:
  - "AI蒸留"
  - "Gemini連携"
  - "知恵生成"
---

## 概要

OWLight の核心機能である「知恵の蒸留（Wisdom Distillation）」ロジックを実装します。

Gemini 2.5 Flash Lite にチャット履歴や添付ファイルを送信し、新しいテーブル構造（`wisdoms`, `wisdom_references`, `wisdom_cases`）に適合する高品質なJSONを生成します。

## 実装内容

### プロンプト設計 (Intent-Based)

ユーザーの意図に基づき、新しい `Wisdom` スキーマに合わせた出力を要求します。

1. **Output Schema (Wisdom)**:
   ```json
   {
     "title": "要約タイトル",
     "content": "詳細な解説全文（Markdown）",
     "summary": "一言でわかる重要ポイント",
     "references": [
       { "title": "根拠名", "reference_type": "law | regulation | ...", "citation": "..." }
     ],
     "cases": [
       { "title": "事例名", "case_type": "success | failure", "situation": "...", "action": "...", "result": "..." }
     ],
     "tags": ["タグ1", "タグ2"]
   }
   ```

2. **System Instruction**:
   「あなたは行政・法務の専門家です。提供されたコンテキストから、後世に役立つ『知恵（Wisdom）』を抽出してください。単なる要約ではなく、根拠（References）と成功/失敗事例（Cases）を分離して構造化することが最も重要です。」

### 実装時の注意点

- **ID型**: 生成されたデータが既存の知恵を更新（Refine）する場合、IDは `SERIAL`（整数）として扱います。
- **タグの正規化**: 生成されたタグが既存の `tags` テーブルにあるか確認するロジック、またはプロンプトでの指示を強化します。

### チェックリスト
- [ ] 生成結果が `wisdoms`, `references`, `cases` の新しい構造と一致しているか
- [ ] 根拠（References）の種類が列挙型（law, regulation等）に適合しているか
- [ ] 事例（Cases）の種類が列挙型（success, failure等）に適合しているか
- [ ] 入力テキスト内の個人情報（電話番号パターン等）がマスクされていること
