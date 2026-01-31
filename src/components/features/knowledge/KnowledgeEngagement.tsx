"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface KnowledgeEngagementProps {
    initialLikes?: number
}

export function KnowledgeEngagement({ initialLikes = 0 }: KnowledgeEngagementProps) {
    const [likes, setLikes] = useState(initialLikes)
    const [liked, setLiked] = useState(false)

    const handleLike = () => {
        if (!liked) {
            setLikes(prev => prev + 1)
            setLiked(true)
            // Pending: API call to /api/v1/knowledge/[id]/engagement
        } else {
            setLikes(prev => prev - 1)
            setLiked(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-100">
            <h3 className="text-slate-900 font-bold text-lg mb-2">この記事は役に立ちましたか？</h3>
            <p className="text-slate-500 text-sm mb-6">著者に感謝の気持ちを伝えましょう</p>

            <Button
                size="lg"
                variant="outline"
                className={cn(
                    "h-14 px-8 rounded-full border-2 transition-all duration-300 gap-3 text-lg font-bold group",
                    liked
                        ? "border-pink-500 bg-pink-50 text-pink-600 shadow-md transform scale-105"
                        : "border-slate-200 text-slate-600 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-500"
                )}
                onClick={handleLike}
            >
                <Heart className={cn(
                    "h-6 w-6 transition-all duration-300",
                    liked ? "fill-pink-500 text-pink-500 scale-110" : "group-hover:scale-110"
                )} />
                <span>Thanks</span>
                <span className={cn(
                    "ml-1 text-base font-normal opacity-80",
                    liked ? "text-pink-600" : "text-slate-400"
                )}>
                    {likes}
                </span>
            </Button>
        </div>
    )
}
