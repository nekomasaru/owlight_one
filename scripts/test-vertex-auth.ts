import { getAccessToken } from '../src/lib/google-auth';

async function testAuth() {
    try {
        console.log('Retrieving access token...');
        const token = await getAccessToken();
        console.log('Access token retrieved successfully (prefix):', token.substring(0, 10) + '...');

        const modelId = 'gemini-2.5-flash-lite';
        const project = process.env.GOOGLE_PROJECT_ID || 'owlight-one';
        const apiUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models/${modelId}:generateContent`;

        console.log(`Calling Gemini API at ${apiUrl}...`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Hello, this is a test of OAuth authentication. Please respond with "OAuth connection successful".' }] }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        console.log('Gemini Response:', JSON.stringify(result, null, 2));
        console.log('\nSUCCESS: OAuth authentication is working correctly.');

    } catch (error) {
        console.error('\nFAILURE: Auth test failed:');
        console.error(error);
        process.exit(1);
    }
}

testAuth();
