
'use client'

import React, { useEffect, useState } from 'react'

interface HealthData {
    status: 'healthy' | 'degraded' | 'down'
    latency: number
    timestamp: string | null
    failureCount: number
}

export default function AdminHealthPage() {
    const [data, setData] = useState<HealthData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchHealth = async () => {
        try {
            const res = await fetch('/api/health')
            if (!res.ok && res.status !== 503) {
                throw new Error(`API Error: ${res.status}`)
            }
            const json = await res.json()
            setData(json)
            setError(null)
        } catch (err: any) {
            setError(err.message)
            setData(prev => prev ? { ...prev, status: 'down' } : null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHealth()
        const interval = setInterval(fetchHealth, 5000)
        return () => clearInterval(interval)
    }, [])

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'healthy': return 'bg-teal-500'
            case 'degraded': return 'bg-amber-500'
            case 'down': return 'bg-red-500'
            default: return 'bg-slate-300'
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-800">システムヘルスモニター</h1>
                <p className="text-slate-500">Supabase接続と自己修復クライアントのリアルタイムステータス。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ステータスカード */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(data?.status)} animate-pulse`} />
                    <div>
                        <p className="text-sm text-slate-500 font-medium">システムステータス</p>
                        <p className="text-xl font-bold capitalize text-slate-800">
                            {error ? '接続失敗' : (data?.status || '不明')}
                        </p>
                    </div>
                </div>

                {/* レイテンシカード */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm text-slate-500 font-medium">レイテンシ (DB Ping)</p>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-2xl font-bold text-slate-800">
                            {data?.latency !== undefined ? `${data.latency}ms` : '-'}
                        </p>
                        {data?.latency && data.latency > 1000 && (
                            <span className="text-xs text-amber-500 font-bold">高レイテンシ</span>
                        )}
                    </div>
                </div>

                {/* 障害回数カード */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm text-slate-500 font-medium">最近の失敗</p>
                    <p className={`text-2xl font-bold ${data?.failureCount ? 'text-amber-500' : 'text-slate-800'}`}>
                        {data?.failureCount ?? 0}
                    </p>
                    <p className="text-xs text-slate-400">直近の起動以降</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-600 text-sm">
                    ステータスの取得エラー: {error}. ネットワークまたはAPIログを確認してください。
                </div>
            )}

            {/* 手動更新ボタン */}
            <div className="flex justify-end">
                <button
                    onClick={() => { setLoading(true); fetchHealth(); }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors"
                    disabled={loading}
                >
                    {loading ? '更新中...' : 'ステータス更新'}
                </button>
            </div>

            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">デバッグ情報</h3>
                <pre className="text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    )
}
