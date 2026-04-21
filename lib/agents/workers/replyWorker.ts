import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from '@virtuals-protocol/game';
import { createReplyClient, withRetry } from '@/lib/llm';
import {
  REPLY_SYSTEM_PROMPT,
  PLAN_SYSTEM_PROMPT,
  buildPlanPrompt,
  buildWriteUserPrompt,
  parseReplyResponse,
} from '@/lib/llm/reply-prompt';
import { parsePlanResponse } from '@/lib/llm/reply-parser';

const generateReplyFunction = new GameFunction({
  name: 'generate_fan_reply',
  description: 'Generate a personalized reply as Chooncme (춘심이) persona using Flock.io LLM. Returns reply subject, body, and emotional_tone detected from the fan letter.',
  args: [
    { name: 'fan_name', type: 'string', description: 'Fan name' },
    { name: 'letter_subject', type: 'string', description: 'Fan letter subject' },
    { name: 'letter_content', type: 'string', description: 'Fan letter content' },
  ] as const,
  executable: async (args, logger) => {
    try {
      const llm = createReplyClient();
      const base = {
        fanName: args.fan_name ?? '',
        letterSubject: args.letter_subject ?? '',
        letterContent: args.letter_content ?? '',
      };

      // 1단계: 감정 분석 + 답장 계획 수립
      const planPrompt = buildPlanPrompt(base);
      const planResponse = await withRetry(() => llm.chat(PLAN_SYSTEM_PROMPT, planPrompt));
      const plan = parsePlanResponse(planResponse.content);

      logger?.(`Plan: emotional_tone=${plan.emotional_tone}, lang=${plan.detected_language}`);

      // 2단계: 계획 기반 답장 생성
      const writePrompt = buildWriteUserPrompt({ ...base, plan });
      const writeResponse = await withRetry(() => llm.chat(REPLY_SYSTEM_PROMPT, writePrompt));
      const reply = parseReplyResponse(writeResponse.content);

      logger?.(`Reply generated: ${reply.subject}`);

      // emotional_tone을 포함하여 반환
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        JSON.stringify({
          subject: reply.subject,
          body: reply.body,
          emotional_tone: plan.emotional_tone,
          detected_language: plan.detected_language,
        })
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        `Reply generation failed: ${e instanceof Error ? e.message : 'Unknown error'}`
      );
    }
  },
});

export const replyWorker = new GameWorker({
  id: 'reply_worker',
  name: 'Fan Reply Generator',
  description: 'Generates personalized fan replies as Chooncme persona using 2-step LLM process: (1) emotional analysis + plan, (2) reply writing. Returns reply with emotional_tone for NFT tier decision.',
  functions: [generateReplyFunction],
});
