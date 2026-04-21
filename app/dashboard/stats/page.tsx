import { db } from "@/db";
import { fanLetters, replies } from "@/db/schema";
import { eq, sql, isNull, gte, desc } from "drizzle-orm";
import { DateTime } from "luxon";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { TrendChart, SentimentChart, LanguageChart } from "@/components/dashboard/charts";
import {
    LayoutDashboard,
    TrendingUp,
    Smile,
    Languages,
    BarChart3,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

async function getDetailedStats() {
    try {
        const counts = await db.select({
            total: sql<number>`count(*)`,
            unread: sql<number>`sum(case when is_read = 0 then 1 else 0 end)`,
            starred: sql<number>`sum(case when is_starred = 1 then 1 else 0 end)`,
            replied: sql<number>`sum(case when is_replied = 1 then 1 else 0 end)`,
        }).from(fanLetters);

        // 언어별 상세 분포
        const byLanguage = await db.select({
            language: fanLetters.language,
            count: sql<number>`count(*)`
        })
            .from(fanLetters)
            .groupBy(fanLetters.language)
            .orderBy(sql`count(*) desc`);

        // 감정별 상세 분포
        const bySentiment = await db.select({
            sentiment: fanLetters.sentiment,
            count: sql<number>`count(*)`
        })
            .from(fanLetters)
            .groupBy(fanLetters.sentiment);

        // 국가별 분포
        const byCountry = await db.select({
            country: fanLetters.country,
            count: sql<number>`count(*)`
        })
            .from(fanLetters)
            .groupBy(fanLetters.country)
            .orderBy(sql`count(*) desc`)
            .limit(10);

        // 최근 30일 수신 추이
        const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toISODate();
        const trendData = await db.select({
            date: sql<string>`date(received_at)`,
            count: sql<number>`count(*)`
        })
            .from(fanLetters)
            .where(gte(fanLetters.receivedAt, thirtyDaysAgo || ""))
            .groupBy(sql`date(received_at)`)
            .orderBy(sql`date(received_at)`);

        // 전체 기간 및 이번 달 수신 비교
        const firstDayOfMonth = DateTime.now().startOf('month').toISODate();
        const thisMonthCount = await db.select({
            count: sql<number>`count(*)`
        })
            .from(fanLetters)
            .where(gte(fanLetters.receivedAt, firstDayOfMonth || ""));

        return {
            summary: {
                total: counts[0]?.total || 0,
                unread: Number(counts[0]?.unread || 0),
                starred: Number(counts[0]?.starred || 0),
                replied: Number(counts[0]?.replied || 0),
                thisMonth: thisMonthCount[0]?.count || 0,
            },
            byLanguage: Object.fromEntries(byLanguage.map(x => [x.language || "unknown", x.count])),
            bySentiment: Object.fromEntries(bySentiment.map(x => [x.sentiment || "unknown", x.count])),
            byCountry: byCountry.map(x => ({ name: x.country || "알 수 없음", value: x.count })),
            trend: trendData,
        };
    } catch (error) {
        console.error("Detailed stats fetch error:", error);
        return null;
    }
}

export default async function StatsPage() {
    const stats = await getDetailedStats();

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-neutral-500">
                <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
                <p>통계 데이터를 불러오는 중 오류가 발생했습니다.</p>
            </div>
        );
    }

    // 7일 및 30일치 요약 추이용 데이터 가공 (TrendChart 호환)
    const last7DaysTrend = [];
    for (let i = 6; i >= 0; i--) {
        const date = DateTime.now().minus({ days: i }).toISODate();
        const found = stats.trend.find((d: any) => d.date === date);
        last7DaysTrend.push({ date, count: found?.count || 0 });
    }

    const last30DaysTrend = [];
    for (let i = 29; i >= 0; i--) {
        const date = DateTime.now().minus({ days: i }).toISODate();
        const found = stats.trend.find((d: any) => d.date === date);
        last30DaysTrend.push({ date, count: found?.count || 0 });
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">분석 리포트</h2>
                    <p className="text-neutral-500 mt-2">팬레터 데이터를 통해 분석한 글로벌 팬덤 인사이트입니다.</p>
                </div>
                <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl">
                    <div className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium">실시간</div>
                    <div className="px-4 py-2 text-sm text-neutral-400 font-medium">업데이트 완료</div>
                </div>
            </div>

            {/* Top Summaries */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card className="border-none shadow-sm bg-indigo-600 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-indigo-100/70">전체 누적 편지</CardDescription>
                        <CardTitle className="text-3xl">{stats.summary.total.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs text-indigo-100/60">
                            <ArrowUpRight className="w-3 h-3" />
                            전체 기간 기준
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription>이번 달 수신</CardDescription>
                        <CardTitle className="text-3xl">{stats.summary.thisMonth.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs text-green-500">
                            <TrendingUp className="w-3 h-3" />
                            활발히 소통 중
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription>중요 표시(Starred)</CardDescription>
                        <CardTitle className="text-3xl">{stats.summary.starred.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                            특별히 챙겨야 할 목소리
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription>평균 답장율</CardDescription>
                        <CardTitle className="text-3xl">
                            {stats.summary.total > 0
                                ? Math.round((stats.summary.replied / stats.summary.total) * 100)
                                : 0}%
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs text-neutral-400">
                            계속해서 답장해 볼까요?
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Charts */}
            <div className="grid gap-6 md:grid-cols-12">
                <Card className="md:col-span-8 border-none shadow-sm bg-white">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                            <CardTitle>수신 트렌드 (최근 7일)</CardTitle>
                        </div>
                        <CardDescription>편지 수신량이 가장 많았던 날을 확인하세요.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] p-6">
                        <TrendChart data7Days={last7DaysTrend} data30Days={last30DaysTrend} />
                    </CardContent>
                </Card>

                <Card className="md:col-span-4 border-none shadow-sm bg-white">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Smile className="w-4 h-4 text-neutral-400" />
                            <CardTitle>종합 감정 분포</CardTitle>
                        </div>
                        <CardDescription>팬들의 전반적인 마음의 색깔입니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] flex items-center justify-center">
                        <SentimentChart data={stats.bySentiment} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Languages className="w-4 h-4 text-neutral-400" />
                            <CardTitle>팬덤 언어 분포</CardTitle>
                        </div>
                        <CardDescription>어떤 언어로 소통하는 팬들이 많은지 분석합니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <LanguageChart data={stats.byLanguage} />
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4 text-neutral-400" />
                            <CardTitle>수신 국가 TOP 10</CardTitle>
                        </div>
                        <CardDescription>전 세계 어디에서 춘심이를 응원하고 있을까요?</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-neutral-100">
                            {stats.byCountry.length === 0 ? (
                                <div className="p-10 text-center text-neutral-400 text-sm">데이터를 수집 중입니다.</div>
                            ) : (
                                stats.byCountry.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-neutral-300 w-4">#{(idx + 1)}</span>
                                            <span className="font-medium text-sm">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500"
                                                    style={{ width: `${(item.value / stats.summary.total) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-neutral-900">{item.value}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
