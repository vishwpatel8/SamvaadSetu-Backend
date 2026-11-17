import "dotenv/config";
import nodemailer from "nodemailer";

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

const requiredEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) { throw new Error(`${key} is missing`); }
    return value;
};

const transporter = nodemailer.createTransport({
    host: requiredEnv("SMTP_HOST"),
    port: Number(requiredEnv("SMTP_PORT")),
    secure: false,
    auth: {
        user: requiredEnv("EMAIL_USER"),
        pass: requiredEnv("EMAIL_PASS"),
    },
});

const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
    });
};

export default sendEmail;