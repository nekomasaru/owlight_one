"use client";

import { Home, Lightbulb, TrendingUp, Settings, User, Menu } from "lucide-react";
import { SidebarItem } from "./sidebar-item";
import { Button } from "@/components/ui/button";

const navItems = [
    { title: "ホーム", href: "/", icon: Home },
    { title: "ナレッジ検索", href: "/knowledge", icon: Lightbulb },
    { title: "成長ログ", href: "/growth", icon: TrendingUp },
];

const secondaryItems = [
    { title: "プロフィール", href: "/profile", icon: User },
    { title: "設定", href: "/settings", icon: Settings },
];

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    return (
        <div className="flex flex-col h-full gap-4">
            {/* Header / Toggle */}
            <div className="h-14 flex items-center px-1 mb-2">
                <Button variant="ghost" size="icon" onClick={onToggle} className="hover:bg-slate-100">
                    <Menu className="h-5 w-5 text-slate-600" />
                </Button>
                {!isCollapsed && (
                    <span className="font-bold text-xl px-2 text-primary animate-in fade-in slide-in-from-left-2 duration-300">
                        OWLight
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-1">
                {navItems.map((item) => (
                    <SidebarItem key={item.href} {...item} isCollapsed={isCollapsed} />
                ))}
            </div>
            <div className="mt-auto flex flex-col gap-1">
                {secondaryItems.map((item) => (
                    <SidebarItem key={item.href} {...item} isCollapsed={isCollapsed} />
                ))}
            </div>
        </div>
    );
}
