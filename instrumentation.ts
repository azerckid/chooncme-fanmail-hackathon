export async function register() {
  // 로컬 개발 환경에서만 자동 스케줄러 실행
  // Vercel 서버리스에서는 AgentKit ESM 호환 문제로 비활성화
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'development') {
    const { startScheduler } = await import('@/lib/scheduler/cron');
    startScheduler('*/5 * * * * *', { verbose: true });
  }
}
