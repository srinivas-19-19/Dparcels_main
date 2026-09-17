import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';
import { sendOtpEmail } from './mailer';
import { sendPushNotification } from './firebase';

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 2) return null;
    return 1000;
  },
});

connection.on('error', () => {
  // Suppress uncaught Redis offline errors in local dev
});

export const emailQueue = new Queue('email-queue', { connection });
export const notificationQueue = new Queue('notification-queue', { connection });

// Email Worker
const emailWorker = new Worker('email-queue', async (job) => {
  const { to, otp } = job.data;
  await sendOtpEmail(to, otp);
}, { connection });

emailWorker.on('error', () => {});
emailWorker.on('completed', job => logger.info(`[Email Worker] Sent OTP to ${job.data.to}`));
emailWorker.on('failed', (job, err) => logger.error(`[Email Worker] Failed: ${err.message}`));

// Notification Worker
const notificationWorker = new Worker('notification-queue', async (job) => {
  const { token, title, body } = job.data;
  await sendPushNotification(token, title, body);
}, { connection });

notificationWorker.on('error', () => {});
notificationWorker.on('completed', job => logger.info(`[Notification Worker] Sent Push to ${job.data.token}`));
notificationWorker.on('failed', (job, err) => logger.error(`[Notification Worker] Failed: ${err.message}`));

(emailQueue as any).on('error', () => {});
(notificationQueue as any).on('error', () => {});

export const initQueues = () => {
  logger.info('✅ Background Workers initialized successfully');
};
