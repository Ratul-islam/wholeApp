import nodemailer from 'nodemailer';
import 'dotenv/config';
export const sendEmail = async (fastify, { to, subject, html }) => {
    console.log(process.env.SMTP_HOST);
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    const res = await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
    });
    console.log(res);
};
