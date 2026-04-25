/**
 * 이메일 처리 파이프라인
 * 메일 수집 → 분류 → 아카이브 → 답장 생성 → 지연 발송
 */

import { db } from '@/db';
import { fanLetters, replies } from '@/db/schema';
import {
  createGmailClientFromEnv,
  fetchRecentEmails,
  partitionEmails,
  archiveEmail,
  getLetterIdByEmailId,
  type EmailMessage,
} from '@/lib/email';
import {
  generateReplyFromEmail,
  scheduleDelayedSend,
  isDryRunMode,
} from './index';
import { mintReplyNFT } from '@/lib/blockchain/nft';
import { getFanProfile, type FanTier } from '@/lib/blockchain/nansen';
import { extractWalletAddress } from '@/lib/email/parse-wallet';
import { processWithGame, isGameEnabled } from '@/lib/agents/orchestrator';
import { eq } from 'drizzle-orm';

/**
 * 처리 결과 통계
 */
export interface ProcessResult {
  /** 수집된 메일 수 */
  fetchedCount: number;
  /** 팬레터로 분류된 수 */
  fanLetterCount: number;
  /** 일반 메일 수 */
  generalCount: number;
  /** 새로 아카이브된 수 */
  archivedCount: number;
  /** 이미 아카이브된 수 (중복) */
  duplicateCount: number;
  /** 답장 생성된 수 */
  replyGeneratedCount: number;
  /** 발송 예약된 수 */
  scheduledCount: number;
  /** 오류 발생 수 */
  errorCount: number;
  /** 처리 시작 시간 */
  startedAt: string;
  /** 처리 종료 시간 */
  finishedAt: string;
  /** 소요 시간 (ms) */
  durationMs: number;
}

/** 환경변수 EMAIL_HOURS_AGO 미설정 시 기본 수집 구간 (시간) */
const DEFAULT_HOURS_AGO = 3;

/**
 * 처리 옵션
 */
export interface ProcessOptions {
  /** 조회할 시간 범위 (시간). 기본값: 환경변수 EMAIL_HOURS_AGO 또는 3 */
  hoursAgo?: number;
  /** 최대 처리할 메일 수, 기본 50 */
  maxEmails?: number;
  /** 분류 요청 간 지연 (ms), 기본 500 */
  classifyDelayMs?: number;
  /** 답장 생성 요청 간 지연 (ms), 기본 1000 */
  replyDelayMs?: number;
  /** 처리 중 로그 출력 */
  verbose?: boolean;
}

/**
 * 이메일 처리 메인 함수
 * 1시간마다 호출되어 신규 메일을 처리
 */
