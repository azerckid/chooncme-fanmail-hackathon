/**
 * LLM 클라이언트
 * Google Gemini 또는 OpenAI를 지원
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export type LLMProvider = 'gemini' | 'openai';
export type LLMTaskType = 'classify' | 'reply';

// 기본 모델 설정
const DEFAULT_MODELS = {
  gemini: {
    classify: 'gemini-2.5-flash',
    reply: 'gemini-2.5-flash',
  },
  openai: {
    classify: 'gpt-4o-mini',
    reply: 'gpt-4o-mini',
  },
} as const;

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * LLM 클라이언트 생성
 */
export function createLLMClient(config: LLMConfig) {
  if (config.provider === 'gemini') {
    return new GeminiClient(config);
  } else if (config.provider === 'openai') {
    return new OpenAIClient(config);
  }
  throw new Error(`Unsupported LLM provider: ${config.provider}`);
}

/**
 * 환경변수에서 LLM 클라이언트 자동 생성
 * @param taskType 작업 유형 (classify: 분류, reply: 답장 생성)
 */
export function createLLMClientFromEnv(
  taskType: LLMTaskType = 'reply'
): ReturnType<typeof createLLMClient> {
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    const model = getModelForTask('gemini', taskType);
    return createLLMClient({
      provider: 'gemini',
      apiKey: geminiKey,
      model,
    });
  }

  if (openaiKey) {
    const model = getModelForTask('openai', taskType);
    return createLLMClient({
      provider: 'openai',
      apiKey: openaiKey,
      model,
    });
  }

  throw new Error('No LLM API key found. Set GOOGLE_GEMINI_API_KEY or OPENAI_API_KEY');
}

/**
 * 작업 유형에 따른 모델 선택
 * 환경변수 우선, 없으면 기본값 사용
 */
function getModelForTask(provider: LLMProvider, taskType: LLMTaskType): string {
  if (provider === 'gemini') {
    if (taskType === 'classify') {
      return process.env.GEMINI_CLASSIFY_MODEL || DEFAULT_MODELS.gemini.classify;
    }
    return process.env.GEMINI_REPLY_MODEL || DEFAULT_MODELS.gemini.reply;
  }

  // OpenAI
  if (taskType === 'classify') {
    return process.env.OPENAI_CLASSIFY_MODEL || DEFAULT_MODELS.openai.classify;
  }
  return process.env.OPENAI_REPLY_MODEL || DEFAULT_MODELS.openai.reply;
}

/**
 * 분류용 LLM 클라이언트 생성 (편의 함수)
 */
export function createClassifyClient(): ReturnType<typeof createLLMClient> {
  return createLLMClientFromEnv('classify');
}

/**
 * 답장 생성용 LLM 클라이언트 생성 (편의 함수)
 */
export function createReplyClient(): ReturnType<typeof createLLMClient> {
  return createLLMClientFromEnv('reply');
}

/**
 * Gemini 클라이언트
 */
class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(config: LLMConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || 'gemini-2.5-flash';
  }

  async chat(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const text = response.text();

    return {
      content: text,
      usage: response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount || 0,
            completionTokens: response.usageMetadata.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
    };
  }
}

/**
 * OpenAI 클라이언트
 */
class OpenAIClient {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o-mini';
  }

  async chat(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    if (!message) {
      throw new Error('No response from OpenAI');
    }

    return {
      content: message.content || '',
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }
}

/**
 * Rate limit 대응을 위한 지수 백오프 재시도
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelayMs = 1000, maxDelayMs = 30000 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Rate limit 또는 일시적 오류인 경우에만 재시도
      const isRetryable =
        lastError.message.includes('429') ||
        lastError.message.includes('rate') ||
        lastError.message.includes('timeout') ||
        lastError.message.includes('503');

      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }

      // 지수 백오프
      const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
      console.log(`LLM retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
