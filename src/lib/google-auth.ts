import { GoogleAuth } from 'google-auth-library';

/**
 * Google Cloud Platform のアクセストークンを取得します。
 * Application Default Credentials (ADC) を使用するため、
 * ローカルでは `gcloud auth application-default login`、
 * GCP環境ではサービスアカウントが自動的に使用されます。
 */
export async function getAccessToken(): Promise<string> {
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();

    if (!tokenResponse.token) {
        throw new Error('Failed to retrieve access token');
    }

    return tokenResponse.token;
}
