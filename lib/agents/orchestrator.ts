import { GameAgent, GameWorker, GameFunction, LLMModel } from '@virtuals-protocol/game';
import { classifierWorker } from './workers/classifierWorker';
import { replyWorker } from './workers/replyWorker';
import { nftWorker } from './workers/nftWorker';
import { isAcpEnabled, runAcpPipeline } from './acpBridge';
import type { EmailMessage } from '@/lib/email';

export function isGameEnabled(): boolean {
  return !!process.env.GAME_API_KEY;
}

interface SessionResult {
  classification?: { classification: string; confidence: number };
  reply?: { subject: string; body: string; emotional_tone: string };
  nft?: { tokenId: string; claimUrl: string; tier: string };
}

function makeCapturingWorker(
  base: GameWorker,
  onResult: (result: unknown) => void,
  env: Record<string, string>
): GameWorker {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn = base.functions[0] as any;
  return new GameWorker({
    id: base.id,
    name: base.name,
    description: base.description,
    functions: [
      new GameFunction({
        name: fn.name,
        description: fn.description,
        args: fn.args,
        executable: async (args, logger) => {
          const res = await fn.execute(args, logger);
          try { onResult(JSON.parse(res.feedback ?? '{}')); } catch {}
          return res;
        },
      }),
    ],
    getEnvironment: async () => env,
  });
}

export async function processWithGame(
  email: EmailMessage
): Promise<{ claimUrl?: string; replyBody?: string; replySubject?: string } | null> {
  if (!isGameEnabled()) return null;

  try {
    const results: SessionResult = {};

    const emailEnv = {
      from: email.fromEmail,
      name: email.fromName ?? '',
      subject: email.subject,
      body: email.bodyPlain.slice(0, 500),
    };

    if (isAcpEnabled()) {
      const { replyJobId, nftJobId } = await runAcpPipeline({
        fanEmail: email.fromEmail,
        fanName: email.fromName,
        subject: email.subject,
        content: email.bodyPlain,
      });
      console.log(`[GAME] ACP jobs initiated: replyJobId=${replyJobId}, nftJobId=${nftJobId}`);
    }

    const workers = [
      makeCapturingWorker(classifierWorker, (r) => { results.classification = r as SessionResult['classification']; }, emailEnv),
      makeCapturingWorker(replyWorker,      (r) => { results.reply = r as SessionResult['reply']; },          emailEnv),
      makeCapturingWorker(nftWorker,        (r) => { results.nft = r as SessionResult['nft']; },             emailEnv),
    ];

    const flockKey = process.env.FLOCK_API_KEY;
    const flockBase = process.env.FLOCK_BASE_URL ?? 'https://api.flock.io/v1';
    const flockModel = process.env.FLOCK_MODEL ?? 'deepseek-v3.2';

    const agent = new GameAgent(process.env.GAME_API_KEY!, {
      name: 'Chooncme Fan Agent',
      goal: `Process fan letter from ${email.fromName} <${email.fromEmail}>. Subject: "${email.subject}". Classify if fan letter, generate Chooncme persona reply, then mint Reply NFT on Base blockchain.`,
      description:
        'Multi-agent pipeline on Virtuals GAME framework: ' +
        'classify fan emails → generate personalized K-pop idol replies → mint ERC-721 NFT on Base.',
      workers,
      getAgentState: async () => emailEnv,
      ...(flockKey
        ? { llmModel: flockModel, llmModelBaseUrl: flockBase, llmModelApiKey: flockKey }
        : { llmModel: LLMModel.DeepSeek_R1 }),
    });

    await agent.init();

    for (let i = 0; i < 10; i++) {
      const action = await agent.step({ verbose: true });
      console.log(`[GAME] step ${i + 1}: ${action}`);
      if (action === 'wait' || action === 'unknown') break;
    }

    if (results.classification?.classification !== 'fan') {
      console.log(`[GAME] Not a fan letter: ${email.subject}`);
      return null;
    }
    if (!results.reply?.body) return null;

    console.log(`[GAME] Pipeline complete: fan=${email.fromEmail}, tier=${results.nft?.tier ?? 'unknown'}`);

    return {
      replySubject: results.reply.subject,
      replyBody: results.reply.body,
      claimUrl: results.nft?.claimUrl,
    };
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = e as any;
    if (err?.isAxiosError) {
      console.error('[GAME] Axios error status:', err.response?.status);
      console.error('[GAME] Axios error body:', JSON.stringify(err.response?.data, null, 2));
      console.error('[GAME] Request URL:', err.config?.url);
      console.error('[GAME] Request payload:', typeof err.config?.data === 'string' ? err.config.data.slice(0, 1000) : err.config?.data);
    } else {
      console.error('[GAME] step() pipeline error, falling back to standard pipeline:', e);
    }
    return null;
  }
}
