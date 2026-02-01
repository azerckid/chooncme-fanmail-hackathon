/**
 * 0001_fan_letters_replied 마이그레이션만 실행.
 * (drizzle-kit migrate는 0000부터 전부 실행하려 해서, 이미 테이블이 있으면 실패할 때 사용)
 */
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
}

const client = createClient({ url, authToken: authToken ?? undefined });

const statements = [
    "ALTER TABLE fan_letters ADD COLUMN is_replied integer DEFAULT 0",
    "ALTER TABLE fan_letters ADD COLUMN replied_at text",
    "CREATE INDEX IF NOT EXISTS idx_is_replied ON fan_letters (is_replied)",
];

async function main() {
    for (const sql of statements) {
        try {
            await client.execute(sql);
            console.log("OK:", sql.slice(0, 60) + "...");
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes("duplicate column") || msg.includes("already exists")) {
                console.log("SKIP (already applied):", sql.slice(0, 50) + "...");
            } else {
                console.error("FAIL:", sql);
                console.error(e);
                process.exit(1);
            }
        }
    }
    console.log("0001 migration done.");
}

main();
