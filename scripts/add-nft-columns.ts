/**
 * replies 테이블에 NFT 컬럼 직접 추가
 * 실행: npx ts-node scripts/add-nft-columns.ts
 */
import * as dotenv from 'dotenv';
import { createClient } from '@libsql/client';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function main() {
  const info = await client.execute("PRAGMA table_info(replies)");
  const columns = info.rows.map((r) => r[1] as string);
  console.log('replies 현재 컬럼:', columns);

  const toAdd = [
    { name: 'nft_token_id', type: 'TEXT' },
    { name: 'nft_tx_hash', type: 'TEXT' },
    { name: 'nft_claim_url', type: 'TEXT' },
    { name: 'nft_tier', type: 'TEXT' },
  ];

  for (const col of toAdd) {
    if (!columns.includes(col.name)) {
      await client.execute(`ALTER TABLE replies ADD COLUMN ${col.name} ${col.type}`);
      console.log(`[OK] ${col.name} 추가됨`);
    } else {
      console.log(`[SKIP] ${col.name} 이미 존재`);
    }
  }

  console.log('완료');
}

main().catch(console.error);
