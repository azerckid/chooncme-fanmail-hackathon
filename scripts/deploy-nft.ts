import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import solc from 'solc';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { getWalletProvider } from '../lib/blockchain/agentkit';

async function main() {
  // 1. 컨트랙트 소스 읽기
  const source = fs.readFileSync(
    path.resolve(process.cwd(), 'contracts/ReplyNFT.sol'),
    'utf8'
  );

  // OpenZeppelin 임포트 해석
  const nodeModules = path.resolve(process.cwd(), 'node_modules');
  const input = {
    language: 'Solidity',
    sources: { 'ReplyNFT.sol': { content: source } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } },
  };

  function findImports(importPath: string) {
    const full = path.resolve(nodeModules, importPath);
    if (fs.existsSync(full)) return { contents: fs.readFileSync(full, 'utf8') };
    return { error: `File not found: ${importPath}` };
  }

  console.log('컨트랙트 컴파일 중...');
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors?.some((e: any) => e.severity === 'error')) {
    console.error('컴파일 에러:', output.errors);
    process.exit(1);
  }

  const contract = output.contracts['ReplyNFT.sol']['ReplyNFT'];
  const bytecode = contract.evm.bytecode.object as `0x${string}`;
  console.log('컴파일 완료.');

  // 2. AgentKit 지갑으로 배포
  console.log('AgentKit 지갑 초기화 중...');
  const provider = await getWalletProvider();
  const address = await provider.getAddress();
  console.log('배포 주소:', address);

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  console.log('컨트랙트 배포 중...');
  const txHash = await provider.sendTransaction({
    to: null as any,
    data: `0x${bytecode}` as `0x${string}`,
    value: 0n,
  });

  console.log('트랜잭션 해시:', txHash);
  console.log('배포 확인 중...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
  const contractAddress = receipt.contractAddress;

  console.log('\n============================');
  console.log('NFT 컨트랙트 배포 완료!');
  console.log('주소:', contractAddress);
  console.log('============================');
  console.log('\n.env.local에 추가하세요:');
  console.log(`NFT_CONTRACT_ADDRESS=${contractAddress}`);
}

main().catch(console.error);
