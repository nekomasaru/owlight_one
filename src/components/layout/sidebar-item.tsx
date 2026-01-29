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
}

export function SidebarItem({ href, icon: Icon, title }: SidebarItemProps) {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            className={cn(
                buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                "justify-start w-full gap-2",
                isActive && "bg-secondary/50 text-secondary-foreground font-medium"
            )}
        >
            <Icon className="h-5 w-5" />
            <span>{title}</span>
        </Link>
    );
}
