"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Medal, MessageSquare, Send } from "lucide-react"

interface Comment {
    id: string
    user: {
        name: string
        avatar?: string
        role: string
    }
    content: string
    createdAt: string
    isBestAnswer?: boolean
}

// Mock Data
const MOCK_COMMENTS: Comment[] = [
    {
        id: "1",
        user: { name: "佐藤 健二", role: "Manager" },
        content: "この規定については、来年度から一部緩和される予定です。詳細は総務部の通達を確認してください。",
        createdAt: "2024-03-15",
        isBestAnswer: true
    },
    {
        id: "2",
        user: { name: "田中 美咲", role: "General" },
        content: "具体的な申請フローの図解があるとより分かりやすいと思いました。",
        createdAt: "2024-03-16"
    }
]

export function KnowledgeComments() {
    const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS)
    const [newComment, setNewComment] = useState("")

    const handleSubmit = () => {
        if (!newComment.trim()) return

        const comment: Comment = {
            id: Date.now().toString(),
            user: { name: "現在のユーザー", role: "General" }, // Mock data
            content: newComment,
            createdAt: new Date().toLocaleDateString(),
        }

        setComments([...comments, comment])
        setNewComment("")
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-4">
                <MessageSquare className="h-5 w-5 text-teal-600" />
                <h3 className="text-xl font-bold text-slate-900">補足・ディスカッション</h3>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                    {comments.length}
                </Badge>
            </div>

            {/* Comment List */}
            <div className="space-y-6">
                {comments.map((comment) => (
                    <div
                        key={comment.id}
                        className={`p-6 rounded-xl border ${comment.isBestAnswer
                                ? "bg-amber-50/50 border-amber-200"
                                : "bg-white border-slate-100"
                            }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border">
                                    <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{comment.user.name}</div>
                                    <div className="text-xs text-slate-500">{comment.createdAt}</div>
                                </div>
                            </div>
                            {comment.isBestAnswer && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1 pl-1 pr-2">
                                    <Medal className="h-3 w-3 fill-amber-500" />
                                    Best Supplement
                                </Badge>
                            )}
                        </div>

                        <div className="text-slate-700 leading-relaxed pl-[52px]">
                            {comment.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Comment Form */}
            <div className="flex gap-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
                <Avatar className="h-10 w-10 border">
                    <AvatarFallback>Me</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                    <Textarea
                        placeholder="補足情報や質問を入力して、ナレッジを深めましょう..."
                        className="bg-white min-h-[100px]"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <Button onClick={handleSubmit} disabled={!newComment.trim()} className="bg-teal-600 hover:bg-teal-700">
                            <Send className="h-4 w-4 mr-2" />
                            コメントを投稿
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
