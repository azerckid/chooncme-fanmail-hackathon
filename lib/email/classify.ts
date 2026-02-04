/**
 * 이메일 분류 (팬레터 vs 일반 메일)
 * LLM을 사용하여 이메일을 분류
 */

import {
  createClassifyClient,
  withRetry,
  CLASSIFY_SYSTEM_PROMPT,
  buildClassifyUserPrompt,
  parseClassifyResponse,
  truncateBodyForClassification,
  type ClassificationResult,
} from '@/lib/llm';
import { EmailMessage } from './types';

export { type ClassificationResult };

/**
 * 단일 이메일 분류
 */
export async function classifyEmail(email: EmailMessage): Promise<ClassificationResult> {
  const llm = createClassifyClient();

  const userPrompt = buildClassifyUserPrompt({
    from: email.from,
    subject: email.subject,
    bodyPreview: truncateBodyForClassification(email.bodyPlain, 500),
  });

  const response = await withRetry(() => llm.chat(CLASSIFY_SYSTEM_PROMPT, userPrompt));

  return parseClassifyResponse(response.content);
}

/**
 * 여러 이메일 일괄 분류
 * Rate limit 대응을 위해 요청 간 지연 포함
 */
export async function classifyEmails(
  emails: EmailMessage[],
  options: {
    /** 요청 간 지연 (ms), 기본 500ms */
    delayMs?: number;
    /** 분류 중 오류 발생 시 콜백 */
    onError?: (email: EmailMessage, error: Error) => void;
    /** 분류 완료 시 콜백 */
    onClassified?: (email: EmailMessage, result: ClassificationResult) => void;
  } = {}
): Promise<Map<string, ClassificationResult>> {
  const { delayMs = 500, onError, onClassified } = options;
  const results = new Map<string, ClassificationResult>();

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];

    try {
      const result = await classifyEmail(email);
      results.set(email.id, result);
      onClassified?.(email, result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`[Classify] Failed to classify email ${email.id}:`, err.message);
      onError?.(email, err);

      // 분류 실패 시 안전하게 general로 처리
      results.set(email.id, {
        classification: 'general',
        confidence: 0,
        reason: `Classification failed: ${err.message}`,
      });
    }

    // Rate limit 대응: 마지막이 아니면 지연
    if (i < emails.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * 팬레터만 필터링
 */
export async function filterFanLetters(
  emails: EmailMessage[],
  options?: Parameters<typeof classifyEmails>[1]
): Promise<EmailMessage[]> {
  const classifications = await classifyEmails(emails, options);

  return emails.filter((email) => {
    const result = classifications.get(email.id);
    return result?.classification === 'fan';
  });
}

/**
 * 이메일을 팬레터/일반 메일로 분리
 */
export async function partitionEmails(
  emails: EmailMessage[],
  options?: Parameters<typeof classifyEmails>[1]
): Promise<{
  fanLetters: EmailMessage[];
  generalEmails: EmailMessage[];
  classifications: Map<string, ClassificationResult>;
}> {
  const classifications = await classifyEmails(emails, options);

  const fanLetters: EmailMessage[] = [];
  const generalEmails: EmailMessage[] = [];

  for (const email of emails) {
    const result = classifications.get(email.id);
    if (result?.classification === 'fan') {
      fanLetters.push(email);
    } else {
      generalEmails.push(email);
    }
  }

  return { fanLetters, generalEmails, classifications };
}
