/**
 * POST /api/demo/trigger
 * 해커톤 데모 전용 — 이메일 처리를 즉시 트리거
 * DEMO_MODE=true 일 때만 활성화
 *
 * 인증: CRON_SECRET 헤더 재사용
 */

import { NextRequest, NextResponse } from 'next/server';
import { processEmails, formatProcessResult } from '@/lib/scheduler';

export async function POST(req: NextRequest) {
  // DEMO_MODE가 아니면 거부
  if (process.env.DEMO_MODE !== 'true') {
    return NextResponse.json(
      { success: false, error: 'Demo trigger is only available in DEMO_MODE' },
      { status: 403 }
    );
  }

  // CRON_SECRET 인증
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.replace('Bearer ', '') !== cronSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  console.log('[DemoTrigger] Manual trigger activated');

  const result = await processEmails({
    hoursAgo: 24,
    maxEmails: 10,
    verbose: true,
  });

  return NextResponse.json({
    success: true,
    data: {
      ...result,
      summary: formatProcessResult(result),
    },
  });
}
