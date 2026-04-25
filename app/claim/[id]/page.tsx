import Link from 'next/link';
import { createPublicClient, http, parseAbi } from 'viem';
import { baseSepolia, base } from 'viem/chains';

interface NftMeta {
  image: string | null;
  tier: string | null;
  name: string | null;
}

async function getNftMeta(tokenId: string): Promise<NftMeta> {
  const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
  if (!contractAddress || tokenId.startsWith('0x')) return { image: null, tier: null, name: null };

  try {
    const network = process.env.BASE_NETWORK ?? 'base-sepolia';
    const client = createPublicClient({
      chain: network === 'base-mainnet' ? base : baseSepolia,
      transport: http(),
    });

    const tokenURI = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: parseAbi(['function tokenURI(uint256 tokenId) view returns (string)']),
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    }) as string;

    if (tokenURI.startsWith('data:application/json;base64,')) {
      const json = JSON.parse(Buffer.from(tokenURI.split(',')[1], 'base64').toString());
      const tier = json.attributes?.find((a: { trait_type: string; value: string }) => a.trait_type === 'tier')?.value ?? null;
      let imageUrl = json.image ?? null;
      if (imageUrl && imageUrl.startsWith('ipfs://')) {
        imageUrl = imageUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      }
      return { image: imageUrl, tier, name: json.name ?? null };
    }
  } catch {
    return { image: null, tier: null, name: null };
  }
  return { image: null, tier: null, name: null };
}

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { image: nftImage, tier, name: nftName } = await getNftMeta(id);
  const network = process.env.BASE_NETWORK ?? 'base-sepolia';
  const isMainnet = network === 'base-mainnet';
  const explorerBase = isMainnet
    ? 'https://basescan.org'
    : 'https://sepolia.basescan.org';

  const contractAddress = process.env.NFT_CONTRACT_ADDRESS ?? '';
  const explorerUrl = contractAddress
    ? `${explorerBase}/nft/${contractAddress}/${id}`
    : `${explorerBase}`;

  // tokenId가 txHash 형식인지 확인 (0x로 시작)
  const isTxHash = id.startsWith('0x');
  const txUrl = isTxHash ? `${explorerBase}/tx/${id}` : explorerUrl;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0b0d',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* NFT 카드 */}
      <div
        style={{
          background: '#141518',
          border: '1px solid rgba(0,82,255,0.3)',
          borderRadius: '24px',
          padding: '48px 40px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* NFT 이미지 */}
        {nftImage ? (
          <img
            src={nftImage}
            alt="춘심이 NFT"
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '16px',
              objectFit: 'cover',
              margin: '0 auto 24px',
              display: 'block',
              border: '2px solid rgba(0,82,255,0.3)',
            }}
          />
        ) : (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#0052ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '28px',
            }}
          >
            ✦
          </div>
        )}

        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '8px',
            letterSpacing: '-0.5px',
          }}
        >
          {nftName ?? '춘심이의 답장'}
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: '#5b616e',
            marginBottom: '32px',
          }}
        >
          이 답장은 Base 블록체인에 영구 기록되었습니다
        </p>

        {/* NFT 정보 */}
        <div
          style={{
            background: '#0a0b0d',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#5b616e' }}>Token ID</span>
            <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>
              {isTxHash ? `Tx: ${id.slice(0, 10)}...` : `#${id}`}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#5b616e' }}>Network</span>
            <span style={{ fontSize: '13px', color: '#0052ff', fontWeight: 600 }}>
              {isMainnet ? 'Base Mainnet' : 'Base Sepolia'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#5b616e' }}>Collection</span>
            <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>Chooncme Reply (CPLY)</span>
          </div>
          {tier && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#5b616e' }}>Tier</span>
              <span style={{
                fontSize: '13px',
                fontWeight: 700,
                color: tier === 'golden' ? '#FFD700' : tier === 'comfort' ? '#a78bfa' : '#94a3b8',
              }}>
                {tier === 'golden' ? 'Golden' : tier === 'comfort' ? 'Comfort' : 'Standard'}
              </span>
            </div>
          )}
        </div>

        {/* Explorer 버튼 */}
        <a
          href={isTxHash ? txUrl : explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            background: '#0052ff',
            color: '#fff',
            borderRadius: '100px',
            padding: '14px 24px',
            fontSize: '15px',
            fontWeight: 600,
            textDecoration: 'none',
            marginBottom: '12px',
            transition: 'background 0.2s',
          }}
        >
          Base Explorer에서 확인
        </a>

        <p style={{ fontSize: '12px', color: '#5b616e', marginTop: '24px' }}>
          Powered by Coinbase AgentKit · Base Blockchain
        </p>
      </div>

      {/* 하단 링크 */}
      <Link
        href="/"
        style={{
          marginTop: '32px',
          fontSize: '14px',
          color: '#5b616e',
          textDecoration: 'none',
        }}
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}
