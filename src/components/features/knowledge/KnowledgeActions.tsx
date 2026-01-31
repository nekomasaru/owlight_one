"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Link as LinkIcon, Share2, Check } from "lucide-react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface KnowledgeActionsProps {
    id: string
    title: string
    isAuthor?: boolean // Mocked for now, defaults to true/false in parent
}

export function KnowledgeActions({ id, title, isAuthor = true }: KnowledgeActionsProps) {
    const [copied, setCopied] = useState(false)

    const handleCopyLink = () => {
        const url = `${window.location.origin}/knowledge/${id}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex items-center gap-2">
            {isAuthor && (
                <Button variant="outline" size="sm" asChild className="h-9 gap-2 text-slate-600 hover:text-teal-700 hover:bg-teal-50 border-slate-200">
                    <Link href={`/knowledge/edit/${id}`}>
                        <Edit className="h-4 w-4" />
                        編集
                    </Link>
                </Button>
            )}

            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyLink}
                className="h-9 gap-2 text-slate-600 hover:text-teal-700 hover:bg-teal-50 border-slate-200"
            >
                {copied ? <Check className="h-4 w-4 text-teal-600" /> : <LinkIcon className="h-4 w-4" />}
                {copied ? "コピー完了" : "リンク"}
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-teal-700 hover:bg-teal-50">
                        <Share2 className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                        Slackで共有
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        Teamsで共有
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
