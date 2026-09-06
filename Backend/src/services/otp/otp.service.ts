import crypto from 'crypto';
import redis from '../../utils/redis';
import { env } from '../../config/env';
import emailService from '../email/email.service';
import { OtpPurpose, OtpRecord, SendOtpParams, SendOtpResult, VerifyOtpParams, VerifyOtpResult } from './otp.types';

export class CustomError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

class OtpService {
  private readonly OTP_TTL_SECONDS = 300; // 5 minutes
  private readonly RESEND_COOLDOWN_SECONDS = 60; // 60 seconds
  private readonly HOURLY_MAX_REQUESTS = 5; // 5 requests per hour
  private readonly MAX_VERIFICATION_ATTEMPTS = 5; // 5 attempts max

  // In-memory fallback stores in case Redis is temporarily down
  private fallbackOtpStore: Map<string, { record: OtpRecord; expiresAt: number }> = new Map();
  private fallbackCooldownStore: Map<string, number> = new Map();
  private fallbackHourlyStore: Map<string, { count: number; expiresAt: number }> = new Map();

  /**
   * Normalize email to lowercase
   */
  public normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  /**
   * Cryptographically generate a 6-digit OTP string.
   */
  public generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Hash OTP securely using HMAC-SHA256 with OTP secret key.
   */
  public hashOtp(otp: string, email: string, purpose: OtpPurpose): string {
    const normalized = this.normalizeEmail(email);
    const secret = env.OTP_SECRET || 'dparcels-otp-secret-key-2026';
    return crypto
      .createHmac('sha256', secret)
      .update(`${normalized}:${purpose}:${otp}`)
      .digest('hex');
  }

  /**
   * Check rate limits (60s cooldown & hourly request limit).
   */
  private async checkRateLimits(email: string, purpose: OtpPurpose): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    const cooldownKey = `otp_cooldown:${purpose}:${normalizedEmail}`;
    const hourlyKey = `otp_hourly:${purpose}:${normalizedEmail}`;