export async function processEmails(options: ProcessOptions = {}): Promise<ProcessResult> {
  const envHours = process.env.EMAIL_HOURS_AGO ? parseInt(process.env.EMAIL_HOURS_AGO, 10) : undefined;
  const defaultHours = Number.isFinite(envHours) && envHours! > 0 ? envHours! : DEFAULT_HOURS_AGO;

  const {
    hoursAgo = defaultHours,
    maxEmails = 50,
    classifyDelayMs = 500,
    replyDelayMs = 1000,
    verbose = true,
  } = options;

  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  const result: ProcessResult = {
    fetchedCount: 0,
    fanLetterCount: 0,
    generalCount: 0,
    archivedCount: 0,
    duplicateCount: 0,
    replyGeneratedCount: 0,
    scheduledCount: 0,
    errorCount: 0,
    startedAt,
    finishedAt: '',
    durationMs: 0,
  };

  const log = (message: string) => {
    if (verbose) console.log(`[ProcessEmails] ${message}`);
  };

  try {
    // 1. Gmail 클라이언트 생성 및 메일 수집
    log(`Starting email processing (last ${hoursAgo} hour(s), max ${maxEmails} emails)`);
    const gmail = createGmailClientFromEnv();
    const { emails } = await fetchRecentEmails(gmail, hoursAgo, maxEmails);
    result.fetchedCount = emails.length;
    log(`Fetched ${emails.length} emails`);

    if (emails.length === 0) {
      log('No new emails to process');
      result.finishedAt = new Date().toISOString();
      result.durationMs = Date.now() - startTime;
      return result;
    }

    // 2. 팬레터/일반 메일 분류
    log('Classifying emails...');
    const { fanLetters, generalEmails } = await partitionEmails(emails, {
      delayMs: classifyDelayMs,
      onClassified: (email, classification) => {
        log(`  ${email.subject?.slice(0, 30)}... → ${classification.classification} (${classification.confidence.toFixed(2)})${classification.reason ? ` | ${classification.reason}` : ''}`);
      },
    });
    result.fanLetterCount = fanLetters.length;
    result.generalCount = generalEmails.length;
    log(`Classified: ${fanLetters.length} fan letters, ${generalEmails.length} general`);
    // 일반 메일(generalEmails)은 DB에 저장하지 않음. 팬레터만 아카이브 대상.

    if (fanLetters.length === 0) {
      log('No fan letters to process');
      result.finishedAt = new Date().toISOString();
      result.durationMs = Date.now() - startTime;
      return result;
    }

    // 3. 팬레터 아카이브 및 답장 처리
    for (const email of fanLetters) {
      try {
        await processFanLetter(email, result, log, replyDelayMs);
      } catch (error) {
        result.errorCount++;
        console.error(`[ProcessEmails] Error processing email ${email.id}:`, error);
      }
    }

    log(`Processing complete: ${result.archivedCount} archived, ${result.scheduledCount} scheduled`);
  } catch (error) {
    result.errorCount++;
    console.error('[ProcessEmails] Fatal error:', error);
  }

  result.finishedAt = new Date().toISOString();
  result.durationMs = Date.now() - startTime;

  return result;
}

/**
 * 단일 팬레터 처리 (아카이브 → 답장 생성 → 발송 예약)
 */
