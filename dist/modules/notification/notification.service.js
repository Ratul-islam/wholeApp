import { sendEmail } from '../../utils/email.js';
import { emailTemplates } from './email.template.js';
export const sendOTPEmail = async (fastify, email, otp, type, expiresInMinutes) => {
    const template = emailTemplates[type];
    if (!template) {
        throw new Error(`No email template defined for OTP type: ${type}`);
    }
    const { subject, html } = template(otp, expiresInMinutes);
    console.log(otp);
    await sendEmail(fastify, { to: email, subject, html });
};
