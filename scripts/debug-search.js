// Debug script to check Vertex AI Search result content and IDs
require('dotenv').config({ path: '.env.local' });
const { SearchServiceClient } = require('@google-cloud/discoveryengine');

async function debugSearch() {
    const projectId = process.env.GOOGLE_PROJECT_ID;
    const location = process.env.GOOGLE_LOCATION || 'global';
    const dataStoreId = process.env.GOOGLE_DATA_STORE_ID;
    const query = 'owlightプロジェクトについて';

    const apiEndpoint = location === 'global'
        ? 'discoveryengine.googleapis.com'
        : `${location}-discoveryengine.googleapis.com`;

    const client = new SearchServiceClient({ apiEndpoint });

    const name = client.projectLocationCollectionDataStoreServingConfigPath(
        projectId,
        location,
        'default_collection',
        dataStoreId,
        'default_search'
    );

    console.log(`Searching for: "${query}"`);
    console.log(`Endpoint: ${apiEndpoint}`);
    console.log(`Config: ${name}`);

    try {
        const [results] = await client.search({
            servingConfig: name,
            query: query,
            pageSize: 5,
        });

        console.log(`\nFound ${results.length} results:`);
        results.forEach((res, i) => {
            console.log(`\n--- Result ${i + 1} ---`);
            console.log(`ID: ${res.document?.id}`);
            console.log(`Score (Relevance): ${res.relevanceScore}`);

            // Check for structData or content
            if (res.document?.structData) {
                console.log(`StructData:`, JSON.stringify(res.document.structData, null, 2));
            }
            if (res.document?.derivedStructData) {
                console.log(`DerivedStructData (Snippets etc):`, JSON.stringify(res.document.derivedStructData, null, 2));
            }
        });

    } catch (err) {
        console.error('Search error:', err);
    }
}

debugSearch();
