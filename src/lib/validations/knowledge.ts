import { z } from 'zod'

// ナレッジ作成・編集用スキーマ
export const knowledgeInputSchema = z.object({
    title: z
        .string()
        .min(1, { message: 'タイトルは必須です' })
        .max(100, { message: 'タイトルは100文字以内で入力してください' }),

    content: z
        .string()
        .min(1, { message: '本文は必須です' }),

    // 概要（オプション）
    summary: z.string().optional(),

    // 背景・コンテキスト
    background: z.string().optional(),

    // 根拠 (法令・内規)
    rationale: z.object({
        laws: z.array(z.string()).default([]),
        internal_rules: z.array(z.string()).default([]),
    }).default({ laws: [], internal_rules: [] }),

    // 具体例
    examples: z.array(
        z.object({
            title: z.string().min(1, { message: '具体例のタイトルは必須です' }),
            situation: z.string().min(1, { message: '状況説明は必須です' }),
        })
    ).default([]),

    // 失敗例・注意点
    common_mistakes: z.array(z.string()).default([]),

    // タグ (最大10個)
    tags: z
        .array(z.string())
        .max(10, { message: 'タグは最大10個までです' })
        .default([]),

    // 信頼度スコア (システム用、ユーザー入力時は通常指定しないがAPIで受け入れる場合あり)
    trust_tier: z.number().int().min(1).max(3).default(2).optional(),
})

// 型定義の抽出
export type KnowledgeInput = z.infer<typeof knowledgeInputSchema>
