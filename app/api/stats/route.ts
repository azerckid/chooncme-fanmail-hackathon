import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { fanLetters, replies } from "@/db/schema";
import { eq, sql, isNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        // 1. 전체 수 및 상태별 수 집계
        const counts = await db.select({
            total: sql<number>`count(*)`,
            unread: sql<number>`sum(case when is_read = 0 then 1 else 0 end)`,
        }).from(fanLetters);

        // 2. 미답장 수 집계 (Left Join 사용)
        const unrepliedResult = await db.select({
            count: sql<number>`count(*)`
        })
            .from(fanLetters)
            .leftJoin(replies, eq(fanLetters.id, replies.letterId))
            .where(isNull(replies.id));

        // 3. 언어별 분포
        const byLanguage = await db.select({
            language: fanLetters.language,
            count: sql<number>`count(*)`
        })
            .from(fanLetters)
            .groupBy(fanLetters.language);

        // 4. 감정별 분포
        const bySentiment = await db.select({
            sentiment: fanLetters.sentiment,
            count: sql<number>`count(*)`
        })
            .from(fanLetters)
            .groupBy(fanLetters.sentiment);

        return NextResponse.json({
            success: true,
            data: {
                total: counts[0]?.total || 0,
                unread: Number(counts[0]?.unread || 0),
                unreplied: unrepliedResult[0]?.count || 0,
                byLanguage: Object.fromEntries(byLanguage.map(x => [x.language || "unknown", x.count])),
                bySentiment: Object.fromEntries(bySentiment.map(x => [x.sentiment || "unknown", x.count])),
            }
        });

    } catch (error) {
        console.error("[API_STATS_GET_ERROR]", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
