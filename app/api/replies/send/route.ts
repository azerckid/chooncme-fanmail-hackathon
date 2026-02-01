import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { fanLetters, replies } from "@/db/schema";
import { sendReplySchema } from "@/lib/validations/sendReply";
import { sendMail } from "@/lib/mail";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";

/**
 * POST /api/replies/send
 * 처리 순서: 검증 → 인증 → letter 조회 → Gmail 발송 → replies 저장 → fan_letters 답장 여부 업데이트
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Authorization 헤더 검증
        const authHeader = req.headers.get("authorization");
        const secretKey = process.env.API_SECRET_KEY;
        if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== secretKey) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or missing API secret key" } },
                { status: 401 }
            );
        }

        // 2. 요청 본문 검증 (Zod)
        const body = await req.json();
        const validation = sendReplySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid input data",
                        details: validation.error.format(),
                    },
                },
                { status: 400 }
            );
        }
        const { letterId, to, subject, body: emailBody } = validation.data;

        // 3. letterId로 fan_letters 조회; 없으면 404
        const letter = await db.query.fanLetters.findFirst({
            where: eq(fanLetters.id, letterId),
        });
        if (!letter) {
            return NextResponse.json(
                { success: false, error: { code: "LETTER_NOT_FOUND", message: "Letter not found." } },
                { status: 404 }
            );
        }

        // 4. Gmail(또는 설정된 메일) 발송
        await sendMail({ to, subject, body: emailBody });

        const nowIso = DateTime.utc().toISO() ?? new Date().toISOString();

        // 5. replies 테이블에 저장 (letter_id, content, emailSent=true, emailSentAt)
        const [inserted] = await db
            .insert(replies)
            .values({
                letterId,
                content: emailBody,
                emailSent: true,
                emailSentAt: nowIso,
            })
            .returning({ id: replies.id });

        // 6. fan_letters 해당 행 is_replied = true, replied_at = now
        await db
            .update(fanLetters)
            .set({ isReplied: true, repliedAt: nowIso })
            .where(eq(fanLetters.id, letterId));

        // 7. 201 응답
        return NextResponse.json(
            {
                success: true,
                data: {
                    message: "Reply sent successfully.",
                    replyId: inserted?.id,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[API_REPLIES_SEND_ERROR]", error);
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: message.includes("not configured") ? message : "Failed to send reply.",
                },
            },
            { status: 500 }
        );
    }
}
