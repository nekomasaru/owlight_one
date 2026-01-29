"use client";

import { Home, Lightbulb, TrendingUp, Settings, User } from "lucide-react";
import { SidebarItem } from "./sidebar-item";

const navItems = [
    { title: "ホーム", href: "/", icon: Home },
    { title: "ナレッジ検索", href: "/knowledge", icon: Lightbulb },
    { title: "成長ログ", href: "/growth", icon: TrendingUp },
];

const secondaryItems = [
    { title: "プロフィール", href: "/profile", icon: User },
    { title: "設定", href: "/settings", icon: Settings },
];

export function Sidebar() {
    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex flex-col gap-1">
                {navItems.map((item) => (
                    <SidebarItem key={item.href} {...item} />
                ))}
            </div>
            <div className="mt-auto flex flex-col gap-1">
                {secondaryItems.map((item) => (
                    <SidebarItem key={item.href} {...item} />
                ))}
            </div>
        </div>
    );
}
