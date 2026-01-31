'use client'

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MainContentWrapper } from "@/components/layout/main-content-wrapper";
import { cn } from "@/lib/utils";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar (Desktop) */}
            <aside className={cn(
                "hidden border-r bg-card md:block transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0",
                isSidebarCollapsed ? "w-20" : "w-64"
            )}>
                <div className="flex h-full flex-col p-4">
                    <Sidebar
                        isCollapsed={isSidebarCollapsed}
                        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    />
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <MainContentWrapper>{children}</MainContentWrapper>
            </div>
        </div>
    );
}
