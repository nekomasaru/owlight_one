import { SearchServiceClient, DocumentServiceClient } from '@google-cloud/discoveryengine';

// 環境変数
const projectId = process.env.GOOGLE_PROJECT_ID;
const location = process.env.GOOGLE_LOCATION || 'global';
const dataStoreId = process.env.GOOGLE_DATA_STORE_ID;

const apiEndpoint = location === 'global'
    ? 'discoveryengine.googleapis.com'
    : `${location}-discoveryengine.googleapis.com`;

// クライアントの初期化
const client = new SearchServiceClient({ apiEndpoint });
const documentClient = new DocumentServiceClient({ apiEndpoint });

export interface SearchResultItem {
    id: string;
    score?: number;
}

/**
 * Vertex AI Search を実行し、ドキュメントIDのリスト（ランク順）を返します。
 */
export async function searchVertexAI(query: string): Promise<SearchResultItem[]> {
    if (!projectId || !dataStoreId) {
        console.error("Vertex AI config is missing.");
        return [];
    }

    // 検索対象のブランチ (default_branch = 0)
    const collectionId = 'default_collection';
    const branchId = '0';
    const servingConfigId = 'default_search';

    const name = client.projectLocationCollectionDataStoreServingConfigPath(
        projectId,
        location,
        collectionId,
        dataStoreId,
        servingConfigId
    );

    try {
        const request = {
            servingConfig: name,
            query: query,
            pageSize: 10,
            // queryExpansionSpec: { condition: 'AUTO' as const }, // 表記揺れ対応
            // spellCorrectionSpec: { mode: 'AUTO' as const }, // スペル補正
        };

        console.log("Calling Vertex AI Search with query:", query);
        // autoPaginate: true (default) の場合、戻り値の第一要素は結果の配列（results）そのものです
        const [results] = await client.search(request);
        console.log("Vertex AI Search response received. Results count:", results?.length);

        if (!results) {
            return [];
        }

        // 結果からIDとスコアを抽出
        const searchItems: SearchResultItem[] = results.map((result: any) => {
            return {
                id: result.document?.id || '',
                // score はメタデータに含まれる場合があるが、ここでは検索順位自体をスコアとみなす
            };
        }).filter((item: any) => item.id !== ''); // IDがないものは除外

        return searchItems;

    } catch (error) {
        console.error("Vertex AI Search Error:", error);
        // エラー時は空配列を返す（アプリをクラッシュさせない）
        return [];
    }
}

/**
 * ドキュメントを Vertex AI Search にインポート（または更新）します。
 */
export async function indexDocument(id: string, title: string, content: string, url: string = '', tags: string[] = []) {
    if (!projectId || !dataStoreId) {
        console.error("Vertex AI config is missing.");
        return;
    }

    const collectionId = 'default_collection';
    const branchId = '0';

    const parent = documentClient.projectLocationCollectionDataStoreBranchPath(
        projectId,
        location,
        collectionId,
        dataStoreId,
        branchId
    );

    const document = {
        id: id,
        // structData は Unstructured 検索でうまく入らない可能性があるため一時無効化
        // structData: {
        //     title,
        //     content,
        //     url,
        //     tags: tags.join(',')
        // },
        content: {
            mimeType: 'text/plain',
            rawBytes: Buffer.from(content).toString('base64')
        }
    };

    try {
        const request = {
            parent,
            document,
            documentId: id,
        };

        await documentClient.createDocument(request);
        console.log(`Indexed document: ${id}`);

    } catch (error: any) {
        if (error.code === 6 || error.message?.includes('ALREADY_EXISTS')) {
            console.log(`Document ${id} already exists, updating...`);
            const name = `${parent}/documents/${id}`;
            await documentClient.updateDocument({ document: { ...document, name } });
        } else {
            console.error("Vertex AI Indexing Error:", error);
            throw error;
        }
    }
}

/**
 * 登録されているドキュメントの一覧を取得します (デバッグ用)
 */
export async function listDocuments() {
    if (!projectId || !dataStoreId) {
        return [];
    }
    const collectionId = 'default_collection';
    const branchId = '0';
    const parent = documentClient.projectLocationCollectionDataStoreBranchPath(
        projectId,
        location,
        collectionId,
        dataStoreId,
        branchId
    );

    try {
        const [documents] = await documentClient.listDocuments({ parent });
        return documents;
    } catch (error) {
        console.error("List Documents Error:", error);
        return [];
    }
}
