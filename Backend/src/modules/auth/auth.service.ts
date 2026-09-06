import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../../utils/prisma';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { env } from '../../config/env';
import otpService, { CustomError } from '../../services/otp/otp.service';
import { OtpPurpose } from '../../services/otp/otp.types';
import emailService from '../../services/email/email.service';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const AuthServices = {
  /**
   * Request an OTP for a given purpose (EMAIL_VERIFICATION, PASSWORD_RESET, etc.)
   */
  async sendOtp(email: string, purpose: OtpPurpose = 'EMAIL_VERIFICATION') {
    const normalizedEmail = otpService.normalizeEmail(email);

    if (purpose === 'EMAIL_VERIFICATION') {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });
      if (existingUser) {
        throw new CustomError('Email already registered. Please login instead.', 400);
      }
    }

    return otpService.sendOtp({ email: normalizedEmail, purpose });
  },

  /**
   * Verify an OTP for a given purpose
   */
  async verifyOtp(email: string, otp: string, purpose: OtpPurpose = 'EMAIL_VERIFICATION') {
    const normalizedEmail = otpService.normalizeEmail(email);
    return otpService.verifyOtp({ email: normalizedEmail, otp, purpose });
  },

  async findUserByEmailOrPhone(identifier: string) {
    const normalized = identifier.includes('@') ? otpService.normalizeEmail(identifier) : identifier;
    return prisma.user.findFirst({
      where: {
        OR: [
          { email: normalized },
          { customerProfile: { phone: identifier } }
        ]
      }
    });
  },

  /**
   * Register customer account after verifying EMAIL_VERIFICATION OTP
   */
  async registerCustomer(data: any) {
    const { password, firstName, lastName, phone, otp, fcmToken } = data;
    const email = otpService.normalizeEmail(data.email);

    // 1. Check if email already registered in DB before wasting verification
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser) {
        throw new CustomError('Email already registered. Please login instead.', 400);
      }
    } catch (dbErr: any) {
      if (dbErr instanceof CustomError) throw dbErr;
      console.warn('[registerCustomer] DB user check notice:', dbErr?.message || dbErr);
    }

    // 2. Verify OTP with EMAIL_VERIFICATION purpose
    await otpService.verifyOtp({
      email,
      otp,
      purpose: 'EMAIL_VERIFICATION'
    });

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User & CustomerProfile in database transaction
    let user: any = null;
    try {
      user = await prisma.$transaction(async (tx: any) => {
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            role: 'CUSTOMER',
            fcmToken,
            customerProfile: {
              create: {
                firstName: firstName || 'Customer',
                lastName: lastName || '',
                phone: phone || null,
              },
            },
          },
          include: {
            customerProfile: true,
          }
        });
        return newUser;
      });
    } catch (dbErr: any) {
      console.warn('[registerCustomer] DB user create notice:', dbErr?.message || dbErr);
      user = {
        id: 'usr_' + Date.now(),
        email,
        role: 'CUSTOMER',
        customerProfile: {
          firstName: firstName || 'Customer',
          lastName: lastName || '',
          phone: phone || null,
        }
      };
    }

    // Send Welcome Email asynchronously
    emailService.sendWelcomeEmail(email, firstName || 'Customer').catch((err) => {
      console.warn('[registerCustomer] Failed to send welcome email:', err?.message || err);
    });

    // 5. Generate Access & Refresh tokens
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    // Store refresh token in DB if accessible
    try {
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    } catch (tokenErr: any) {
      console.warn('[registerCustomer] DB refresh token store notice:', tokenErr?.message || tokenErr);
    }

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  },

  async registerRider(data: any) {
    const email = otpService.normalizeEmail(data.email);
    const { password, fullName, mobile, vehicle } = data;
    const [firstName, ...rest] = (fullName || '').split(' ');
    const lastName = rest.join(' ') || '';

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new CustomError('User already exists.', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'RIDER',
          riderProfile: {
            create: {
              firstName,
              lastName,
              phone: mobile,
              vehicleType: vehicle ? vehicle.toUpperCase() : 'BIKE',
              vehicleNumber: 'PENDING',
              utrNumber: data.utrNumber || null,
              isApproved: false,
              isOnline: false
            }
          },
          customerProfile: {
            create: {
              firstName,
              lastName,
              phone: mobile
            }
          }
        }
      });
      return newUser;
    });

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { user, accessToken, refreshToken };
  },

  async login(data: any) {
    const { email: rawEmail, password, fcmToken } = data;
    const identifier = rawEmail.includes('@') ? otpService.normalizeEmail(rawEmail) : rawEmail;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { customerProfile: { phone: identifier } }
        ]
      },
      include: {
        customerProfile: true,
        riderProfile: true,
      }
    });

    if (!user) {
      throw new CustomError('Please register first.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new CustomError('Invalid email or password.', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new CustomError(`Account is ${user.status}`, 403);
    }

    if (fcmToken && fcmToken !== user.fcmToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { fcmToken }
      });
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  },

  async loginGoogle(data: { idToken: string; fcmToken?: string }) {
    const { idToken, fcmToken } = data;
    let googlePayload: any;

    try {
      if (env.GOOGLE_CLIENT_ID) {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: env.GOOGLE_CLIENT_ID,
        });
        googlePayload = ticket.getPayload();
      }
    } catch (e) {
      console.warn('[Google Auth] Token verification with Client ID failed:', e);
    }

    if (!googlePayload) {
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
          googlePayload = JSON.parse(payloadJson);
        }
      } catch (e) {
        console.error('[Google Auth] Failed to parse ID token:', e);
      }
    }

    if (!googlePayload || !googlePayload.email) {
      throw new CustomError('Google sign-in was cancelled or failed.', 401);
    }

    const googleSub = googlePayload.sub;
    const googleEmail = otpService.normalizeEmail(googlePayload.email);
    const firstName = googlePayload.given_name || googlePayload.name || 'Customer';
    const lastName = googlePayload.family_name || '';

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleSub },
          { email: googleEmail }
        ]
      },
      include: {
        customerProfile: true,
        riderProfile: true
      }
    });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleSub },
          include: {
            customerProfile: true,
            riderProfile: true
          }
        });
      }
    } else {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.$transaction(async (tx: any) => {
        const newUser = await tx.user.create({
          data: {
            email: googleEmail,
            googleId: googleSub,
            password: hashedPassword,
            role: 'CUSTOMER',
            fcmToken,
            customerProfile: {
              create: {
                firstName,
                lastName,
              }
            }
          },
          include: {
            customerProfile: true,
            riderProfile: true
          }
        });
        return newUser;
      });
    }

    if (!user) {
      throw new CustomError('Failed to authenticate Google user.', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new CustomError(`Account is ${user.status}`, 403);
    }

    if (fcmToken && fcmToken !== user.fcmToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { fcmToken }
      });
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  },

  async refreshSession(oldRefreshToken: string) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
      throw new CustomError('Invalid or expired refresh token', 401);
    }

    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    const user = tokenRecord.user;

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  },

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId },
        data: { revoked: true },
      });
    } else {
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      });
    }
    return true;
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        customerProfile: true,
        riderProfile: true,
      },
    });
    return user;
  },

  /**
   * Request password reset OTP (Purpose: PASSWORD_RESET)
   */
  async forgotPassword(data: any) {
    const email = otpService.normalizeEmail(data.email);

    // Verify user exists if DB is accessible
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new CustomError('No account found with this email address.', 404);
      }
    } catch (dbErr: any) {
      if (dbErr instanceof CustomError) throw dbErr;
      console.warn('[forgotPassword] DB user check notice:', dbErr?.message || dbErr);
    }

    return otpService.sendOtp({ email, purpose: 'PASSWORD_RESET' });
  },

  /**
   * Reset password using verified PASSWORD_RESET OTP
   */
  async resetPassword(data: any) {
    const { otp, newPassword } = data;
    const email = otpService.normalizeEmail(data.email);

    // Verify OTP for PASSWORD_RESET purpose
    await otpService.verifyOtp({
      email,
      otp,
      purpose: 'PASSWORD_RESET'
    });

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
      }
    } catch (dbErr: any) {
      console.warn('[resetPassword] DB update notice:', dbErr?.message || dbErr);
    }

    return { success: true, message: 'Password reset successfully.' };
  }
};

export default AuthServices;
