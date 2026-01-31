import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, BookOpen, CheckCircle2, FileText, Gavel, Lightbulb, Tag, Clock, ArrowLeft, Sparkles, Edit3, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { KnowledgeActions } from "@/components/features/knowledge/KnowledgeActions"
import { KnowledgeEngagement } from "@/components/features/knowledge/KnowledgeEngagement"
import { KnowledgeComments } from "@/components/features/knowledge/KnowledgeComments"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default async function KnowledgeDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()

    console.log(`[Detail Page] Fetching knowledge for ID: ${params.id}`);

    const { data: knowledge, error } = await supabase
        .from('knowledges')
        .select('*')
        .eq('id', params.id)
        .single()

    if (error) {
        console.error(`[Detail Page] Supabase Error for ID ${params.id}:`, error);
    }
    if (!knowledge) {
        console.warn(`[Detail Page] Knowledge not found for ID ${params.id}`);
        return notFound()
    }

    const { title, summary, content, tags, evaluation_score, created_at, id, author_id, rationale, examples, common_mistakes } = knowledge as any;
    const tier = evaluation_score >= 80 ? 'Gold' : (evaluation_score >= 40 ? 'Silver' : 'Bronze')
    const tierConfig = tier === 'Gold'
        ? { icon: '🥇', classes: 'text-yellow-900 border-yellow-500 bg-yellow-400 font-bold' } :
        tier === 'Silver' ? { icon: '🥈', classes: 'text-slate-600 border-slate-300 bg-slate-100 font-bold' } :
            { icon: '🥉', classes: 'text-white border-transparent bg-orange-700 font-bold shadow-sm' }

    const isGold = tier === 'Gold'

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Action Bar (Sticky) */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b px-8 py-3 flex justify-between items-center shadow-sm">
                <Button variant="ghost" size="sm" asChild className="text-slate-500 -ml-2">
                    <Link href="/knowledge">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        ナレッジ一覧に戻る
                    </Link>
                </Button>
                <KnowledgeActions id={id} title={title} isAuthor={true} />
            </div>

            <div className="container max-w-5xl py-10 space-y-8 px-4 md:px-6">

                {/* Contribution Incentive (Non-Gold) */}
                {!isGold && (
                    <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-teal-900 font-bold flex items-center gap-2 justify-center md:justify-start">
                                <Sparkles className="h-5 w-5 text-teal-600" />
                                貢献のチャンス！
                            </h3>
                            <p className="text-sm text-teal-700">
                                このナレッジはまだ発展途上です。あなたの知見を補足して、信頼性の高い「Gold Tier」へ育てましょう。<br />
                                編集や補足を行うと、<strong>Wisdom Points</strong> が付与されます。
                            </p>
                        </div>
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-md whitespace-nowrap" asChild>
                            <Link href={`/knowledge/edit/${id}`}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                補足・編集する
                            </Link>
                        </Button>
                    </div>
                )}

                {/* Header Section */}
                <div className="space-y-6 pb-6 border-b border-slate-200">
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="outline" className={`px-3 py-1 font-bold flex items-center gap-1.5 ${tierConfig.classes}`}>
                            <span className="text-lg leading-none">{tierConfig.icon}</span>
                            {tier} Tier
                        </Badge>
                        <div className="flex items-center text-slate-400 text-sm gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(created_at).toLocaleDateString('ja-JP')}
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                        {title}
                    </h1>

                    <div className="flex flex-wrap gap-2">
                        {tags?.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 px-2.5 py-0.5">
                                #{tag}
                            </Badge>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Avatar className="h-8 w-8 border border-white shadow-sm">
                            <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">U</AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                            <span className="font-medium text-slate-900">Owl Keeper</span> (Author)
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Summary Card */}
                        <Card className="bg-slate-50/80 border-slate-200 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
                                    <BookOpen className="h-5 w-5 text-teal-600" />
                                    概要
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-slate-700 leading-relaxed">
                                {summary || "（概要は登録されていません）"}
                            </CardContent>
                        </Card>

                        {/* Main Body */}
                        <div className="prose prose-slate max-w-none">
                            <h3>詳細内容</h3>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content}
                            </ReactMarkdown>
                        </div>

                        {/* Rationale Section */}
                        {rationale && (
                            <Card className="border-teal-100 shadow-sm overflow-hidden">
                                <div className="bg-teal-50/50 px-6 py-4 border-b border-teal-100 flex items-center gap-2 font-bold text-teal-900">
                                    <Gavel className="h-5 w-5 text-teal-600" />
                                    背景・根拠
                                </div>
                                <CardContent className="p-6 space-y-6">
                                    {rationale.laws?.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">関連法令</h4>
                                            <ul className="space-y-2">
                                                {rationale.laws.map((law: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                        <CheckCircle2 className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
                                                        {law}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {rationale.internal_rules?.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">社内規程</h4>
                                            <ul className="space-y-2">
                                                {rationale.internal_rules.map((rule: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                        <FileText className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                                        {rule}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Engagement & Comments */}
                        <div className="pt-8 space-y-12">
                            <KnowledgeEngagement initialLikes={evaluation_score} />
                            <KnowledgeComments />
                        </div>
                    </div>

                    {/* Right Column: Examples & Metadata */}
                    <div className="space-y-6">
                        {/* Examples */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-amber-500" />
                                具体例 (Case Study)
                            </h3>
                            {examples?.length > 0 ? (
                                examples.map((ex: any, i: number) => (
                                    <Card key={i} className="bg-white hover:shadow-md transition-shadow border-l-4 border-l-amber-400">
                                        <CardContent className="p-4 space-y-2">
                                            <div className="font-bold text-slate-800 text-sm">{ex.title}</div>
                                            <div className="text-xs text-slate-500 leading-relaxed">{ex.situation}</div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-lg text-center">
                                    具体例はまだ登録されていません。
                                </div>
                            )}
                        </div>

                        {/* Common Mistakes */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                注意点 (Caution)
                            </h3>
                            {common_mistakes?.length > 0 ? (
                                <ul className="space-y-2">
                                    {common_mistakes.map((mistake: string, i: number) => (
                                        <li key={i} className="bg-red-50 text-red-700 text-xs p-3 rounded border border-red-100 flex gap-2">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            {mistake}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-lg text-center">
                                    注意点は登録されていません。
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
