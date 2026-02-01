/**
 * 메일 발송 유틸. Gmail SMTP 또는 OAuth2 사용.
 * 환경변수: GMAIL_USER, GMAIL_APP_PASSWORD (App Password) 또는
 * GMAIL_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN (OAuth2)
 */

import nodemailer from "nodemailer";

export type SendMailOptions = {
    to: string;
    subject: string;
    body: string;
};

function getTransporter() {
    const user = process.env.GMAIL_USER;
    const appPassword = process.env.GMAIL_APP_PASSWORD;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!user) {
        throw new Error("GMAIL_USER is not set. Email sending is not configured.");
    }

    if (appPassword) {
        return nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass: appPassword },
        });
    }

    if (clientId && clientSecret && refreshToken) {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user,
                clientId,
                clientSecret,
                refreshToken,
            },
        });
    }

    throw new Error(
        "Set GMAIL_APP_PASSWORD or (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN). Email sending is not configured."
    );
}

export async function sendMail({ to, subject, body }: SendMailOptions): Promise<void> {
    const transporter = getTransporter();
    await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to,
        subject,
        text: body,
        html: body.replace(/\n/g, "<br>"),
    });
}
