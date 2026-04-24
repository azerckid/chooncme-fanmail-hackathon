import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getAgentWalletAddress } from '../lib/blockchain/agentkit';

async function main() {
  console.log('AgentKit 지갑 초기화 중...');
  const address = await getAgentWalletAddress();
  console.log('지갑 주소:', address);
}

main().catch(console.error);
