import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar (Desktop) */}
            <aside className="hidden w-64 border-r bg-card md:block">
                <div className="flex h-full flex-col p-4">
                    <div className="h-14 flex items-center font-bold text-xl px-2 text-primary mb-2">OWLight</div>
                    <Sidebar />
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    );
}
