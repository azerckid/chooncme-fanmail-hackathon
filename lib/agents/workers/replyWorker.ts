import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from '@virtuals-protocol/game';
import { createReplyClient, withRetry } from '@/lib/llm';
import {
  REPLY_SYSTEM_PROMPT,
  buildReplyUserPrompt,
  parseReplyResponse,
} from '@/lib/llm/reply-prompt';

const generateReplyFunction = new GameFunction({
  name: 'generate_fan_reply',
  description: 'Generate a personalized reply as Chooncme (춘심이) persona using Flock.io LLM',
  args: [
    { name: 'fan_name', type: 'string', description: 'Fan name' },
    { name: 'letter_subject', type: 'string', description: 'Fan letter subject' },
    { name: 'letter_content', type: 'string', description: 'Fan letter content' },
  ] as const,
  executable: async (args, logger) => {
    try {
      const llm = createReplyClient();
      const userPrompt = buildReplyUserPrompt({
        fanName: args.fan_name ?? '',
        letterSubject: args.letter_subject ?? '',
        letterContent: args.letter_content ?? '',
      });

      const response = await withRetry(() => llm.chat(REPLY_SYSTEM_PROMPT, userPrompt));
      const reply = parseReplyResponse(response.content);

      logger?.(`Reply generated: ${reply.subject}`);

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        JSON.stringify(reply)
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
  description: 'Generates personalized fan replies as Chooncme persona. Supports Korean, English, and Japanese.',
  functions: [generateReplyFunction],
});
