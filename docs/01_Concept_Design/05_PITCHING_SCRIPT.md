# 해커톤 피칭 스크립트

- Created: 2026-04-25
- Updated: 2026-04-25
- 발표 시간: 5분 기준
- 대상: Base Agent Hackathon #1 심사위원

## 관련 문서

- [피칭 전략](./03_HACKATHON_PITCHING_STRATEGY.md)
- [데모 시나리오](./04_HACKATHON_DEMO_SCRIPT.md)
- [피치덱](../../public/pitch/index.html)

---

## 전체 흐름 요약

| 슬라이드 | 시간 | 핵심 메시지 |
|---------|------|-----------|
| 1. Hook | 30초 | 문제 제시 |
| 2. Traction | 30초 | 실제 작동 중인 제품 |
| 3. Solution | 60초 | 에이전트 파이프라인 |
| 4. VIP Fan | 45초 | Agentic Commerce |
| 5. Architecture | 45초 | 기술 연결 구조 |
| 6. Why Base & Flock.io | 30초 | 기술 선택 근거 |
| 7. Live Demo | 45초 | 실시간 시연 |
| 8. Business Model | 30초 | 수익 구조 |
| 9. Closing | 15초 | 확장 비전 |

---

## 슬라이드별 스크립트

---

### SLIDE 1 — Hook (30초)

> **"팬이라면 누구나 알고 있습니다.**
> 좋아하는 크리에이터에게 편지를 보내지만, 답장을 받는 사람은 없습니다.
>
> 33,000명의 팬덤, 단 한 명의 크리에이터.
> 물리적으로 불가능한 문제입니다.
>
> 저희는 AI 에이전트가 이 문제를 Base 위에서 해결하도록 만들었습니다.
>
> **지금 바로 참여해보세요. 발표가 진행되는 동안 답장이 도착할 것입니다.**
> **이메일 주소: `choon.cme@gmail.com`**
>
> (심사위원과 청중들이 메일을 보낼 수 있도록 잠시 대기)"
>
> **"Every fan knows this.**
> We send letters to our favorite creators, but no one gets a reply.
>
> 33,000 fans, and only one creator.
> It is impossible for one person to reply to everyone.
>
> We built an AI agent on Base to solve this problem.
>
> **Try it right now. You will get a reply during this talk.**
> **Email: `choon.cme@gmail.com`**
>
> (Wait for a moment for people to send emails)"

**[다음 슬라이드로]**

---

### SLIDE 2 — Traction (30초)

> **"이것은 가설이 아닙니다.**
>
> 기존에는 Gemini LLM과 LangGraph를 사용하여 팬레터를 자동화해왔습니다.
> 하지만 단순한 '자동화'를 넘어, 에이전트가 스스로 자산을 운용하고 영구적인 가치를 팬에게 전달하기 위한 해답을 이번 해커톤에서 찾았습니다.
>
> 실제 크리에이터 춘심이의 계정, 실제 33,000명의 팬덤.
> 이미 트래픽이 검증된 제품이 Flock.io와 Base를 만나 '완전 자율 에이전트'로 진화한 것입니다."
>
> **"This is not just an idea.**
>
> Before, we used Gemini and LangGraph to automate fan letters.
> But it was just a simple tool. Through this hackathon, we found a better way using Flock.io and Base.
>
> Choon-shim is a real creator with 33,000 fans.
> We are evolving a working product into a 'Fully Autonomous Agent'."

**[다음 슬라이드로]**

---

### SLIDE 3 — Solution (60초)

> **"에이전트가 스스로 판단하고 행동합니다.**
>
> 팬레터가 오면, Flock.io LLM이 춘심이 페르소나로 감정을 분석하고 답장을 생성합니다.
> 동시에 AgentKit이 에이전트 전용 지갑으로 답장을 ERC-721 NFT로 Base에 영구 기록합니다.
>
> 이 전체 파이프라인을 Virtuals GAME이 세 개의 Worker로 조율합니다.
> ClassifierWorker, ReplyWorker, NFTWorker가 각각 독립적으로 추론하고 실행합니다.
>
> 팬의 감정에 따라 NFT 티어도 달라집니다.
> 사랑과 응원을 담은 편지는 Golden Reply NFT,
> 그리움과 슬픔이 담긴 편지는 Comfort NFT,
> 그 외는 Standard NFT로 Base에 기록됩니다."
>
> **"The agent thinks and acts by itself.**
>
> When a fan mail arrives, the Flock.io LLM analyzes emotions and writes a reply.
> At the same time, AgentKit mints an NFT on Base to record the reply forever.
>
> Virtuals GAME manages this whole process with three workers.
> They classify the mail, write the reply, and mint the NFT independently.
>
> We also have different NFT levels based on fan emotions:
> Golden for love, Comfort for sadness, and Standard for others."

**[다음 슬라이드로]**

---

### SLIDE 4 — VIP Fan Agentic Commerce (45초)

