"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface SidebarItemProps {
    href: string;
    icon: LucideIcon;
    title: string;
    isCollapsed: boolean;
}

export function SidebarItem({ href, icon: Icon, title, isCollapsed }: SidebarItemProps) {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            title={isCollapsed ? title : undefined}
            className={cn(
                buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                "justify-start w-full gap-2 transition-all duration-300",
                isActive && "bg-secondary/50 text-secondary-foreground font-medium",
                isCollapsed && "justify-center p-2"
            )}
        >
            <Icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
                <span className="truncate animate-in fade-in slide-in-from-left-2 duration-300">
                    {title}
                </span>
            )}
        </Link>
    );
}
