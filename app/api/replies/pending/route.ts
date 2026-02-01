import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { replies, fanLetters } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        // 발송 대기 중인 답장 목록 조회 (이메일 정보 포함)
        const pendingItems = await db.select({
            replyId: replies.id,
            content: replies.content,
            senderEmail: fanLetters.senderEmail,
            senderName: fanLetters.senderName,
            subject: fanLetters.subject,
        })
            .from(replies)
            .innerJoin(fanLetters, eq(replies.letterId, fanLetters.id))
            .where(eq(replies.emailSent, false));

        return NextResponse.json({
            success: true,
            data: pendingItems,
        });
    } catch (error) {
        console.error("[API_REPLIES_PENDING_GET_ERROR]", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
