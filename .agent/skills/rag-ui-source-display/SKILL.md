name: "rag-ui-source-display"

description: "AIの回答根拠となるドキュメント（Source）の詳細情報をサイドパネル等に表示し、信頼性を担保するUIコンポーネントを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "rag", "ui-component"]

triggers:

&nbsp; - "根拠表示"

&nbsp; - "Sourceパネル"

&nbsp; - "引用元"

---



\## 概要



RAGチャットにおいて、AIの回答が「どのドキュメントに基づいているか」をユーザーに明示するためのUIコンポーネントを実装します。

`rag-api-chat` から返却される `citations` データを受け取り、クリック可能なカード形式で表示します。また、各カードには「Trust Tier（信頼度バッジ）」を表示し、情報の正確性を直感的に判断できるようにします。



\## このスキルが前提とするもの



\- `rag-api-chat` スキルが実装され、レスポンスに `citations` または `source\_documents` が含まれていること

\- `ChatWindow.tsx` (`rag-ui-chat-window`) が実装済みであり、そこに組み込む形になること

\- UI ガイドライン（Teal #218F8D, Trust Tier バッジ）が利用可能であること



\## 実装内容



\### UI 実装



\*\*コンポーネント：SourcePanel.tsx\*\*



\- 機能：根拠ドキュメントのリスト表示

\- 配置：チャット画面の右側サイドバー（デスクトップ）または下部シート（モバイル）

\- 表示項目：

&nbsp; - ドキュメントタイトル（リンク付き）

&nbsp; - スニペット（回答に使われた該当箇所）

&nbsp; - \*\*Trust Tier バッジ\*\*（Gold/Silver/Bronze）

&nbsp; - 関連スコア（Relevance Score, あれば）



\*\*コンポーネント：CitationCard.tsx\*\*



\- 機能：個々の引用元を表示するカード

\- スタイル：コンパクトなカードデザイン、ホバー時に強調表示

\- アクション：クリックで `knowledge-ui-list` の詳細画面またはドキュメントビューアを開く



\*\*インタラクション\*\*



\- 回答文中の脚注 `\[1]` をクリックすると、対応する `CitationCard` にスクロールまたはハイライトする機能

\- サイドパネルの開閉トグル（モバイル対応のため）



\### データ構造（想定）



```typescript

interface SourceDocument {

&nbsp; id: string;

&nbsp; title: string;

&nbsp; url?: string;

&nbsp; snippet: string;

&nbsp; trust\_tier: 1 | 2 | 3; // 1:Gold, 2:Silver, 3:Bronze

&nbsp; metadata?: Record<string, any>;

}

参考資料

/docs/13\_RAG\_CHAT\_ADMIN.md （根拠表示の重要性とデータフロー）



/docs/12\_KNOWLEDGE\_ARCHITECTURE.md （Trust Tier の定義）



/docs/05\_UI\_UX\_GUIDELINES.md （サイドパネルのデザイン）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] SourcePanel.tsx が実装され、複数の CitationCard をリスト表示できること



\[ ] 各カードにタイトル、スニペット、Trust Tier バッジが正しく表示されること



\[ ] AI回答の生成完了後、ソース情報が即座に反映されること



\[ ] レスポンシブ対応（モバイルでは下部シートやモーダルとして表示）ができていること



\[ ] 引用元がない場合（一般的な会話など）はパネルを非表示にするか「根拠なし」と表示すること



\[ ] ドキュメントへのリンクが正しく機能すること（内部リンクまたは外部リンク）



補足・注意事項

根拠の表示は、行政職員にとって「情報の裏取り」をするための最重要機能です。スニペット（抜粋）は長すぎず短すぎず、文脈がわかる程度の長さ（100-200文字）で表示するよう調整してください。



Vertex AI Search のレスポンスに含まれるメタデータ（structData）から trust\_tier を抽出するロジックが必要です。