async function processFanLetter(
  email: EmailMessage,
  result: ProcessResult,
  log: (msg: string) => void,
  replyDelayMs: number
): Promise<void> {
  // 3-1. 아카이브
  const archiveResult = await archiveEmail({ email });

  let letterId: number | undefined;

  if (archiveResult.success) {
    result.archivedCount++;
    letterId = archiveResult.letterId;
    log(`  Archived: ${email.subject?.slice(0, 30)}... (letterId=${letterId})`);
  } else if (archiveResult.error?.code === 'DUPLICATE') {
    result.duplicateCount++;
    // 중복이지만 letterId는 있음 → 답장 안 했으면 답장 진행
    letterId = archiveResult.letterId ?? (await getLetterIdByEmailId(email.id)) ?? undefined;
    log(`  Duplicate: ${email.subject?.slice(0, 30)}... (letterId=${letterId})`);
  } else {
    result.errorCount++;
    log(`  Archive failed: ${archiveResult.error?.message}`);
    return;
  }

  if (!letterId) {
    result.errorCount++;
    log(`  No letterId available for ${email.id}`);
    return;
  }

  // 이미 답장한 letter면 답장 생성·예약 생략 (중복 수집 시 지연 발송 실패 방지)
  const letter = await db.query.fanLetters.findFirst({
    where: eq(fanLetters.id, letterId),
    columns: { isReplied: true },
  });
  if (letter?.isReplied) {
    log(`  Skip reply (already replied): letterId=${letterId}`);
    return;
  }

  // 3-2. 지갑 주소 파싱 + 온체인 팬 프로파일 조회
  let fanTier: FanTier | undefined;
  const walletAddress = extractWalletAddress(email.bodyPlain ?? '');
  if (walletAddress) {
    log(`  Wallet found: ${walletAddress}`);
    try {
      const profile = await getFanProfile(walletAddress);
      fanTier = profile.tier;
      log(`  Fan tier: ${fanTier} (hasSentToAgent=${profile.hasSentToAgent})`);
      await db.update(fanLetters)
        .set({ walletAddress, fanTier })
        .where(eq(fanLetters.id, letterId));
    } catch (err) {
      console.error('[ProcessEmails] Nansen lookup failed (continuing):', err);
    }
  }

  // 3-3. 답장 생성 (GAME Orchestrator 우선, 폴백 시 기존 파이프라인)
  if (replyDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, replyDelayMs));
  }

  let replySubject = '';
  let replyBody = '';

  // GAME Orchestrator 사용 시도
  const gameResult = isGameEnabled() ? await processWithGame(email) : null;

  if (gameResult?.replyBody) {
    replySubject = gameResult.replySubject ?? `Re: ${email.subject}`;
    replyBody = gameResult.replyBody;
    result.replyGeneratedCount++;
    log(`  [GAME] Reply generated: ${replySubject.slice(0, 30)}...`);

    // GAME이 claimUrl 반환 시 이메일에 삽입
    if (gameResult.claimUrl) {
      replyBody += buildNftSection(replyBody, gameResult.claimUrl);
    }
  } else {
    // 기존 파이프라인 폴백
    const replyResult = await generateReplyFromEmail(email, fanTier);

    if (!replyResult.success || !replyResult.reply) {
      result.errorCount++;
      log(`  Reply generation failed: ${replyResult.error}`);
      return;
    }

    replySubject = replyResult.reply.subject;
    replyBody = replyResult.reply.body;
    result.replyGeneratedCount++;
    log(`  Reply generated: ${replySubject.slice(0, 30)}...`);

    // 3-3. NFT 민팅 (NFT_CONTRACT_ADDRESS 설정 시)
    if (process.env.NFT_CONTRACT_ADDRESS) {
      try {
        const mintResult = await mintReplyNFT({
          replyContent: replyBody,
          receivedAt: new Date().toISOString(),
          fanTier,
        });
        log(`  NFT minted: tier=${mintResult.tier}, claimUrl=${mintResult.claimUrl}`);
        replyBody += buildNftSection(replyBody, mintResult.claimUrl);

        // NFT 결과를 replies 테이블에 저장
        await db.update(replies)
          .set({
            nftTokenId: mintResult.tokenId,
            nftTxHash: mintResult.txHash,
            nftClaimUrl: mintResult.claimUrl,
            nftTier: mintResult.tier,
          })
          .where(eq(replies.letterId, letterId));
      } catch (nftError) {
        console.error('[ProcessEmails] NFT mint failed (continuing without NFT):', nftError);
      }
    }
  }

  // 3-4. 지연 발송 예약
  const dryRun = isDryRunMode();
  scheduleDelayedSend({
    letterId,
    to: email.fromEmail,
    subject: replySubject,
    body: replyBody,
  });

  result.scheduledCount++;
  log(`  Scheduled${dryRun ? ' (dry-run)' : ''}: to=${email.fromEmail}`);
}

/**
 * 이메일 본문에 삽입할 NFT 클레임 섹션 (언어 자동 감지)
 */
function buildNftSection(body: string, claimUrl: string): string {
  const isJapanese = /[\u3040-\u309F\u30A0-\u30FF]/.test(body);
  const isKorean = /[\uAC00-\uD7A3]/.test(body);

  if (isJapanese) {
    return `\n\n---\nこの返信はBaseブロックチェーンに永久記録されました。\n確認はこちら: ${claimUrl}`;
  }
  if (isKorean) {
    return `\n\n---\n이 답장은 Base 블록체인에 영구 기록되었습니다.\n확인하기: ${claimUrl}`;
  }
  return `\n\n---\nThis reply has been permanently recorded on Base blockchain.\nView it here: ${claimUrl}`;
}

/**
 * 처리 결과 요약 문자열 생성
 */
export function formatProcessResult(result: ProcessResult): string {
  return [
    `=== Email Processing Summary ===`,
    `Started: ${result.startedAt}`,
    `Finished: ${result.finishedAt}`,
    `Duration: ${result.durationMs}ms`,
    ``,
    `Fetched: ${result.fetchedCount}`,
    `Fan Letters: ${result.fanLetterCount}`,
    `General: ${result.generalCount}`,
    ``,
    `Archived: ${result.archivedCount}`,
    `Duplicates: ${result.duplicateCount}`,
    `Replies Generated: ${result.replyGeneratedCount}`,
    `Scheduled: ${result.scheduledCount}`,
    `Errors: ${result.errorCount}`,
    `================================`,
  ].join('\n');
}
