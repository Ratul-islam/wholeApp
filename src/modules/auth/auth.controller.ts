import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as authService from './auth.service.js'
import { sendSuccess, sendError } from '../../utils/responses.js'
import { AppError } from '../../utils/AppError.js'
import { createOTP } from '../otp/otp.sevice.js'
import { sendOTPEmail } from '../notification/notification.service.js'
import { getUserBy } from '../user/user.service.js'

type RefreshBody = {
  refreshToken: string
}
export const register = async (
  fastify: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!request.body) throw new AppError('Request body required', 400)

  const { firstName, lastName, email, password } = request.body as {
    firstName: string
    lastName: string
    email: string
    password: string
  }

  const user = await authService.registerUser(firstName, lastName, email, password);

  const otp = await createOTP(user.id, 'EMAIL_VERIFICATION')
  sendOTPEmail(fastify, user.email, otp, 'EMAIL_VERIFICATION', 2)

  return sendSuccess(reply, {
    data: { id: user.id, email: user.email },
    message: 'Registered successfully. Check your email to verify your account.',
  })
}

export const verify = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, code } = request.body as {
      email: string,
      code: string,
    }
    const result = await authService.verifyUserOTP(email, code, 'EMAIL_VERIFICATION')
    return sendSuccess(reply, { message: result.message, data: result })
  } catch (err: any) {
    return sendError(reply, { message: err.message })
  }
}
export const login = async (
  request: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance
) => {
  try {
    if (!request.body) throw new AppError('Request body required', 400)

    const { email, password } = request.body as {
      email: string
      password: string
    }
    const user = await authService.loginUser(email, password)
    if (!user.isVerified) {
      const otp = await createOTP(user._id ?? user.id, 'EMAIL_VERIFICATION')
      
      sendOTPEmail(
        (reply.server as FastifyInstance),
        user.email,
        otp,
        'EMAIL_VERIFICATION',
        2
      )
      throw new AppError(
        'Account not verified. We sent you a new verification code.',
        408
      )
    }
    
    const accessToken = await (app.jwt as any).access.sign({ id: user._id, type: 'user' }, { expiresIn: '1d' })
    const refreshToken = await (app.jwt as any).reset.sign({ id: user._id,type: 'user' }, { expiresIn: '7d' })
    console.log(accessToken)

    await authService.saveRefreshToken(user._id, refreshToken)

    return sendSuccess(reply, {
      data: { accessToken, refreshToken },
      message: 'Logged in',
    })
  } catch (err: any) {
    console.log(err)
    return sendError(reply, { message: err.message, statusCode: err.statusCode })
  }
}
type VerifyResetOtpBody = {
  email: string;
  code: string;
};

type ConfirmResetBody = {
  resetToken: string;
  password: string;
};

type ResetTokenPayload = {
  purpose: "password_reset";
  userId: string;
  iat: number;
  exp: number;
};


export const verifyPasswordResetOtp = async (
  request: FastifyRequest<{ Body: VerifyResetOtpBody }>,
  reply: FastifyReply,
  app:FastifyInstance
) => {
  try {
    if (!request.body) throw new AppError("Request body required", 400);

    const { email, code } = request.body;
    if (!email || !code) throw new AppError("Email and code are required", 400);

    const user = await authService.verifyPasswordResetOtp(email, code);

    const resetToken = await (app.jwt as any).access.sign({
      purpose: "password_reset",
      userId: user.id,
    },{ expiresIn: '2m' });


    return sendSuccess(reply, {
      message: "OTP verified",
      data: { resetToken },
    });
  } catch (err: any) {
    console.log(err)
    return sendError(reply, { message: err.message, statusCode: err.statusCode });
  }
};

