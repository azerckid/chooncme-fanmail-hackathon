import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

import { createAcpAgent } from '../lib/agents/acpAgentFactory';

async function main() {
  console.log('ACP 에이전트 초기화 중...');
  console.log('IS_TESTNET:', process.env.IS_TESTNET);
  console.log('ACP_ENABLED:', process.env.ACP_ENABLED);

  const agent = await createAcpAgent();
  console.log('ACP 에이전트 생성 완료:', agent);
}

main().catch(console.error);
