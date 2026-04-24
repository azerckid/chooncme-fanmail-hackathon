import crypto from 'crypto';
import { parseAbi, encodeFunctionData } from 'viem';
import { getWalletProvider, getAgentWalletAddress } from './agentkit';

export type NftTier = 'golden' | 'comfort' | 'standard';

export type EmotionalTone =
  | 'love' | 'support' | 'joy' | 'gratitude'
  | 'longing' | 'sadness' | 'concern' | 'neutral';

export interface MintResult {
  tokenId: string;
  txHash: string;
  claimUrl: string;
  tier: NftTier;
}

const REPLY_NFT_ABI = parseAbi([
  'function mintTo(address recipient, string memory tokenURI) external returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
]);

export function getTierFromEmotion(tone: EmotionalTone): NftTier {
  if (['love', 'support', 'joy', 'gratitude'].includes(tone)) return 'golden';
  if (['longing', 'sadness', 'concern'].includes(tone)) return 'comfort';
  return 'standard';
}

const NFT_IMAGES = [
  'bafkreia54qsrou2wxka5rlvub62gjidmffscenu7d5g7rrragkjbktparu',
  'bafkreick3imgrprtajs36f37ues53pudnmofwciuxdmmxjjqwuzkty5ofq',
  'bafkreicedpfx2t5wzy56qnupotk33rk3h5rlktvv36um4agh3jkfvshdqq',
  'bafkreidffh4ksnjjqibspggooli6lyp3gug4nuvggv3aawjsevmwxkcxp4',
];

function getRandomImageUrl(): string {
  const cid = NFT_IMAGES[Math.floor(Math.random() * NFT_IMAGES.length)];
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

function buildMetadata(params: {
  replyContent: string;
  receivedAt: string;
  tier: NftTier;
}) {
  // PII 보호: 팬 이름/이메일 제외, 답장 내용은 해시만 기록
  const replyHash = crypto
    .createHash('sha256')
    .update(params.replyContent)
    .digest('hex')
    .slice(0, 16);

  const tierLabels: Record<NftTier, string> = {
    golden: 'Golden Reply',
    comfort: 'Comfort Reply',
    standard: 'Reply',
  };

  return {
    name: `춘심이의 ${tierLabels[params.tier]}`,
    description: '춘심이가 직접 쓴 팬레터 답장입니다. Base 블록체인에 영구 기록되었습니다.',
    image: getRandomImageUrl(),
    attributes: [
      { trait_type: 'tier', value: params.tier },
      { trait_type: 'date', value: params.receivedAt },
      { trait_type: 'reply_hash', value: replyHash },
    ],
  };
}

function buildDataUri(metadata: object): string {
  const json = JSON.stringify(metadata);
  const base64 = Buffer.from(json).toString('base64');
  return `data:application/json;base64,${base64}`;
}

export async function mintReplyNFT(params: {
  replyContent: string;
  receivedAt: string;
  emotionalTone?: EmotionalTone;
}): Promise<MintResult> {
  const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error('NFT_CONTRACT_ADDRESS is not set');

  const network = process.env.BASE_NETWORK ?? 'base-sepolia';
  const tier = getTierFromEmotion(params.emotionalTone ?? 'neutral');
  const metadata = buildMetadata({
    replyContent: params.replyContent,
    receivedAt: params.receivedAt,
    tier,
  });
  const metadataUri = buildDataUri(metadata);

  const provider = await getWalletProvider();
  const agentAddress = await getAgentWalletAddress();
  const publicClient = provider.getPublicClient();

  // encodeFunctionData로 calldata 생성 후 sendTransaction
  const data = encodeFunctionData({
    abi: REPLY_NFT_ABI,
    functionName: 'mintTo',
    args: [agentAddress as `0x${string}`, metadataUri],
  });

  const hash = await provider.sendTransaction({
    to: contractAddress as `0x${string}`,
    data,
  });

  // 트랜잭션 receipt에서 tokenId 파싱
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const transferLog = receipt.logs.find(
    (log) => log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  );
  const tokenId = transferLog?.topics[3]
    ? String(BigInt(transferLog.topics[3]))
    : '0';

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  console.log(`[NFT] Minted: tier=${tier}, tokenId=${tokenId}, txHash=${hash}`);

  return {
    tokenId,
    txHash: hash,
    claimUrl: `${appUrl}/claim/${tokenId}`,
    tier,
  };
}
