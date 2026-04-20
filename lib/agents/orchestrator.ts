import { GameAgent, LLMModel } from '@virtuals-protocol/game';
import { classifierWorker } from './workers/classifierWorker';
import { replyWorker } from './workers/replyWorker';
import { nftWorker } from './workers/nftWorker';
import type { EmailMessage } from '@/lib/email';

export function isGameEnabled(): boolean {
  return !!process.env.GAME_API_KEY;
}

let orchestrator: GameAgent | null = null;

export function getOrchestrator(): GameAgent {
  if (orchestrator) return orchestrator;

  const apiKey = process.env.GAME_API_KEY;
  if (!apiKey) throw new Error('GAME_API_KEY is not set');

  orchestrator = new GameAgent(apiKey, {
    name: 'Chooncme Fan Agent',
    goal: 'Process fan letters: classify incoming emails, generate personalized replies as Chooncme persona, and mint Reply NFTs on Base blockchain.',
    description:
      'A multi-agent system built on Virtuals GAME framework. ' +
      'Uses Flock.io Web3 Agent LLM for classification and reply generation, ' +
      'Coinbase AgentKit for NFT minting on Base Sepolia, ' +
      'and x402 protocol for autonomous on-chain payment of inference costs.',
    workers: [classifierWorker, replyWorker, nftWorker],
    llmModel: LLMModel.DeepSeek_R1,
  });

  return orchestrator;
}

/**
 * GAME Worker functions를 직접 실행하여 팬레터 1건 처리
 * GAME_API_KEY 미설정 시 null 반환 → 기존 파이프라인으로 폴백
 */
export async function processWithGame(
  email: EmailMessage
): Promise<{ claimUrl?: string; replyBody?: string; replySubject?: string } | null> {
  if (!isGameEnabled()) return null;

  try {
    // GameAgent 초기화 (Workers 등록용)
    getOrchestrator();

    const log = (msg: string) => console.log(`[GAME] ${msg}`);

    // 1단계: ClassifierWorker — 팬메일 분류
    const classifyFn = classifierWorker.functions[0];
    const classifyRes = await classifyFn.execute(
      {
        from: { value: email.fromEmail },
        subject: { value: email.subject },
        body_preview: { value: email.bodyPlain.slice(0, 500) },
      },
      log
    );

    const classification = JSON.parse(classifyRes.feedback ?? '{}');
    if (classification.classification !== 'fan') {
      log(`Not a fan letter: ${email.subject}`);
      return null;
    }

    // 2단계: ReplyWorker — 답장 생성
    const replyFn = replyWorker.functions[0];
    const replyRes = await replyFn.execute(
      {
        fan_name: { value: email.fromName },
        letter_subject: { value: email.subject },
        letter_content: { value: email.bodyPlain },
      },
      log
    );

    const reply = JSON.parse(replyRes.feedback ?? '{}');
    if (!reply.body) return null;

    // 3단계: NFTWorker — Reply NFT 민팅
    const nftFn = nftWorker.functions[0];
    const nftRes = await nftFn.execute(
      {
        reply_content: { value: reply.body },
        received_at: { value: new Date().toISOString() },
        emotional_tone: { value: classification.emotional_tone ?? 'neutral' },
      },
      log
    );

    const nft = JSON.parse(nftRes.feedback ?? '{}');
    log(`Pipeline complete: fan=${email.fromEmail}, tier=${nft.tier ?? 'unknown'}`);

    return {
      replySubject: reply.subject,
      replyBody: reply.body,
      claimUrl: nft.claimUrl,
    };
  } catch (e) {
    console.error('[GAME] Orchestrator error, falling back to standard pipeline:', e);
    return null;
  }
}
