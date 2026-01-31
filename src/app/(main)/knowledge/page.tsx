"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchResult {
    id: string;
    title: string;
    content: string;
    tags: string[];
    evaluation_score: number;
    created_at: string;
}

import { KnowledgeDashboard } from "@/components/features/knowledge/KnowledgeDashboard";

export default function KnowledgePage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [lastSync, setLastSync] = useState<string>("");

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResults([]); // Reset

        try {
            const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}&t=${Date.now()}`);
            const data = await res.json();

            console.log("[UI] Search Result:", data);

            if (data.hits) {
                setResults(data.hits);
            }
            setSearched(true);
            setLastSync(new Date().toLocaleTimeString());
        } catch (error) {
            console.error("Search failed:", error);
            alert("検索に失敗しました。詳細はコンソールを確認してください。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-4xl py-10 space-y-10">
            <div className="space-y-4">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                        Knowledge Base
                    </h1>
                    <p className="text-slate-500 text-lg">
                        組織の知恵を発見し、共に育てましょう。
                    </p>
                </div>

                {/* Dashboard (Initial View Only) */}
                {!searched && (
                    <div className="pt-4">
                        <KnowledgeDashboard />
                    </div>
                )}

                {lastSync && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] px-2 py-1 rounded inline-block">
                        最終更新: {lastSync} (Results: {results.length})
                    </div>
                )}
            </div>

            {/* Search Bar section */}

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="知りたいことは何ですか？"
                        className="pl-8 bg-white border-slate-200"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <Button type="submit" className="bg-[#218F8D] hover:bg-[#1a7371]" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    検索
                </Button>
            </form>

            {/* Results List */}
            <div className="space-y-4">
                {loading && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#218F8D]" />
                        探索中...
                    </div>
                )}

                {!loading && searched && results.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl border-slate-100 bg-slate-50/50">
                        <p className="text-slate-500 mb-4">
                            「{query}」に一致するナレッジはありませんでした。
                        </p>
                        <Button asChild variant="outline">
                            <Link href={`/knowledge/create?title=${encodeURIComponent(query)}`}>
                                新しくナレッジを作成
                            </Link>
                        </Button>
                    </div>
                )}

                {!loading && searched && results.length > 0 && (
                    <div className="bg-slate-900 text-teal-400 p-4 rounded-lg text-xs font-mono overflow-auto max-h-40">
                        [SERVER SUCCESS] Data received: {results.length} items found.
                        <pre className="mt-2 text-slate-400">
                            {JSON.stringify(results.map(r => ({ id: r.id, title: r.title })), null, 2)}
                        </pre>
                    </div>
                )}

                {!loading && results.map((item) => {
                    if (!item) return null;
                    const tier = item.evaluation_score >= 80 ? 'Gold' : (item.evaluation_score >= 40 ? 'Silver' : 'Bronze');
                    const tierColor = tier === 'Gold' ? 'border-amber-400 bg-amber-50/30' :
                        tier === 'Silver' ? 'border-slate-300 bg-slate-50/30' :
                            'border-slate-200 bg-white';

                    return (
                        <Link key={item.id} href={`/knowledge/${item.id}`}>
                            <Card className={cn("hover:shadow-md transition-shadow cursor-pointer border-l-4", tierColor)}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg text-slate-800">
                                            {item.title}
                                        </CardTitle>
                                        <Badge variant="outline" className="text-[10px] font-bold">
                                            {tier}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                        {item.content}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {item.tags?.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 border-none">
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
