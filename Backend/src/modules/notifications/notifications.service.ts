import prisma from '../../utils/prisma';
import { notificationQueue } from '../../utils/queue';

export const NotificationsService = {
  async getNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  },

  async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new Error('Notification not found');
    if (notification.userId !== userId) throw new Error('Unauthorized');

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  },

  async createNotification(userId: string, title: string, message: string) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body: message, // mapped message to body for schema compatibility
        isRead: false,
        type: 'SYSTEM'
      }
    });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });
    if (user?.fcmToken) {
      await notificationQueue.add('send-push', { token: user.fcmToken, title, body: message });
    }

    return notification;
  }
};