    try {
      // 1. Check 60-second resend cooldown
      const inCooldown = await redis.get(cooldownKey);
      if (inCooldown) {
        const ttl = await redis.ttl(cooldownKey);
        const waitTime = ttl > 0 ? ttl : this.RESEND_COOLDOWN_SECONDS;
        throw new CustomError(
          `Please wait ${waitTime} seconds before requesting another OTP.`,
          429
        );
      }

      // 2. Check hourly limit (max 5 per hour)
      const hourlyCountStr = await redis.get(hourlyKey);
      const hourlyCount = hourlyCountStr ? parseInt(hourlyCountStr, 10) : 0;
      if (hourlyCount >= this.HOURLY_MAX_REQUESTS) {
        throw new CustomError(
          'Maximum OTP request limit reached for this hour. Please try again later.',
          429
        );
      }
    } catch (err: any) {
      if (err instanceof CustomError) throw err;
      
      // Fallback rate limiting logic if Redis fails
      console.warn('[OtpService] Redis rate limit check failed, using in-memory fallback:', err.message);
      const now = Date.now();

      const cooldownExpire = this.fallbackCooldownStore.get(cooldownKey);
      if (cooldownExpire && cooldownExpire > now) {
        const waitSecs = Math.ceil((cooldownExpire - now) / 1000);
        throw new CustomError(`Please wait ${waitSecs} seconds before requesting another OTP.`, 429);
      }

      const hourlyData = this.fallbackHourlyStore.get(hourlyKey);
      if (hourlyData && hourlyData.expiresAt > now) {
        if (hourlyData.count >= this.HOURLY_MAX_REQUESTS) {
          throw new CustomError('Maximum OTP request limit reached for this hour. Please try again later.', 429);
        }
      }
    }
  }

  /**
   * Record rate limit increments.
   */
  private async setRateLimits(email: string, purpose: OtpPurpose): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    const cooldownKey = `otp_cooldown:${purpose}:${normalizedEmail}`;
    const hourlyKey = `otp_hourly:${purpose}:${normalizedEmail}`;
    const now = Date.now();

    try {
      // Set 60-second cooldown
      await redis.setex(cooldownKey, this.RESEND_COOLDOWN_SECONDS, '1');

      // Increment hourly counter with 3600-second TTL
      const currentCount = await redis.incr(hourlyKey);
      if (currentCount === 1) {
        await redis.expire(hourlyKey, 3600);
      }
    } catch (err: any) {
      console.warn('[OtpService] Redis rate limit set failed, using in-memory fallback:', err.message);
      this.fallbackCooldownStore.set(cooldownKey, now + this.RESEND_COOLDOWN_SECONDS * 1000);
      
      const existingHourly = this.fallbackHourlyStore.get(hourlyKey);
      if (existingHourly && existingHourly.expiresAt > now) {
        existingHourly.count += 1;
      } else {
        this.fallbackHourlyStore.set(hourlyKey, { count: 1, expiresAt: now + 3600 * 1000 });
      }
    }
  }

  /**
   * Generate, hash, store, and send OTP.
   */
  public async sendOtp(params: SendOtpParams): Promise<SendOtpResult> {
    const { email, purpose } = params;
    const normalizedEmail = this.normalizeEmail(email);

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new CustomError('Invalid email address.', 400);
    }

    // Check 60s cooldown and hourly limit
    await this.checkRateLimits(normalizedEmail, purpose);

    // Generate cryptographic 6-digit OTP
    const plaintextOtp = this.generateOtp();
    const hashedOtp = this.hashOtp(plaintextOtp, normalizedEmail, purpose);

    const otpRecord: OtpRecord = {
      hashedOtp,
      purpose,
      attempts: 0,
      createdAt: Date.now(),
      email: normalizedEmail,
    };

    const redisKey = `otp:${purpose}:${normalizedEmail}`;

    try {
      // Store in Redis with 5-minute TTL (300 seconds)
      await redis.setex(redisKey, this.OTP_TTL_SECONDS, JSON.stringify(otpRecord));
    } catch (err: any) {
      console.warn('[OtpService] Redis store OTP failed, using in-memory fallback:', err.message);
      this.fallbackOtpStore.set(redisKey, {
        record: otpRecord,
        expiresAt: Date.now() + this.OTP_TTL_SECONDS * 1000,
      });
    }

    // Set rate limit cooldown and count
    await this.setRateLimits(normalizedEmail, purpose);

    // Send email via Nodemailer & Gmail SMTP
    try {
      await emailService.sendOtpEmail(normalizedEmail, plaintextOtp, purpose);
    } catch (err: any) {
      // If sending fails, allow retry by deleting cooldown
      try {
        await redis.del(`otp_cooldown:${purpose}:${normalizedEmail}`);
      } catch (e) {
        this.fallbackCooldownStore.delete(`otp_cooldown:${purpose}:${normalizedEmail}`);
      }
      throw new CustomError(err.message || 'Unable to send verification email. Please try again later.', 500);
    }

    return {
      success: true,
      message: 'OTP sent successfully. Please check your email.',
    };
  }

  /**
   * Verify an OTP submitted by user.
   */
  public async verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResult> {
    const { email, otp, purpose } = params;
    const normalizedEmail = this.normalizeEmail(email);

    if (!normalizedEmail || !otp || otp.trim().length !== 6) {
      throw new CustomError('Invalid or incomplete 6-digit OTP.', 400);
    }

    const redisKey = `otp:${purpose}:${normalizedEmail}`;
    let record: OtpRecord | null = null;
    let remainingTtl = this.OTP_TTL_SECONDS;

    try {
      const storedData = await redis.get(redisKey);
      if (storedData) {
        record = JSON.parse(storedData);
        const ttl = await redis.ttl(redisKey);
        if (ttl > 0) remainingTtl = ttl;
      }
    } catch (err: any) {
      console.warn('[OtpService] Redis get OTP failed, checking in-memory fallback:', err.message);
      const fallbackEntry = this.fallbackOtpStore.get(redisKey);
      if (fallbackEntry && fallbackEntry.expiresAt > Date.now()) {
        record = fallbackEntry.record;
      }
    }

    if (!record) {
      throw new CustomError('OTP has expired. Please request a new OTP.', 400);
    }

    // Check purpose match
    if (record.purpose !== purpose) {
      throw new CustomError('OTP has expired. Please request a new OTP.', 400);
    }

    // Check attempts limit
    if (record.attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
      // Delete OTP on exceeding maximum attempts
      try {
        await redis.del(redisKey);
      } catch (e) {
        this.fallbackOtpStore.delete(redisKey);
      }
      throw new CustomError('Maximum verification attempts exceeded. Please request a new OTP.', 400);
    }

    // Compare hash
    const submittedHash = this.hashOtp(otp.trim(), normalizedEmail, purpose);
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(record.hashedOtp),
      Buffer.from(submittedHash)
    );

    if (!isMatch) {
      // Increment attempts count
      record.attempts += 1;
      
      try {
        if (record.attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
          await redis.del(redisKey);
        } else {
          await redis.setex(redisKey, remainingTtl, JSON.stringify(record));
        }
      } catch (e) {
        if (record.attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
          this.fallbackOtpStore.delete(redisKey);
        } else {
          const fallbackEntry = this.fallbackOtpStore.get(redisKey);
          if (fallbackEntry) fallbackEntry.record = record;
        }
      }

      if (record.attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
        throw new CustomError('Maximum verification attempts exceeded. Please request a new OTP.', 400);
      } else {
        throw new CustomError('Invalid OTP. Please try again.', 400);
      }
    }

    // Successful Verification: Consume/delete OTP from Redis so it cannot be reused
    try {
      await redis.del(redisKey);
    } catch (e) {
      this.fallbackOtpStore.delete(redisKey);
    }

    return {
      success: true,
      message: 'OTP verified successfully.',
    };
  }

  /**
   * Helper method for unit tests: inject an OTP record deterministically into Redis/fallback
   */
  public async setTestOtpRecord(email: string, otp: string, purpose: OtpPurpose, attempts: number = 0): Promise<string> {
    const normalizedEmail = this.normalizeEmail(email);
    const hashedOtp = this.hashOtp(otp, normalizedEmail, purpose);
    const redisKey = `otp:${purpose}:${normalizedEmail}`;
    const otpRecord: OtpRecord = {
      hashedOtp,
      purpose,
      attempts,
      createdAt: Date.now(),
      email: normalizedEmail,
    };

    try {
      await redis.setex(redisKey, this.OTP_TTL_SECONDS, JSON.stringify(otpRecord));
    } catch (e) {
      this.fallbackOtpStore.set(redisKey, {
        record: otpRecord,
        expiresAt: Date.now() + this.OTP_TTL_SECONDS * 1000,
      });
    }

    return hashedOtp;
  }

  /**
   * Helper method for internal unit testing: retrieve stored dev OTP hash if present.
   */
  public async getStoredOtpRecordForTest(email: string, purpose: OtpPurpose): Promise<OtpRecord | null> {
    const normalizedEmail = this.normalizeEmail(email);
    const redisKey = `otp:${purpose}:${normalizedEmail}`;
    try {
      const data = await redis.get(redisKey);
      if (data) return JSON.parse(data);
    } catch (e) {
      const fallback = this.fallbackOtpStore.get(redisKey);
      if (fallback && fallback.expiresAt > Date.now()) return fallback.record;
    }
    return null;
  }
}

export const otpService = new OtpService();
export default otpService;
