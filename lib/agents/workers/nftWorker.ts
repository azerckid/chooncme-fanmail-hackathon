import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from '@virtuals-protocol/game';
import { mintReplyNFT, type EmotionalTone } from '@/lib/blockchain/nft';

const mintNftFunction = new GameFunction({
  name: 'mint_reply_nft',
  description: 'Mint a Reply NFT on Base Sepolia via AgentKit. Tier is automatically determined by emotional tone.',
  args: [
    { name: 'reply_content', type: 'string', description: 'Reply text content' },
    { name: 'received_at', type: 'string', description: 'ISO timestamp of when letter was received' },
    { name: 'emotional_tone', type: 'string', description: 'Emotional tone: love/support/joy/gratitude/longing/sadness/concern/neutral' },
  ] as const,
  executable: async (args, logger) => {
    try {
      if (!process.env.NFT_CONTRACT_ADDRESS) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({ skipped: true, reason: 'NFT_CONTRACT_ADDRESS not set' })
        );
      }

      const result = await mintReplyNFT({
        replyContent: args.reply_content ?? '',
        receivedAt: args.received_at ?? new Date().toISOString(),
        emotionalTone: (args.emotional_tone as EmotionalTone) ?? 'neutral',
      });

      logger?.(`NFT minted: tier=${result.tier}, tokenId=${result.tokenId}`);

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        JSON.stringify(result)
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        `NFT minting failed: ${e instanceof Error ? e.message : 'Unknown error'}`
      );
    }
  },
});

export const nftWorker = new GameWorker({
  id: 'nft_worker',
  name: 'Reply NFT Minter',
  description: 'Mints Reply NFTs on Base Sepolia using Coinbase AgentKit. Automatically selects Golden/Comfort/Standard tier based on emotional tone.',
  functions: [mintNftFunction],
});
