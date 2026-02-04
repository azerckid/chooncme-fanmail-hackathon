/**
 * LLM을 사용한 답장 생성
 */

import {
  createReplyClient,
  withRetry,
  REPLY_SYSTEM_PROMPT,
  buildReplyUserPrompt,
  parseReplyResponse,
  type GeneratedReply,
} from '@/lib/llm';
import { EmailMessage } from '@/lib/email';

export { type GeneratedReply };

/**
 * 답장 생성 입력
 */
export interface GenerateReplyInput {
  /** 팬 이름 */
  fanName: string;
  /** 팬레터 제목 */
  letterSubject: string;
  /** 팬레터 본문 */
  letterContent: string;
}

/**
 * 답장 생성 결과
 */
export interface GenerateReplyResult {
  success: boolean;
  reply?: GeneratedReply;
  error?: string;
}

/**
 * LLM을 사용하여 답장 생성
 */
export async function generateReply(input: GenerateReplyInput): Promise<GenerateReplyResult> {
  try {
    const llm = createReplyClient();

    const userPrompt = buildReplyUserPrompt({
      fanName: input.fanName,
      letterSubject: input.letterSubject,
      letterContent: input.letterContent,
    });

    const response = await withRetry(() => llm.chat(REPLY_SYSTEM_PROMPT, userPrompt));

    const reply = parseReplyResponse(response.content);

    return {
      success: true,
      reply,
    };
  } catch (error) {
    console.error('[ReplyGenerator] Failed to generate reply:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 이메일 메시지에서 답장 생성 (편의 함수)
 */
export async function generateReplyFromEmail(email: EmailMessage): Promise<GenerateReplyResult> {
  return generateReply({
    fanName: email.fromName,
    letterSubject: email.subject,
    letterContent: email.bodyPlain,
  });
}

/**
 * 여러 이메일에 대해 답장 일괄 생성
 */
export async function generateReplies(
  emails: EmailMessage[],
  options: {
    /** 요청 간 지연 (ms), 기본 1000ms */
    delayMs?: number;
    /** 생성 완료 시 콜백 */
    onGenerated?: (email: EmailMessage, result: GenerateReplyResult) => void;
  } = {}
): Promise<Map<string, GenerateReplyResult>> {
  const { delayMs = 1000, onGenerated } = options;
  const results = new Map<string, GenerateReplyResult>();

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];

    const result = await generateReplyFromEmail(email);
    results.set(email.id, result);
    onGenerated?.(email, result);

    // Rate limit 대응: 마지막이 아니면 지연
    if (i < emails.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