export const confirmPasswordReset = async (
  request: FastifyRequest<{ Body: ConfirmResetBody }>,
  reply: FastifyReply,
  app:FastifyInstance
) => {
  try {
    if (!request.body) throw new AppError("Request body required", 400);

    const { resetToken, password } = request.body;
    if (!resetToken || !password) {
      throw new AppError("resetToken and password are required", 400);
    }

    let payload: ResetTokenPayload;

    try {
      payload = await (app.jwt as any).access.verify(resetToken) as ResetTokenPayload;
    } catch {
      throw new AppError("Invalid or expired reset token", 401);
    }

    if (payload.purpose !== "password_reset" || !payload.userId) {
      throw new AppError("Invalid reset token", 401);
    }

    await authService.resetPasswordByUserId(payload.userId, password);

    return sendSuccess(reply, {
      message: "Password reset successfully",
    });
  } catch (err: any) {
    return sendError(reply, { message: err.message, statusCode: err.statusCode });
  }
};



type ResendOtpBody = {
  email: string;
  type?: "EMAIL_VERIFICATION" | "PASSWORD_RESET";
};

export const resendOtp = async (
  request: FastifyRequest<{ Body: ResendOtpBody }>,
  reply: FastifyReply
) => {
  try {
    if (!request.body) throw new AppError("Request body required", 400);

    const { email, type } = request.body;
    if (!email) throw new AppError("Email required", 400);

    await authService.resendOtp(reply.server, email, type ?? "EMAIL_VERIFICATION");

    return sendSuccess(reply, {
      message: "If the account exists, an OTP has been sent.",
    });
  } catch (err: any) {
    return sendError(reply, { message: err.message, statusCode: err.statusCode });
  }
};

export const refreshToken = async (
  request: FastifyRequest<{ Body: RefreshBody }>,
  reply: FastifyReply,
  app:FastifyInstance
) => {
  try {
    if (!request.body) throw new AppError('Request body required', 400)

    const { refreshToken } = request.body
    if (!refreshToken) throw new AppError('Refresh token required', 400)

    const user = await authService.verifyRefreshToken(refreshToken)
    const newAccessToken = await (app.jwt as any).access.sign({ id: user._id, type:"user" }, { expiresIn: '15m' })

    return sendSuccess(reply, { data: { accessToken: newAccessToken }, message: 'Access token refreshed' })
  } catch (err: any) {
    return sendError(reply, { message: err.message, statusCode: err.statusCode })
  }
}



export const validateUser = async (
  req: FastifyRequest<{ Body: RefreshBody }>,
  reply: FastifyReply
) => {
  try {
    const userId = (req as any).user?.id;

    const user = await getUserBy({id: userId})

    if (!user) {
      return sendError(reply, {message: "User not found", statusCode:404});
    }
    return sendSuccess(reply, {
data: {
        id: user._id,
        email: user.email,
        name: user.firstName +" "+user.lastName,
      },
    })
  } catch (err: any) {
    return sendError(reply, { message: err.message, statusCode: err.statusCode })
  }
}


export const forgotPassword = async (
  fastify: FastifyInstance,
  request: FastifyRequest<{ Body: { email: string } }>,
  reply: FastifyReply
) => {
  try {
    const { email } = request.body
    if (!email) throw new AppError('Email required', 400)
    const user = await getUserBy({email})
    if(!user) return sendError(reply,{message: "Email is not registered with our service"})
    await authService.requestPasswordReset(fastify, email)
    return sendSuccess(reply, { message: 'OTP sent to email if the account exists' })
  } catch (err: any) {
    return sendError(reply, { message: err.message, statusCode: err.statusCode })
  }
}


export async function logout(req: FastifyRequest, reply: FastifyReply) {
  const userId = (req as any).user.id


  try{
    const revoked = await authService.revokeRefreshToken(userId)
  if (!revoked) {
      return sendSuccess(reply, { message: 'Logged out' })
    }

    return sendSuccess(reply, { message: 'Logged out' })
  } catch (err: any) {
    return sendError(reply, { message: err.message, statusCode: err.statusCode })
  }
}
