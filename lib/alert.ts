/**
 * 알림 기능 (Slack/Discord Webhook)
 * 에러 발생 시 관리자에게 알림 전송
 */

import { createLogger } from './logger';

const logger = createLogger('Alert');

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

export interface AlertPayload {
  level: AlertLevel;
  title: string;
  message: string;
  fields?: { name: string; value: string }[];
  timestamp?: string;
}

/**
 * Webhook URL 가져오기
 */
function getWebhookUrl(): string | null {
  return process.env.ALERT_WEBHOOK_URL || null;
}

/**
 * 알림 레벨별 색상 (Slack/Discord 호환)
 */
function getLevelColor(level: AlertLevel): string {
  switch (level) {
    case 'info':
      return '#36a64f'; // green
    case 'warning':
      return '#ffcc00'; // yellow
    case 'error':
      return '#ff6600'; // orange
    case 'critical':
      return '#ff0000'; // red
    default:
      return '#808080'; // gray
  }
}

/**
 * 알림 전송
 */
export async function sendAlert(payload: AlertPayload): Promise<boolean> {
  const webhookUrl = getWebhookUrl();

  if (!webhookUrl) {
    logger.debug('No webhook URL configured, skipping alert');
    return false;
  }

  const timestamp = payload.timestamp || new Date().toISOString();

  // Slack 형식 페이로드
  const slackPayload = {
    text: `[${payload.level.toUpperCase()}] ${payload.title}`,
    attachments: [
      {
        color: getLevelColor(payload.level),
        title: payload.title,
        text: payload.message,
        fields: payload.fields?.map((f) => ({
          title: f.name,
          value: f.value,
          short: true,
        })),
        footer: '팬레터 봇',
        ts: Math.floor(new Date(timestamp).getTime() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      logger.error('Failed to send alert', new Error(`HTTP ${response.status}`));
      return false;
    }

    logger.info('Alert sent successfully', { title: payload.title, level: payload.level });
    return true;
  } catch (error) {
    logger.error('Failed to send alert', error);
    return false;
  }
}

/**
 * 에러 알림 (편의 함수)
 */
export async function alertError(
  title: string,
  error: Error | string,
  additionalFields?: { name: string; value: string }[]
): Promise<boolean> {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  return sendAlert({
    level: 'error',
    title,
    message: errorMessage,
    fields: [
      ...(additionalFields || []),
      ...(errorStack ? [{ name: 'Stack', value: errorStack.slice(0, 500) }] : []),
    ],
  });
}

/**
 * 답장 발송 실패 알림
 */
export async function alertSendFailure(
  letterId: number,
  error: Error | string
): Promise<boolean> {
  return alertError('답장 발송 실패', error, [{ name: 'Letter ID', value: String(letterId) }]);
}

/**
 * Gmail 연결 실패 알림
 */
export async function alertGmailFailure(error: Error | string): Promise<boolean> {
  return alertError('Gmail 연결 실패', error);
}

/**
 * LLM API 오류 알림
 */
export async function alertLLMFailure(
  task: 'classify' | 'reply',
  error: Error | string
): Promise<boolean> {
  return alertError(`LLM API 오류 (${task})`, error);
}

/**
 * 일일 리포트 알림
 */
export async function sendDailyReport(stats: {
  fetchedCount: number;
  fanLetterCount: number;
  archivedCount: number;
  replyGeneratedCount: number;
  scheduledCount: number;
  errorCount: number;
}): Promise<boolean> {
  return sendAlert({
    level: 'info',
    title: '일일 처리 리포트',
    message: '오늘의 이메일 처리 통계입니다.',
    fields: [
      { name: '수신 메일', value: String(stats.fetchedCount) },
      { name: '팬레터', value: String(stats.fanLetterCount) },
      { name: '아카이브', value: String(stats.archivedCount) },
      { name: '답장 생성', value: String(stats.replyGeneratedCount) },
      { name: '발송 예약', value: String(stats.scheduledCount) },
      { name: '오류', value: String(stats.errorCount) },
    ],
  });
}
