import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from '@virtuals-protocol/game';
import { createClassifyClient, withRetry } from '@/lib/llm';
import { CLASSIFY_SYSTEM_PROMPT, buildClassifyUserPrompt, parseClassifyResponse } from '@/lib/llm/classify-prompt';

const classifyEmailFunction = new GameFunction({
  name: 'classify_fan_email',
  description: 'Classify an incoming email as fan letter or general mail using Flock.io LLM',
  args: [
    { name: 'from', type: 'string', description: 'Sender email address' },
    { name: 'subject', type: 'string', description: 'Email subject' },
    { name: 'body_preview', type: 'string', description: 'Email body preview (max 500 chars)' },
  ] as const,
  executable: async (args, logger) => {
    try {
      const llm = createClassifyClient();
      const userPrompt = buildClassifyUserPrompt({
        from: args.from ?? '',
        subject: args.subject ?? '',
        bodyPreview: args.body_preview ?? '',
      });

      const response = await withRetry(() => llm.chat(CLASSIFY_SYSTEM_PROMPT, userPrompt));
      const result = parseClassifyResponse(response.content);

      logger?.(`Classified: ${result.classification} (confidence: ${result.confidence})`);

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        JSON.stringify(result)
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        `Classification failed: ${e instanceof Error ? e.message : 'Unknown error'}`
      );
    }
  },
});

export const classifierWorker = new GameWorker({
  id: 'classifier_worker',
  name: 'Fan Email Classifier',
  description: 'Classifies incoming emails as fan letters or general mail using Flock.io Web3 Agent Model',
  functions: [classifyEmailFunction],
});
