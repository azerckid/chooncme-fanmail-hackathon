import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const fanLetters = sqliteTable("fan_letters", {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // 이메일 메타데이터
    emailId: text("email_id").unique(),           // 원본 이메일 ID (중복 방지)
    subject: text("subject"),                      // 이메일 제목
    senderName: text("sender_name").notNull(),     // 발신자 이름
    senderEmail: text("sender_email").notNull(),   // 발신자 이메일

    // 본문
    content: text("content").notNull(),

    // 분석 데이터 (춘심AI가 분석하여 전달)
    language: text("language"),                    // 'ko', 'en', 'ja' 등
    country: text("country"),                      // 'KR', 'US' 등
    sentiment: text("sentiment"),                  // 'positive', 'neutral', 'negative'
    sentimentScore: real("sentiment_score"),       // 0.0 ~ 1.0
    topics: text("topics"),                        // JSON 문자열: ["응원", "질문"]

    // 상태
    isRead: integer("is_read", { mode: "boolean" }).default(false),
    isStarred: integer("is_starred", { mode: "boolean" }).default(false),

    // 타임스탬프
    receivedAt: text("received_at"),              // 이메일 수신 시간 (ISO String)
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    senderEmailIdx: index("idx_sender_email").on(table.senderEmail),
    languageIdx: index("idx_language").on(table.language),
    countryIdx: index("idx_country").on(table.country),
    sentimentIdx: index("idx_sentiment").on(table.sentiment),
    isReadIdx: index("idx_is_read").on(table.isRead),
    receivedAtIdx: index("idx_received_at").on(table.receivedAt),
}));

export const replies = sqliteTable("replies", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    letterId: integer("letter_id").references(() => fanLetters.id).notNull(),
    content: text("content").notNull(),

    // 이메일 발송 상태
    emailSent: integer("email_sent", { mode: "boolean" }).default(false),
    emailSentAt: text("email_sent_at"),

    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    letterIdIdx: index("idx_reply_letter_id").on(table.letterId),
}));
