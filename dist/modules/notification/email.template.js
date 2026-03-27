export const emailTemplates = {
    EMAIL_VERIFICATION: (otp, expiresIn) => ({
        subject: 'Verify your email',
        html: `<p>Your verification code is <b>${otp}</b>. It expires in ${expiresIn} minutes.</p>`,
    }),
    PASSWORD_RESET: (otp, expiresIn) => ({
        subject: 'Reset your password',
        html: `<p>Your password reset code is <b>${otp}</b>. It expires in ${expiresIn} minutes.</p>`,
    }),
    TWO_FA: (otp, expiresIn) => ({
        subject: 'Your login code',
        html: `<p>Your login OTP is <b>${otp}</b>. It expires in ${expiresIn} minutes.</p>`,
    }),
};
