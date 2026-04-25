const WALLET_REGEX = /0x[a-fA-F0-9]{40}/g;

/**
 * 이메일 본문에서 첫 번째 Ethereum 지갑 주소(0x + 40 hex) 추출
 * 없으면 null 반환
 */
export function extractWalletAddress(body: string): string | null {
  const matches = body.match(WALLET_REGEX);
  return matches?.[0] ?? null;
}
