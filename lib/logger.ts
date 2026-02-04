/**
 * 로깅 유틸리티
 * 일관된 로그 포맷 및 레벨 지원
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * 현재 로그 레벨 (환경변수에서 읽음)
 */
function getCurrentLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
  return LOG_LEVELS[level] !== undefined ? level : 'info';
}

/**
 * 로그 출력 여부 확인
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getCurrentLevel()];
}

/**
 * 타임스탬프 포맷
 */
function timestamp(): string {
  return new Date().toISOString();
}

/**
 * 로그 메시지 포맷
 */
function formatMessage(level: LogLevel, module: string, message: string, data?: unknown): string {
  const prefix = `[${timestamp()}] [${level.toUpperCase()}] [${module}]`;
  if (data !== undefined) {
    return `${prefix} ${message} ${JSON.stringify(data)}`;
  }
  return `${prefix} ${message}`;
}

/**
 * 로거 인스턴스 생성
 */
export function createLogger(module: string) {
  return {
    debug: (message: string, data?: unknown) => {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', module, message, data));
      }
    },

    info: (message: string, data?: unknown) => {
      if (shouldLog('info')) {
        console.info(formatMessage('info', module, message, data));
      }
    },

    warn: (message: string, data?: unknown) => {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', module, message, data));
      }
    },

    error: (message: string, error?: unknown, data?: unknown) => {
      if (shouldLog('error')) {
        const errorInfo =
          error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : error;
        console.error(formatMessage('error', module, message, { error: errorInfo, ...((data as object) || {}) }));
      }
    },
  };
}

/**
 * 기본 로거 (모듈명 없음)
 */
export const logger = createLogger('App');
