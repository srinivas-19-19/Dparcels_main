import prisma from '../../utils/prisma';
import { NotificationsService } from '../notifications/notifications.service';

export const AdminService = {
  async getDashboardStats() {
    const totalOrders = await prisma.order.count();
    const activeRiders = await prisma.riderProfile.count({
      where: { isOnline: true }
    });
    const pendingRiders = await prisma.riderProfile.count({
      where: { isApproved: false }
    });

    const revenueResult = await prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    });

    return {
      totalOrders,
      activeRiders,
      pendingRiders,
      totalRevenue: revenueResult._sum.amount || 0,
    };
  },

  async getPendingRiders() {
    return prisma.riderProfile.findMany({
      where: { isApproved: false },
      include: {
        user: { select: { email: true, createdAt: true } }
      }
    });
  },

  async approveRider(riderProfileId: string) {
    const profile = await prisma.riderProfile.findUnique({
      where: { id: riderProfileId }
    });
    if (!profile) throw new Error('Rider profile not found');

    return prisma.riderProfile.update({
      where: { id: riderProfileId },
      data: { isApproved: true }
    });
  },

  async getAllOrders() {
    return prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        rider: { include: { user: true } },
        payment: true
      }
    });
  },

  async getAllCustomers() {
    return prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        createdAt: true,
        status: true,
        customerProfile: true,
      }
    });
  },

  async getAllRiders() {
    return prisma.riderProfile.findMany({
      include: {
        user: true,
        _count: { select: { ordersDelivered: true } }
      }
    });
  },
  
  async getAllNotifications() {
    return prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, role: true } }
      }
    });
  },

  async broadcastNotification(title: string, message: string, targetRole: string) {
    // Basic implementation to find users by role (or all) and send notification
    let whereClause = {};
    if (targetRole !== 'ALL') {
      whereClause = { role: targetRole };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true }
    });

    const notifications = users.map(u => ({
      userId: u.id,
      title,
      body: message,
      type: 'SYSTEM',
      isRead: false
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      });
    }

    return { count: notifications.length };
  },

  async getAllPayments() {
    return prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            customer: { include: { user: { select: { email: true, phone: true } } } }
          }
        }
      }
    });
  },

  async getAllBanners() {
    return prisma.banner.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  async createBanner(data: { imageUrl: string, linkUrl?: string, isActive?: boolean }) {
    return prisma.banner.create({ data });
  },

  async deleteBanner(id: string) {
    return prisma.banner.delete({ where: { id } });
  }
};
