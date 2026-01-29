# Skill: Hybrid Tag Synchronization Policy (infra-tag-sync-policy)

このスキルは、OWLight システムにおける「タグ」の二重管理（正規化された関係テーブルと非正規化された配列）を、データ整合性を保ちながら運用するための設計指針と実装パターンを定義します。

## 背景
OWLight では、検索のパフォーマンス向上と Vertex AI (RAG) 連携の簡素化のために `text[]`（配列）形式を使用していますが、一方でタグの集計、正規化、マスタ管理のために `tags` (マスタ) と `knowledge_tags` / `file_tags` (中間テーブル) も保持しています。

この「ハイブリッド構成」において、一箇所の更新が全てのテーブルに波及するように実装する必要があります。

## 適用ルール

### 1. リポジトリ層の責務
ナレッジ（`knowledge_base`）またはファイル（`files`）のレコードを保存・更新する際は、必ず以下のステップを同一トランザクション（または一連の処理）として実行してください。

1.  **レコード保存**: 本体テーブルの `tags` (text[]) 列を更新。
2.  **タグマスタ upsert**: 入力されたタグ名が `tags` テーブルに存在しない場合は新規登録し、IDを取得。
3.  **中間テーブル同期**: 
    - 中間テーブル（`knowledge_tags` または `file_tags`）に、レコード ID とタグ ID の紐付けを保存。
    - 更新（UPDATE）の場合は、古い紐付けを削除した上で新規に紐付け直す。

### 2. LLM による正規化
タグの保存前には、必ず `TagService.normalizeTags()` を呼び出し、ゆらぎ（例：「有休」と「有給休暇」）を解消した後のタグを使用してください。

### 3. API層の振る舞い
- **読み込み (GET)**: 高速化のため、基本的には本体テーブルの `tags` (text[]) 列を参照します。
- **サイドバーの一覧**: `tags` マスタテーブルを直接参照し、現在有効なタグ（紐付けがあるもの）をアルファベット順等で返却します。

## 実装例 (TypeScript)

```typescript
// SupabaseKnowledgeRepository.ts 内のパターン
async syncKnowledgeTags(knowledgeId: string, tags: string[]) {
    for (const tagName of tags) {
        // 1. マスタ登録
        const { data: tag } = await supabaseAdmin.from('tags').upsert({ name: tagName }).select('id').single();
        // 2. 中間テーブル登録
        await supabaseAdmin.from('knowledge_tags').upsert({ knowledge_id: knowledgeId, tag_id: tag.id });
    }
}
```

## チェックリスト
- [ ] ナレッジ登録時に `tags` マスタが更新されているか？
- [ ] ナレッジ更新時に `knowledge_tags` の紐付けが適切に張り替えられているか？
- [ ] ファイルアップロード時も同様の hybrid パターン（`file_tags`）が維持されているか？
- [ ] `TagService` による正規化が保存直前に介在しているか？
