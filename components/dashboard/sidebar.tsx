"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Mail,
    Star,
    PieChart,
    LogOut,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const navItems = [
    { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    { name: "팬레터 목록", href: "/dashboard/letters", icon: Mail },
    { name: "즐겨찾기", href: "/dashboard/letters?isStarred=true", icon: Star },
    { name: "분석 통계", href: "/dashboard/stats", icon: PieChart },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col w-64 min-h-screen bg-[#0a0b0d] border-r border-white/[0.08]">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0052ff]">
                    <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                    <span className="font-semibold text-white text-sm tracking-tight">춘심이</span>
                    <p className="text-xs text-[#5b616e]">Fan Agent on Base</p>
                </div>
            </div>

            <Separator className="mx-6 w-auto bg-white/[0.08]" />

            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                isActive
                                    ? "bg-[#0052ff] text-white"
                                    : "text-[#5b616e] hover:text-white hover:bg-[#282b31]"
                            )}
                        >
                            <item.icon className="w-4 h-4 shrink-0" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <Separator className="bg-white/[0.08]" />
            <div className="p-3">
                <Button
                    variant="ghost"
                    className="flex items-center gap-3 w-full justify-start px-3 py-2.5 text-sm font-medium text-[#5b616e] hover:text-white hover:bg-[#282b31]"
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    로그아웃
                </Button>
            </div>
        </div>
    );
}
