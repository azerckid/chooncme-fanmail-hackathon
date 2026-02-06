/**
 * 최근 아카이브된 팬레터 목록 조회 (수집 여부 확인용)
 * 실행: npx tsx scripts/check-recent-letters.ts
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { db } from "../db";
import { fanLetters } from "../db/schema";
import { desc } from "drizzle-orm";

async function main() {
  const recent = await db
    .select({
      id: fanLetters.id,
      emailId: fanLetters.emailId,
      subject: fanLetters.subject,
      senderName: fanLetters.senderName,
      senderEmail: fanLetters.senderEmail,
      receivedAt: fanLetters.receivedAt,
      isReplied: fanLetters.isReplied,
      repliedAt: fanLetters.repliedAt,
      createdAt: fanLetters.createdAt,
    })
    .from(fanLetters)
    .orderBy(desc(fanLetters.createdAt))
    .limit(10);

  console.log("최근 아카이브된 팬레터 (최대 10건):");
  console.log(JSON.stringify(recent, null, 2));
  console.log("\n총 건수:", recent.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
