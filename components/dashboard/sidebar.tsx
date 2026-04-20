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

const navItems = [
    { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    { name: "팬레터 목록", href: "/dashboard/letters", icon: Mail },
    { name: "즐겨찾기", href: "/dashboard/letters?isStarred=true", icon: Star },
    { name: "분석 통계", href: "/dashboard/stats", icon: PieChart },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div
            className="flex flex-col w-64 min-h-screen"
            style={{ background: "#0a0b0d", borderRight: "1px solid rgba(255,255,255,0.08)" }}
        >
            {/* 로고 */}
            <div className="p-6 flex items-center gap-3">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#0052ff" }}
                >
                    <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                    <span className="font-semibold text-white text-sm tracking-tight">춘심이</span>
                    <p className="text-xs" style={{ color: "#5b616e" }}>Fan Agent on Base</p>
                </div>
            </div>

            {/* 구분선 */}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "0 24px" }} />

            {/* 네비게이션 */}
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
                                    ? "text-white"
                                    : "text-[#5b616e] hover:text-white hover:bg-[#282b31]"
                            )}
                            style={isActive ? { background: "#0052ff" } : {}}
                        >
                            <item.icon className="w-4 h-4 shrink-0" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* 하단 */}
            <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <button
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-[#5b616e] hover:text-white hover:bg-[#282b31]"
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    로그아웃
                </button>
            </div>
        </div>
    );
}
