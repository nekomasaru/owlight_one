"use client"

import { ModeToggle } from "@/components/mode-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Input } from "@/components/ui/input";

export function Header() {
    return (
        <header className="flex h-16 items-center border-b bg-card px-4 md:px-6">
            {/* Mobile Menu */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden mr-2">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-4">
                    <div className="mb-6 px-2 text-xl font-bold text-primary">OWLight</div>
                    <Sidebar />
                </SheetContent>
            </Sheet>

            {/* Search Bar (Fake) */}
            <div className="flex-1 max-w-sm mr-auto">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="検索..."
                        className="w-full bg-background pl-8 md:w-[200px] lg:w-[300px]"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <ModeToggle />
                {/* Placeholder for User Menu */}
                <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="h-8 w-8 rounded-full bg-muted/50" />
                </Button>
            </div>
        </header>
    )
}
