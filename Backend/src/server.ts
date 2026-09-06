import http from 'http';
import app from './app';
import { env } from './config/env';
import { initSocket } from './utils/socket';
import { initFirebase } from './utils/firebase';
import { initQueues } from './utils/queue';
import { logger } from './utils/logger';
import prisma from './utils/prisma';
import redis from './utils/redis';

import emailService from './services/email/email.service';

const server = http.createServer(app);
initSocket(server);

// Extend health check to include DB and Redis status
app.get('/health/detailed', async (req: any, res: any) => {
  let dbStatus = 'down';
  let redisStatus = 'down';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'up';
  } catch (e) {
    console.error('DB Health Check Failed:', e);
  }

  try {
    if (redis.status === 'ready') {
      redisStatus = 'up';
    }
  } catch (e) {
    console.error('Redis Health Check Failed:', e);
  }

  res.status(200).json({
    success: true,
    services: {
      api: 'up',
      database: dbStatus,
      redis: redisStatus,
    },
    timestamp: new Date().toISOString(),
  });
});

async function bootstrap() {
  try {
    initFirebase();
    try {
      initQueues();
    } catch (qErr) {
      // Ignore queue error if Redis offline
    }

    // Connect to PostgreSQL via Prisma
    try {
      await prisma.$connect();
      logger.info('✅ Connected to Postgres successfully');
    } catch (dbErr: any) {
      logger.warn('⚠️ Postgres connection offline (running server in standalone mode)');
    }

    // Verify Gmail SMTP Transporter connection safely
    await emailService.verifySmtpTransporter();

    server.listen(env.PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // Setup graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close();
      await prisma.$disconnect();
      await redis.quit();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error: any) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
