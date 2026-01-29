import { NextResponse } from 'next/server';
import { SearchServiceClient } from '@google-cloud/discoveryengine';

const projectId = process.env.GOOGLE_PROJECT_ID;
const location = process.env.GOOGLE_LOCATION || 'global';
const dataStoreId = process.env.GOOGLE_DATA_STORE_ID;

const apiEndpoint = location === 'global'
    ? 'discoveryengine.googleapis.com'
    : `${location}-discoveryengine.googleapis.com`;

const client = new SearchServiceClient({ apiEndpoint });

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'owlight';

    const collectionId = 'default_collection';
    const servingConfigId = 'default_search';

    const name = client.projectLocationCollectionDataStoreServingConfigPath(
        projectId!,
        location,
        collectionId,
        dataStoreId!,
        servingConfigId
    );

    try {
        const [response] = await client.search({
            servingConfig: name,
            query: query,
        });

        return NextResponse.json({
            query,
            totalSize: response.totalSize,
            results: response.results,
            response: response // Return full response object
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }
}
