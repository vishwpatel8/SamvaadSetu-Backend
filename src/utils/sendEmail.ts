import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

interface ISendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({
  to,
  subject,
  html,
}: ISendEmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

export default sendEmail;
// "username": "Abcd",
// "email": "abcd@gmail.com",
// "password": "Abcd@123"
