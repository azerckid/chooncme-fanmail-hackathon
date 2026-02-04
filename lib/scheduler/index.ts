/**
 * 스케줄러 모듈 진입점
 */

// 답장 생성
export {
  generateReply,
  generateReplyFromEmail,
  generateReplies,
  type GenerateReplyInput,
  type GenerateReplyResult,
  type GeneratedReply,
} from './reply-generator';

// 지연 발송
export {
  calculateRandomDelay,
  getDelayConfig,
  isDryRunMode,
  sendReplyImmediately,
  scheduleDelayedSend,
  scheduleMultipleDelayedSends,
  type DelayedSendOptions,
  type SendRequest,
  type SendResult,
} from './delayed-send';
