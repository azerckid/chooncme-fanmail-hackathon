import { sendMail } from "../lib/mail";
import dotenv from "dotenv";
import path from "path";

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function test() {
    console.log("시작: 메일 발송 테스트...");
    console.log("사용 이메일:", process.env.GMAIL_USER);

    try {
        await sendMail({
            to: process.env.GMAIL_USER || "", // 자기 자신에게 발송
            subject: "춘심이 팬레터 시스템 - 메일 연동 테스트",
            body: "안녕하세요! 이 메일은 춘심이 팬레터 아카이브 시스템의 OAuth2 연동 테스트 메일입니다.\n이 메일을 받으셨다면 모든 설정이 성공적으로 완료된 것입니다!",
        });
        console.log("성공: 메일이 정상적으로 발송되었습니다. 편지함을 확인해 주세요!");
    } catch (error) {
        console.error("실패: 메일 발송 중 오류가 발생했습니다.");
        console.error(error);
    }
}

test();