> **"여기서 한 단계 더 나아갑니다.**
>
> 팬이 메일에 지갑 주소를 포함하면, 에이전트가 Nansen API로 그 지갑의 이력을 조회합니다.
> 과거에 에이전트 지갑으로 후원을 보낸 팬이라면, 자동으로 VIP로 식별됩니다.
>
> VIP 팬은 훨씬 길고 감동적인 특별 답장과 한정판 Golden NFT를 받습니다.
>
> 온체인 기여가 오프체인 경험의 품질을 결정하는 것.
> 이것이 완전한 Agentic Commerce 루프입니다."
>
> **"We go one step further.**
>
> If a fan shares a wallet address, the agent checks their history using Nansen API.
> If they supported the agent before, they are identified as a VIP.
>
> VIP fans receive a longer, more heart-felt reply and a special Golden NFT.
>
> On-chain contribution improves the off-chain experience.
> This is a complete Agentic Commerce loop."

**[다음 슬라이드로]**

---

### SLIDE 5 — Architecture (45초)

> **"지금 보시는 것이 전체 아키텍처입니다.**
>
> 왼쪽에서 팬 이메일이 들어오면, 가운데 GAME Orchestrator가 세 Worker를 순서대로 실행합니다.
> 오른쪽 External 영역에서 Flock.io가 추론하고, Nansen이 VIP 여부를 판단하고,
> Base Sepolia에 NFT가 기록되고, x402로 LLM 비용이 자율 결제됩니다.
>
> 사람의 개입은 없습니다.
> 에이전트가 처음부터 끝까지 자율적으로 실행합니다."
>
> **"This is our system architecture.**
>
> When a fan email comes in, the Orchestrator runs three workers.
> Flock.io writes the text, Nansen checks the VIP status, and the NFT is recorded on Base.
> Also, LLM costs are paid automatically using x402.
>
> No humans are needed.
> The agent handles everything from start to finish."

**[다음 슬라이드로]**

---

### SLIDE 6 — Why Base & Flock.io (30초)

> **"왜 Flock.io인가.**
> 기존 Gemini 기반 시스템에서는 불가능했던 '에이전트 자율 결제'가 x402를 통해 가능해졌기 때문입니다.
> Web3 네이티브 LLM으로서 에이전트 경제 생태계에 가장 완벽하게 부합합니다.
>
> 왜 Base인가.
> AgentKit이 Base 위에서 가장 매끄럽게 작동하고,
> 팬들에게 전달할 영구적인 기록(NFT) 비용이 매우 저렴하여 대규모 서비스가 가능하기 때문입니다.
>
> *(Technical Note)*
> 더 고도화된 기능들을 준비했으나, 일부 라이브러리의 ETH Sepolia 미지원으로 이번 데모에 모두 담지 못한 점은 아쉬움으로 남습니다. 하지만 인프라가 준비되는 대로 즉시 확장할 계획입니다.
>
> **"Why Flock.io?**
> With Gemini, we couldn't have 'Agent Auto-Payments.' But with Flock.io and x402, it is possible.
> It is the perfect LLM for the agent economy.
>
> Why Base?
> AgentKit works best on Base.
> Also, recording fans' memories (NFTs) is very cheap, so we can support many fans.
>
> *(Technical Note)*
> We had more advanced features ready, but some were not possible because ETH Sepolia was not supported yet. We are ready to scale these as soon as the infrastructure is ready."

**[다음 슬라이드로]**

---

### SLIDE 7 — Live Demo (45초)

> **"이제 여러분의 수신함을 확인해 볼 시간입니다.**"
>
> *(데모 화면 전환)*
>
> > "발표 초반에 여러분이 보내주신 팬메일들이 실시간으로 처리되었습니다.
> > 대시보드를 보시면 수신, 감정 분류, 답장 생성, NFT 민팅이 완료된 것을 확인하실 수 있습니다.
> >
> > 여러분의 이메일로 답장이 도착했을 것입니다. 하단의 링크를 클릭하면,
> > 방금 발행된 NFT 트랜잭션을 Base Sepolia Explorer에서 직접 확인하실 수 있습니다."
> >
> > **"Now, it's time to check your inbox.**"
> >
> > *(Switch to Demo screen)*
> >
> > > "The fan mails you sent at the beginning have been processed in real-time.
> > > On the dashboard, you can see the classification, reply generation, and NFT minting are all done.
> > >
> > > You should have a reply in your email now. Click the link inside,
> > > and you can see your NFT transaction on the Base explorer."

**[다음 슬라이드로]**

---

### SLIDE 8 — Business Model (30초)

> **"수익 구조는 명확합니다.**
> **"Our business model is simple.**"
>
> 크리에이터가 구독료를 플랫폼에 지불하면,
> 플랫폼이 에이전트 지갑에 USDC를 충전합니다.
> 에이전트는 팬레터가 올 때마다 Flock.io 추론 비용을 x402로 자율 결제합니다.
>
> 크리에이터는 돈을 내고, 에이전트가 알아서 운용합니다.
> 크리에이터의 시간은 0입니다."
>
> > Creators pay a subscription fee to the platform.
> > The platform adds USDC to the agent's wallet.
> > The agent pays for its own LLM costs using x402.
> >
> > Creators pay money, and the agent handles everything.
> > Creators save all of their time."

