import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    Rocket, Star, Flame, Sprout, RefreshCw, Target, Calendar,
    ChevronLeft, ChevronRight, ArrowRight, Loader2
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const CATEGORIES = [
    { id: 'latest', label: 'New Arrivals', sub: '新着ナレッジ', icon: Rocket, color: 'text-blue-500', bg: 'bg-blue-50', sort: 'latest' },
    { id: 'rating', label: 'Highly Rated', sub: '高評価・高品質', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', sort: 'rating' },
    { id: 'discussion', label: 'Hot Topics', sub: '議論沸騰中', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', sort: 'discussion' },
    { id: 'contribution', label: 'Needs Contribution', sub: '知恵を求む', icon: Sprout, color: 'text-green-500', bg: 'bg-green-50', sort: 'contribution' },
    { id: 'updated', label: 'Freshly Polished', sub: '最近の更新', icon: RefreshCw, color: 'text-teal-500', bg: 'bg-teal-50', sort: 'updated' },
    { id: 'recommended', label: 'Recommended', sub: 'あなたへのおすすめ', icon: Target, color: 'text-purple-500', bg: 'bg-purple-50', sort: 'recommended' },
    { id: 'seasonal', label: 'Seasonal Topics', sub: '今月の注目', icon: Calendar, color: 'text-pink-500', bg: 'bg-pink-50', sort: 'seasonal' },
]

const SLIDE_DURATION = 7000 // 7 seconds

export function KnowledgeDashboard() {
    const [activeIndex, setActiveIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isPaused, setIsPaused] = useState(false)

    const activeCategory = CATEGORIES[activeIndex]

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/v1/knowledge?sort=${activeCategory.sort}&limit=3`)
                const data = await res.json()
                if (data.success) {
                    setItems(data.data)
                }
            } catch (error) {
                console.error('Failed to fetch dashboard items:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchItems()
    }, [activeIndex])

    useEffect(() => {
        if (isPaused) return

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext()
                    return 0
                }
                return prev + (100 / (SLIDE_DURATION / 100))
            })
        }, 100)

        return () => clearInterval(timer)
    }, [activeIndex, isPaused])

    const handleNext = () => {
        setActiveIndex(prev => (prev + 1) % CATEGORIES.length)
        setProgress(0)
    }

    const handlePrev = () => {
        setActiveIndex(prev => (prev - 1 + CATEGORIES.length) % CATEGORIES.length)
        setProgress(0)
    }

    const Icon = activeCategory.icon

    return (
        <div
            className="w-full space-y-4"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Category Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", activeCategory.bg)}>
                        <Icon className={cn("h-6 w-6", activeCategory.color)} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{activeCategory.label}</h2>
                        <p className="text-sm text-slate-500">{activeCategory.sub}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrev} className="h-8 w-8 rounded-full">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-1 px-2">
                        {CATEGORIES.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 w-1.5 rounded-full transition-all duration-300",
                                    i === activeIndex ? "w-4 bg-teal-500" : "bg-slate-200"
                                )}
                            />
                        ))}
                    </div>
                    <Button variant="outline" size="icon" onClick={handleNext} className="h-8 w-8 rounded-full">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Progress value={progress} className="h-1 bg-slate-100" />

            {/* Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[160px]">
                {loading ? (
                    <div className="col-span-full flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-teal-500 opacity-20" />
                    </div>
                ) : items.length > 0 ? (
                    items.map((item) => (
                        <Link key={item.id} href={`/knowledge/${item.id}`}>
                            <Card className="h-full hover:shadow-md transition-all duration-300 group border-slate-100">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-teal-600 transition-colors">
                                            {item.title}
                                        </CardTitle>
                                        {(() => {
                                            const tier = item.evaluation_score >= 80 ? 'Gold' : (item.evaluation_score >= 40 ? 'Silver' : 'Bronze');
                                            const tierConfig = tier === 'Gold'
                                                ? { icon: '🥇', classes: "bg-yellow-400 text-yellow-950 border-yellow-600" }
                                                : tier === 'Silver'
                                                    ? { icon: '🥈', classes: "bg-slate-100 text-slate-600 border-slate-300" }
                                                    : { icon: '🥉', classes: "bg-orange-700 text-white border-transparent" };
                                            return (
                                                <Badge variant="outline" className={cn("text-[10px] shrink-0 font-bold px-1.5 py-0 h-5 flex items-center gap-1", tierConfig.classes)}>
                                                    <span className="text-[12px] leading-none">{tierConfig.icon}</span>
                                                    {tier}
                                                </Badge>
                                            )
                                        })()}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                                        {item.content}
                                    </p>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                        <div className="flex items-center gap-1 text-teal-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            詳細はコチラ <ArrowRight className="h-3 w-3" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                        <p className="text-slate-400 text-sm">このカテゴリにはまだナレッジがありません</p>
                        <Button variant="link" className="text-teal-600" asChild>
                            <Link href="/knowledge/create">最初の知恵を投稿する</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
