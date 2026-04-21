"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/dashboard/letters?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch(e);
        }
    };

    return (
        <header
            className="h-16 flex items-center justify-between px-8 sticky top-0 z-10"
            style={{ background: "#ffffff", borderBottom: "1px solid rgba(91,97,110,0.15)" }}
        >
            <div className="flex items-center gap-4 w-1/3">
                <form onSubmit={handleSearch} className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#5b616e" }} />
                    <Input
                        placeholder="팬레터 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="pl-10 h-9 border-none focus-visible:ring-1 text-sm"
                        style={{ background: "#eef0f3", focusRing: "#0052ff" } as React.CSSProperties}
                    />
                </form>
            </div>

            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="relative" style={{ color: "#5b616e" }}>
                    <Bell className="w-5 h-5" />
                    <span
                        className="absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-white"
                        style={{ background: "#0052ff" }}
                    />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                            <Avatar className="h-9 w-9" style={{ border: "2px solid #0052ff" }}>
                                <AvatarFallback
                                    className="text-xs font-semibold text-white"
                                    style={{ background: "#0052ff" }}
                                >
                                    AD
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-semibold" style={{ color: "#0a0b0d" }}>관리자</p>
                                <p className="text-xs" style={{ color: "#5b616e" }}>admin@chooncme.ai</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>프로필 설정</DropdownMenuItem>
                        <DropdownMenuItem>환경 설정</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">로그아웃</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
