
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { level, message, metadata } = body

        // 実際のプロダクションアプリでは、ここでSlack/Discord/PagerDuty等に送信する。
        // このMVPでは、コンソール（またはログサービス）に出力する。

        console.error(`[ALERT][${level}] ${message}`, metadata)

        // Slack通知を行う場合の例:
        /*
        if (process.env.SLACK_WEBHOOK_URL) {
            await fetch(process.env.SLACK_WEBHOOK_URL, {
                method: 'POST',
                body: JSON.stringify({ text: `[${level}] ${message}` })
            })
        }
        */

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to process alert' },
            { status: 500 }
        )
    }
}
