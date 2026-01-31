
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type HealthStatus = 'healthy' | 'degraded' | 'down'

interface HealthState {
    status: HealthStatus
    latency: number
    lastChecked: Date | null
    error: Error | null
    failureCount: number
}

interface SelfHealingOptions {
    supabaseUrl: string
    supabaseKey: string
    maxRetries?: number
    checkIntervalMs?: number
}

export class SelfHealingSupabaseClient {
    private client: SupabaseClient
    private state: HealthState = {
        status: 'healthy',
        latency: 0,
        lastChecked: null,
        error: null,
        failureCount: 0,
    }
    private options: SelfHealingOptions
    private healthCheckInterval: NodeJS.Timeout | null = null

    constructor(options: SelfHealingOptions) {
        this.options = {
            maxRetries: 5,
            checkIntervalMs: 30000,
            ...options
        }
        this.client = this.createInstance()
        this.startHealthCheck()
    }

    private createInstance(): SupabaseClient {
        return createClient(this.options.supabaseUrl, this.options.supabaseKey, {
            auth: {
                persistSession: false, // サーバーサイドまたは独立したクライアントとして動作
            },
        })
    }

    public getRawClient(): SupabaseClient {
        return this.client
    }

    public getHealthState(): HealthState {
        return { ...this.state }
    }

    private startHealthCheck() {
        if (this.healthCheckInterval) clearInterval(this.healthCheckInterval)

        // 初回チェック
        this.performHealthCheck()

        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck()
        }, this.options.checkIntervalMs)
    }

    public stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval)
            this.healthCheckInterval = null
        }
    }

    private async performHealthCheck() {
        const start = Date.now()
        try {
            const { data, error } = await this.client
                .from('health_check')
                .select('id')
                .limit(1)
                .single()

            const latency = Date.now() - start

            if (error) throw error

            this.state = {
                status: latency > 1000 ? 'degraded' : 'healthy',
                latency,
                lastChecked: new Date(),
                error: null,
                failureCount: 0,
            }
        } catch (err: any) {
            this.state.error = err
            this.state.failureCount++
            this.state.latency = Date.now() - start
            this.state.lastChecked = new Date()

            if (this.state.failureCount >= 3) {
                this.state.status = 'down'
            } else {
                this.state.status = 'degraded'
            }

            if (this.state.failureCount >= (this.options.maxRetries || 5)) {
                this.triggerAlert(err)
            }

            // 自己修復の試行
            this.attemptSelfHeal()
        }
    }

    private async attemptSelfHeal() {
        console.warn(`[SelfHealing] 接続の修復を試みています。失敗回数: ${this.state.failureCount}`)

        const backoff = Math.min(1000 * Math.pow(2, this.state.failureCount), 30000)
        await new Promise(resolve => setTimeout(resolve, backoff))

        try {
            // クライアントインスタンスの再作成
            this.client = this.createInstance()
            // 復旧したか確認するために即時ヘルスチェック
            await this.performHealthCheck()
        } catch (e) {
            console.error('[SelfHealing] 再接続に失敗しました', e)
        }
    }

    private async triggerAlert(error: any) {
        try {
            // 失敗時の無限ループを避ける
            await fetch('/api/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level: 'critical',
                    message: `Supabaseへの接続に${this.state.failureCount}回連続で失敗しました。`,
                    metadata: {
                        last_error: error?.message || String(error),
                        retry_count: this.state.failureCount
                    }
                })
            }).catch(e => console.error('アラート送信に失敗しました', e))
        } catch (e) {
            // アラートのエラーは無視する
        }
    }

    /**
     * サーキットブレーカー付きのクエリラッパー
     */
    public async query<T>(operation: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>): Promise<{ data: T | null; error: any }> {
        if (this.state.status === 'down') {
            return {
                data: null,
                error: {
                    message: 'サーキットブレーカー: データベースがダウンしています。自動復旧中です。',
                    code: 'CIRCUIT_OPEN'
                }
            }
        }

        try {
            return await operation(this.client)
        } catch (err) {
            // 予期せぬエラーがネットワーク障害のように振る舞う場合、チェックをトリガー
            this.performHealthCheck()
            throw err
        }
    }
}

// サーバーサイド使用のためのグローバルインスタンス
export const healingClient = new SelfHealingSupabaseClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
})
