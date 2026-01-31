'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, FileText, Loader2, Sparkles, Send, ArrowLeft, Download } from 'lucide-react'
import { KnowledgeInput } from '@/lib/validations/knowledge'

interface AIAssistantPanelProps {
    onApply: (data: Partial<KnowledgeInput>) => void
    isSticky?: boolean
}

type Message = {
    role: 'user' | 'model'
    text: string
    data?: Partial<KnowledgeInput> // 提案された構造化データ
}

export function AIAssistantPanel({ onApply, isSticky = true }: AIAssistantPanelProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'こんにちは！ナレッジ作成のお手伝いをします。\n「生成」「磨き上げ」「要約」からモードを選んで指示してください。' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('generate')

    const handleSend = async () => {
        if (!input.trim()) return

        // User message
        const userMsg: Message = { role: 'user', text: input }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            // Call API
            const res = await fetch('/api/v1/knowledge/synthesize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    intent: activeTab, // generate | refine | summarize
                    chat_history: [...messages, userMsg].map(m => ({ role: m.role, text: m.text, data: m.data }))
                })
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.error || errorData.message || `API Error: ${res.status}`)
            }

            const data = await res.json()

            // Model message
            const modelMsg: Message = {
                role: 'model',
                text: data.message || '生成しました。',
                data: data.data
            }
            setMessages(prev => [...prev, modelMsg])

        } catch (error: any) {
            console.error(error)
            // Show meaningful error if available
            const errorMsg = error.message || 'すみません、エラーが発生しました。もう一度お試しください。'
            setMessages(prev => [...prev, { role: 'model', text: `(Error) ${errorMsg}` }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="flex flex-col h-full border-none rounded-none shadow-none bg-transparent">
            {/* Mode Selection */}
            <div className="p-2 border-b bg-white">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-8">
                        <TabsTrigger value="generate" className="text-xs">生成</TabsTrigger>
                        <TabsTrigger value="refine" className="text-xs">磨き上げ</TabsTrigger>
                        <TabsTrigger value="summarize" className="text-xs">要約</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Chat History */}
            <ScrollArea className="flex-1 p-4 bg-slate-50/50">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[90%] rounded-lg p-3 text-sm whitespace-pre-wrap ${msg.role === 'user'
                                ? 'bg-teal-600 text-white'
                                : 'bg-white border text-slate-700 shadow-sm'
                                }`}>
                                {msg.text}
                            </div>

                            {/* Propose Data Action */}
                            {msg.role === 'model' && msg.data && (
                                <div className="mt-2 ml-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onApply(msg.data!)}
                                        className="text-teal-600 border-teal-200 hover:bg-teal-50 hover:text-teal-700 text-xs"
                                    >
                                        <ArrowLeft className="h-3 w-3 mr-1" />
                                        エディタに反映する
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-slate-400 text-xs ml-2">
                            <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 border-t bg-white space-y-3">
                {activeTab === 'summarize' && (
                    <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-md p-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="text-center">
                            <FileText className="h-6 w-6 mx-auto text-slate-400 mb-1" />
                            <span className="text-xs text-slate-500 block">ファイルをアップロード (.pdf, .docx)</span>
                            <span className="text-[10px] text-slate-400 block mt-1">※現在は未実装（モック）</span>
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="AIへの指示を入力..."
                        className="min-h-[80px] text-sm resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        size="icon"
                        className="h-[80px] w-12 bg-teal-600 hover:bg-teal-700 shrink-0"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </Card>
    )
}
