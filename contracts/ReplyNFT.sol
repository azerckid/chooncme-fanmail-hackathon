// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReplyNFT
 * @notice 춘심이 팬레터 답장을 ERC-721 NFT로 Base에 영구 기록
 * @dev mintTo는 onlyOwner — 배포 전 AgentKit 지갑 주소를 owner로 설정 필요
 *
 * 배포 방법 (Remix IDE):
 * 1. https://remix.ethereum.org 접속
 * 2. 이 파일 붙여넣기
 * 3. Compiler: 0.8.20, Optimization ON
 * 4. MetaMask를 Base Sepolia로 전환
 * 5. Deploy — AgentKit 지갑 주소로 배포 (onlyOwner 충돌 방지)
 */
contract ReplyNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    event ReplyNFTMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string tokenURI
    );

    constructor() ERC721("Chooncme Reply", "CPLY") Ownable(msg.sender) {}

    /**
     * @notice 팬레터 답장 NFT 민팅
     * @param recipient NFT 수령 주소 (에이전트 지갑)
     * @param tokenURI  메타데이터 URI (data:application/json;base64,...)
     * @return tokenId  발행된 토큰 ID
     */
    function mintTo(address recipient, string memory tokenURI)
        external
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit ReplyNFTMinted(tokenId, recipient, tokenURI);
        return tokenId;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
