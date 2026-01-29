"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
    id: string;
    title: string;
    content: string; // Markdown or text
    tags: string[];
    evaluation_score: number;
    created_at: string;
}

export default function KnowledgePage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);
        setResults([]); // Reset results while loading

        try {
            const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResults(data.hits || []);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-4xl py-6 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">ナレッジ検索</h1>
                <p className="text-muted-foreground">
                    Vertex AI の力で、組織の集合知から最適な答えを見つけ出します。
                </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="知りたいことは何ですか？ (例: リアクトのベストプラクティス)"
                        className="pl-8"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    検索
                </Button>
            </form>

            {/* Results */}
            <div className="space-y-4">
                {loading && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        AIが最適なナレッジを探しています...
                    </div>
                )}

                {!loading && searched && results.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        見つかりませんでした。別のキーワードを試してみてください。
                    </div>
                )}

                {!loading && results.map((item) => (
                    <Card key={item.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg text-primary hover:underline">
                                    {item.title}
                                </CardTitle>
                                {item.evaluation_score > 0 && (
                                    <Badge variant="secondary">
                                        Score: {item.evaluation_score}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-foreground/80 line-clamp-3">
                                {item.content}
                            </p>
                            <div className="mt-3 flex gap-2">
                                {item.tags?.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div >
    );
}
