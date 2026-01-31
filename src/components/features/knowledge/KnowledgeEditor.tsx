
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { knowledgeInputSchema, KnowledgeInput } from '@/lib/validations/knowledge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Plus, Trash2, Wand2, X, ChevronsRight, ChevronsLeft, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

import { AIAssistantPanel } from '@/components/features/knowledge/AIAssistantPanel'

import { z } from 'zod'

// Form specific schema where tags is a string (comma separated)
const knowledgeFormSchema = knowledgeInputSchema.extend({
    tags: z.string()
})

type KnowledgeFormValues = z.infer<typeof knowledgeFormSchema>

export function KnowledgeEditor({ initialTitle = '', initialData }: { initialTitle?: string, initialData?: KnowledgeInput & { id?: string } }) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('basic')
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isSuggestingTags, setIsSuggestingTags] = useState(false)

    // Resizable Sidebar State
    const [sidebarWidth, setSidebarWidth] = useState(400)
    const [isResizing, setIsResizing] = useState(false)

    const startResizing = useCallback((e: React.MouseEvent) => {
        setIsResizing(true)
        e.preventDefault() // prevent selection during drag
    }, [])

    const stopResizing = useCallback(() => {
        setIsResizing(false)
    }, [])

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = document.body.clientWidth - e.clientX
            // Limits: Min 250px, Max 800px (approx 50-60% of screen)
            if (newWidth > 250 && newWidth < 1000) {
                setSidebarWidth(newWidth)
            }
        }
    }, [isResizing])

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize)
            window.addEventListener('mouseup', stopResizing)
        }
        return () => {
            window.removeEventListener('mousemove', resize)
            window.removeEventListener('mouseup', stopResizing)
        }
    }, [isResizing, resize, stopResizing])


    const formattedInitialData: KnowledgeFormValues | undefined = initialData ? {
        ...initialData,
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : (initialData.tags || '')
    } : undefined

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<KnowledgeFormValues>({
        resolver: zodResolver(knowledgeFormSchema) as any,
        defaultValues: formattedInitialData || {
            title: initialTitle,
            content: '',
            tags: '', // Default to empty string
            rationale: { laws: [], internal_rules: [] },
            examples: [],
            common_mistakes: []
        }
    })

    // Field Arrays
    const { fields: lawFields, append: appendLaw, remove: removeLaw } = useFieldArray({ control, name: 'rationale.laws' as any })
    const { fields: ruleFields, append: appendRule, remove: removeRule } = useFieldArray({ control, name: 'rationale.internal_rules' as any })
    const { fields: exampleFields, append: appendExample, remove: removeExample } = useFieldArray({ control, name: 'examples' })
    const { fields: mistakeFields, append: appendMistake, remove: removeMistake } = useFieldArray({ control, name: 'common_mistakes' as any })

    const onSubmit: SubmitHandler<KnowledgeFormValues> = async (data) => {
        try {
            // Convert tags from string to array
            const formattedData = {
                ...data,
                tags: data.tags.split(',').map(t => t.trim()).filter(t => t !== '')
            }

            const isUpdate = !!initialData?.id
            const url = isUpdate ? `/api/v1/knowledge/${initialData.id}` : '/api/v1/knowledge'
            const method = isUpdate ? 'PUT' : 'POST'

            console.log(`[KnowledgeEditor] Submitting to ${url} with method ${method}`)

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formattedData)
            })

            if (!res.ok) throw new Error(`Failed to ${isUpdate ? 'update' : 'create'} knowledge`)

            const json = await res.json()

            // If update, we might just want to refresh or go back
            // If create, we go to the new id
            router.push(`/knowledge/${json.id || initialData?.id}`)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('ナレッジの作成に失敗しました。')
        }
    }

    const handleApply = (data: Partial<KnowledgeInput>) => {
        if (data.title) setValue('title', data.title)
        if (data.content) setValue('content', data.content)

        // Handle tags conversion from array to string if needed
        if (data.tags) {
            const tagsVal = Array.isArray(data.tags) ? data.tags.join(', ') : data.tags
            setValue('tags', tagsVal)
        }

        if (data.rationale?.laws?.length) {
            setValue('rationale.laws', data.rationale.laws)
        }
        if (data.rationale?.internal_rules?.length) {
            setValue('rationale.internal_rules', data.rationale.internal_rules)
        }
        if (data.examples?.length) {
            setValue('examples', data.examples)
        }
        if (data.common_mistakes?.length) {
            setValue('common_mistakes', data.common_mistakes)
        }

        alert('ナレッジ案をエディタに反映しました。')
    }

    const handleSuggestTags = async () => {
        const title = watch('title')
        const content = watch('content')

        if (!title && !content) {
            alert('タグを提案するには、タイトルまたは内容を先に入力してください。')
            return
        }

        setIsSuggestingTags(true)
        try {
            const res = await fetch('/api/v1/knowledge/synthesize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    intent: 'SuggestTags',
                    chat_history: [
                        { role: 'user', text: `タイトル: ${title}\n内容: ${content}` }
                    ]
                })
            })

            if (!res.ok) throw new Error('Failed to suggest tags')
            const data = await res.json()

            if (data.data?.tags) {
                setValue('tags', data.data.tags.join(', ') as any)
            }
        } catch (error) {
            console.error(error)
            alert('タグの生成に失敗しました。')
        } finally {
            setIsSuggestingTags(false)
        }
    }

    const isUpdate = !!initialData?.id

    return (
        <div className="flex h-full overflow-hidden">
            {/* Left Pane: Main Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30">
                <div className="container mx-auto py-8 max-w-4xl px-4 space-y-6">
                    {/* Page Title Area */}
                    <div className="mb-6 border-b pb-6">
                        <h1 className="text-3xl font-bold text-slate-900">
                            {isUpdate ? 'ナレッジを編集' : '新しいナレッジを作成'}
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm">
                            {isUpdate ? 'ナレッジの内容を更新して、情報の鮮度を保ちましょう。' : 'あなたの知識をみんなの資産に。'}
                        </p>
                    </div>

                    {/* Editor Header (Simplified - Removing toggle button) */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-slate-800">
                            {isUpdate ? '編集フォーム' : 'ナレッジ作成'}
                        </h2>
                        {/* Toggle button removed as requested */}
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 min-w-0 pb-20">
                        {/* Tabs content */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
                                <TabsTrigger value="basic">1. 基本情報</TabsTrigger>
                                <TabsTrigger value="rationale">2. 背景・根拠</TabsTrigger>
                                <TabsTrigger value="examples">3. 具体例・注意点</TabsTrigger>
                            </TabsList>

                            {/* 1. 基本情報 */}
                            <TabsContent value="basic" className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">タイトル <span className="text-red-500">*</span></label>
                                    <Input {...register('title')} placeholder="例: 文書保存期間の特例措置について" />
                                    {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">概要 <span className="text-red-500">*</span></label>
                                    <Textarea {...register('content')} placeholder="ナレッジの要約や結論を入力..." rows={10} />
                                    {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-sm font-medium">タグ (自動生成推奨)</label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100"
                                            onClick={handleSuggestTags}
                                            disabled={isSuggestingTags}
                                        >
                                            {isSuggestingTags ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                            AIでタグを提案
                                        </Button>
                                    </div>
                                    <div className="text-xs text-slate-500 mb-1">カンマ区切りで入力、またはAIに提案させてください。</div>
                                    <Input
                                        {...register('tags' as any)}
                                        placeholder="例: 文書管理, セキュリティ, 2024年度"
                                    />
                                </div>
                            </TabsContent>

                            {/* 2. 背景・根拠 */}
                            <TabsContent value="rationale" className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">背景・コンテキスト</label>
                                    <Textarea {...register('background')} placeholder="なぜこのナレッジが必要になったか..." />
                                </div>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">根拠法令・規程</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Laws */}
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">法令 (Laws)</label>
                                            {lawFields.map((field, index) => (
                                                <div key={field.id} className="flex gap-2 mt-2">
                                                    <Input {...register(`rationale.laws.${index}` as any)} placeholder="例: 公文書管理法 第5条" />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLaw(index)}>
                                                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendLaw("new law")}>
                                                <Plus className="h-4 w-4 mr-2" /> 追加
                                            </Button>
                                        </div>

                                        {/* Internal Rules */}
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">社内規程 (Internal Rules)</label>
                                            {ruleFields.map((field, index) => (
                                                <div key={field.id} className="flex gap-2 mt-2">
                                                    <Input {...register(`rationale.internal_rules.${index}` as any)} placeholder="例: 文書取扱規程 別表1" />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRule(index)}>
                                                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendRule("new rule")}>
                                                <Plus className="h-4 w-4 mr-2" /> 追加
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* 3. 具体例・注意点 */}
                            <TabsContent value="examples" className="space-y-6 py-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">具体例 (Good Cases)</CardTitle>
                                        <CardDescription>このナレッジが適用される具体的なシチュエーション</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {exampleFields.map((field, index) => (
                                            <div key={field.id} className="p-4 bg-slate-50 rounded-lg border relative">
                                                <Button
                                                    type="button" variant="ghost" size="icon"
                                                    className="absolute top-2 right-2"
                                                    onClick={() => removeExample(index)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                                </Button>
                                                <div className="space-y-3">
                                                    <Input {...register(`examples.${index}.title`)} placeholder="ケースタイトル" className="font-medium" />
                                                    <Textarea {...register(`examples.${index}.situation`)} placeholder="どのような状況か..." />
                                                </div>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendExample({ title: "", situation: "" })}>
                                            <Plus className="h-4 w-4 mr-2" /> 具体例を追加
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">よくある間違い・注意点</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {mistakeFields.map((field, index) => (
                                            <div key={field.id} className="flex gap-2 mt-2">
                                                <Input {...register(`common_mistakes.${index}` as any)} placeholder="注意点..." />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeMistake(index)}>
                                                    <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendMistake("new mistake")}>
                                            <Plus className="h-4 w-4 mr-2" /> 追加
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end gap-4 pt-6 border-t">
                            <Button type="button" variant="secondary" onClick={() => router.back()}>キャンセル</Button>

                            {activeTab === 'basic' && (
                                <Button type="button" onClick={() => setActiveTab('rationale')} className="bg-slate-800 hover:bg-slate-900 text-white min-w-[150px]">
                                    次へ
                                </Button>
                            )}

                            {activeTab === 'rationale' && (
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab('basic')}>戻る</Button>
                                    <Button type="button" onClick={() => setActiveTab('examples')} className="bg-slate-800 hover:bg-slate-900 text-white min-w-[150px]">
                                        次へ
                                    </Button>
                                </div>
                            )}

                            {activeTab === 'examples' && (
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab('rationale')}>戻る</Button>
                                    <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700 text-white min-w-[150px]">
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        ナレッジを保存
                                    </Button>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Resize Handle */}
            {!isCollapsed && (
                <div
                    className={cn(
                        "w-4 cursor-col-resize hover:bg-teal-500/10 active:bg-teal-500/20 transition-colors z-30 flex items-center justify-center -ml-2",
                        isResizing && "bg-teal-500/20"
                    )}
                    onMouseDown={startResizing}
                >
                    <div className="w-[1px] h-8 bg-slate-300 rounded-full" />
                </div>
            )}

            {/* Right Pane: AI Assistant (Resizable) */}
            <div
                style={{ width: isCollapsed ? '50px' : `${sidebarWidth}px` }}
                className={cn(
                    "border-l bg-background shadow-xl z-20 flex flex-col transition-[width] duration-0 overflow-hidden", // Added overflow-hidden
                    !isResizing && "transition-all duration-300 ease-in-out"
                )}
            >
                {/* Collapsed State View (Always present, but hidden content) */}
                <div
                    className={cn(
                        "h-full flex flex-col items-center pt-4 bg-slate-50 border-l hover:bg-slate-100 transition-colors cursor-pointer",
                        !isCollapsed && "hidden"
                    )}
                    onClick={() => setIsCollapsed(false)}
                >
                    <Button variant="ghost" size="icon" className="mb-4">
                        <ChevronsLeft className="h-5 w-5 text-teal-600" />
                    </Button>
                    <div className="writing-mode-vertical text-slate-400 font-bold text-xs tracking-widest h-full flex items-center pb-20 select-none" style={{ writingMode: 'vertical-rl' }}>
                        AI ASSISTANT
                    </div>
                </div>

                {/* Expanded State View (Always present content to keep state) */}
                <div className={cn("flex flex-col h-full", isCollapsed && "hidden")}>
                    <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Wand2 className="h-4 w-4 text-teal-600" />
                            AI Assistant
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(true)}>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-hidden min-h-0 w-full">
                        <AIAssistantPanel onApply={handleApply} />
                    </div>
                </div>
            </div>
        </div>
    )
}
