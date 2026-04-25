export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('@/lib/scheduler/cron');
    // 30초마다 이메일 수집 및 처리
    startScheduler('*/5 * * * * *', { verbose: true });
  }
}
