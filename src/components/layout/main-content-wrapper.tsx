'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function MainContentWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    // リストページや詳細ページは通常レイアウト、作成・編集ページはエディタレイアウト(フルスクリーン)
    // パス判定をより確実に（末尾スラッシュやクエリパラメータを考慮）
    const isEditor = pathname?.startsWith('/knowledge/create') || pathname?.includes('/edit')

    return (
        <main className={cn(
            "flex-1 scroll-smooth flex flex-col min-h-0", // min-h-0 is important for nested scrolling
            isEditor ? "overflow-hidden p-0" : "overflow-y-auto p-4 md:p-6"
        )}>
            {children}
        </main>
    )
}
