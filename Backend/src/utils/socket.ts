import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from './logger';
import redis from './redis';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`[Socket] User connected: ${socket.data.user.userId} (Role: ${socket.data.user.role})`);

    socket.join(socket.data.user.userId);

    socket.on('join_order', (orderId: string) => {
      socket.join(`order_${orderId}`);
      logger.info(`[Socket] User ${socket.data.user.userId} joined room order_${orderId}`);
    });

    socket.on('update_location', async (data: { orderId?: string; lat: number; lng: number }) => {
      if (socket.data.user.role !== 'RIDER') return;
      
      // Update in Redis GEO
      await redis.geoadd('rider_locations', data.lng, data.lat, socket.data.user.userId);

      if (data.orderId) {
        io.to(`order_${data.orderId}`).emit('rider_location_update', {
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket] User disconnected: ${socket.data.user.userId}`);
      if (socket.data.user.role === 'RIDER') {
        redis.zrem('rider_locations', socket.data.user.userId).catch(() => {});
      }
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
