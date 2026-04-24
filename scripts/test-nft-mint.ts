import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { mintReplyNFT } from '../lib/blockchain/nft';

async function main() {
  console.log('NFT 민팅 테스트...');
  console.log('컨트랙트:', process.env.NFT_CONTRACT_ADDRESS);

  const result = await mintReplyNFT({
    recipient: process.env.AGENT_WALLET_ADDRESS!,
    senderName: '테스트팬',
    replyContent: '안녕하세요 춘심이! 항상 응원해요!',
    emotionalTone: 'love',
    letterId: 'test-001',
  });

  console.log('\n============================');
  console.log('민팅 완료!');
  console.log('Token ID:', result.tokenId);
  console.log('Tx Hash:', result.txHash);
  console.log('Tier:', result.tier);
  console.log('Claim URL:', result.claimUrl);
  console.log('============================');
}

main().catch(console.error);