**[다음 슬라이드로]**

---

### SLIDE 9 — Closing (15초)

> **"춘심이는 첫 번째 인스턴스입니다.**
>
> 다음은 당신이 좋아하는 크리에이터입니다.
> 페르소나 JSON 하나를 바꾸면 새로운 에이전트가 Base 위에 올라갑니다.
>
> 감사합니다."
>
> > **"Choon-shim is just the first instance.**
> >
> > Next can be your favorite creator.
> > Just by changing one JSON file, a new agent is born on Base.
> >
> > Thank you."

---

## 예상 Q&A

**Q. AgentKit이 구체적으로 무엇을 하는가?**
> AgentKit은 에이전트 전용 지갑을 관리합니다. NFT 민팅 시 트랜잭션 서명과 실행을 담당하고, x402 결제 시 USDC 자동 송금을 처리합니다. 지금 Blockscout에서 해당 지갑 주소로 트랜잭션을 직접 확인하실 수 있습니다.
>
> **Q. What does AgentKit do?**
> AgentKit manages the agent's wallet. It signs transactions for NFT minting and handles USDC payments via x402. You can see the transactions on Blockscout right now.

**Q. Flock.io를 왜 Gemini 대신 사용했는가?**
> Flock.io는 Web3 에이전트 생태계에 특화된 LLM입니다. 온체인 컨텍스트를 이해하고 x402 결제가 내재화되어 있어 에이전트 자율 결제 구조와 자연스럽게 결합됩니다. Gemini는 폴백으로 유지하고 있습니다.
>
> **Q. Why Flock.io instead of Gemini?**
> Flock.io is a Web3 LLM. It understands on-chain data and works with x402 payments perfectly. We keep Gemini as a backup.

**Q. x402는 어떻게 사용했습니까?**
> 에이전트가 Flock.io에 LLM 추론을 요청할 때 x402 프로토콜로 USDC를 자율 결제합니다. 사람이 결제 버튼을 누르지 않아도 에이전트가 스스로 운영 비용을 집행하는 구조입니다.
>
> **Q. How did you use x402?**
> The agent pays USDC automatically using x402 when it asks Flock.io for a reply. The agent handles its own costs without human help.

**Q. Nansen API가 작동하지 않으면?**
> Base 퍼블릭 RPC로 직접 조회하는 폴백이 구현되어 있습니다. Nansen이 없어도 에이전트 지갑 수신 이력을 온체인에서 직접 확인하여 VIP 판별이 가능합니다.
>
> **Q. What if Nansen API fails?**
> We have a backup system that checks the blockchain directly. We can still identify VIPs by looking at the agent's wallet history on-chain.

**Q. 다른 크리에이터는 어떻게 사용하는가?**
> `config/persona.json` 파일 하나를 교체하면 됩니다. 이름, 나이, 성격, 경계선을 정의한 JSON을 바꾸면 즉시 새로운 페르소나로 에이전트가 작동합니다. 지금 `config/persona-example.json`에 예시가 있습니다.
>
> **Q. How can other creators use this?**
> They just need to change the `persona.json` file. By updating the JSON with a new name and personality, the agent starts working as a new character immediately.

**Q. 실제 서비스에서 Web2 팬이 지갑 주소를 어떻게 제공하는가?**
> 현재는 이메일 본문에 직접 입력하는 방식이지만, 실제 서비스에서는 Coinbase Smart Wallet 로그인 버튼 하나로 대체됩니다. Web3 경험이 없는 팬도 소셜 로그인처럼 지갑을 연결할 수 있습니다.
>
> **Q. How do Web2 fans provide wallet addresses?**
> Right now they type it in the email. In the future, we will use a 'Login with Coinbase Wallet' button. Even fans with no Web3 experience can use it easily.

**Q. 수익 모델이 있습니까?**
> 크리에이터가 에이전트 운영 구독료를 지불하고, 플랫폼은 에이전트 지갑에 운영비를 충전합니다. 에이전트는 그 예산 안에서 비용을 자율 집행합니다. 크리에이터는 팬 관리 비용을 투명하고 효율적으로 관리할 수 있습니다.
>
> **Q. Is there a business model?**
> Creators pay a subscription fee, and the platform funds the agent's wallet. The agent then manages its own budget. It makes fan management easy and transparent for creators.

**Q. 크리에이터 외에 대량의 이메일을 처리해야 하는 다른 산업에도 적용 가능한가요?**
> 네, 매우 적합합니다. 고객 지원(CS), 물류, 인사 관리 등 대량의 이메일 분류와 후속 조치가 필요한 모든 곳에 적용할 수 있습니다. 단순 분류를 넘어 에이전트가 직접 결제나 온체인 증명을 수행할 수 있다는 점이 이 시스템의 핵심 경쟁력입니다.
>
> **Q. Can this be used for other industries with high email volume?**
> Yes, definitely. It is perfect for customer support, logistics, or any business that needs to process many emails. The main advantage is that the agent can not only classify emails but also handle payments and on-chain proofs by itself.
