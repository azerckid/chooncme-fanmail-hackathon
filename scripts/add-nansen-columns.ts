/**
 * fan_letters 테이블에 Nansen 컬럼 직접 추가
 * 실행: npx ts-node scripts/add-nansen-columns.ts
 */
import * as dotenv from 'dotenv';
import { createClient } from '@libsql/client';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function main() {
  // 현재 컬럼 목록 확인
  const info = await client.execute("PRAGMA table_info(fan_letters)");
  const columns = info.rows.map((r) => r[1] as string);
  console.log('현재 컬럼:', columns);

  if (!columns.includes('wallet_address')) {
    await client.execute("ALTER TABLE fan_letters ADD COLUMN wallet_address TEXT");
    console.log('[OK] wallet_address 컬럼 추가됨');
  } else {
    console.log('[SKIP] wallet_address 이미 존재');
  }

  if (!columns.includes('fan_tier')) {
    await client.execute("ALTER TABLE fan_letters ADD COLUMN fan_tier TEXT");
    console.log('[OK] fan_tier 컬럼 추가됨');
  } else {
    console.log('[SKIP] fan_tier 이미 존재');
  }

  console.log('완료');
}

main().catch(console.error);
