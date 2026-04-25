import { createReplyClient, withRetry } from '@/lib/llm';
import {
  REPLY_SYSTEM_PROMPT,
  PLAN_SYSTEM_PROMPT,
  buildPlanPrompt,
  buildWriteUserPrompt,
  parseReplyResponse,
} from '@/lib/llm/reply-prompt';
import { parsePlanResponse } from '@/lib/llm/reply-parser';
import { mintReplyNFT, type EmotionalTone } from '@/lib/blockchain/nft';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AcpJob = any;

async function handleReplyJob(job: AcpJob): Promise<object> {
  const req = safeParseRequirement(job);
  const llm = createReplyClient();

  const base = {
    fanName: req.fan_name ?? req.fanName ?? 'Fan',
    letterSubject: req.letter_subject ?? req.letterSubject ?? '',
    letterContent: req.letter_content ?? req.letterContent ?? '',
  };

  const planResponse = await withRetry(() => llm.chat(PLAN_SYSTEM_PROMPT, buildPlanPrompt(base)));
  const plan = parsePlanResponse(planResponse.content);

  const writeResponse = await withRetry(() =>
    llm.chat(REPLY_SYSTEM_PROMPT, buildWriteUserPrompt({ ...base, plan }))
  );
  const reply = parseReplyResponse(writeResponse.content);

  console.log(`[ACP Provider] Reply generated: subject="${reply.subject}", tone=${plan.emotional_tone}`);

  return {
    subject: reply.subject,
    body: reply.body,
    emotional_tone: plan.emotional_tone,
    detected_language: plan.detected_language,
  };
}

async function handleNftJob(job: AcpJob): Promise<object> {
  const req = safeParseRequirement(job);

  const result = await mintReplyNFT({
    replyContent: req.reply_content ?? req.replyContent ?? '',
    receivedAt: req.received_at ?? req.receivedAt ?? new Date().toISOString(),
    emotionalTone: (req.emotional_tone ?? req.emotionalTone ?? 'neutral') as EmotionalTone,
  });

  console.log(`[ACP Provider] NFT minted: tier=${result.tier}, tokenId=${result.tokenId}`);

  return result;
}

function safeParseRequirement(job: AcpJob): Record<string, string> {
  try {
    const raw = job.serviceRequirement ?? job.memo ?? '{}';
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
}

export async function handleJob(job: AcpJob): Promise<object> {
  const serviceName: string = job.serviceName ?? job.service_name ?? '';

  if (serviceName === 'generate_fan_reply') {
    return handleReplyJob(job);
  }
  if (serviceName === 'mint_reply_nft') {
    return handleNftJob(job);
  }

  console.warn(`[ACP Provider] Unknown service: ${serviceName}`);
  return { error: `Unknown service: ${serviceName}` };
}
