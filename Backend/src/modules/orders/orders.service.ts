import prisma from '../../utils/prisma';
import { PricingService } from '../pricing/pricing.service';
import { MapService } from '../../services/map.service';

const generateTrackingId = () => `DPARC-${Math.floor(100000 + Math.random() * 900000)}`;

export const OrdersService = {
  async createOrder(customerId: string, data: any) {
    // 1. Check idempotency
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey: data.idempotencyKey }
    });
    if (existingOrder) {
      return existingOrder;
    }

    // 2. Fetch customer profile
    const user = await prisma.user.findUnique({
      where: { id: customerId },
      include: { customerProfile: true }
    });
    if (!user || !user.customerProfile) {
      throw new Error('Customer profile not found');
    }

    // 3. Re-calculate price on backend securely
    const { distanceKm, timeMins } = await MapService.calculateDistanceAndETA(
      data.pickupLat, data.pickupLng, data.dropLat, data.dropLng
    );
    const { basePrice, distancePrice, totalAmount } = PricingService.calculatePrice(distanceKm);

    let finalAmount = totalAmount;
    if (data.serviceType === 'EXPRESS') {
       finalAmount = Math.ceil(finalAmount * 1.5);
    }

    const trackingId = generateTrackingId();

    // 4. Create Order + OrderEvent in transaction
    const order = await prisma.$transaction(async (tx: any) => {
      const newOrder = await tx.order.create({
        data: {
          idempotencyKey: data.idempotencyKey,
          trackingId,
          customerProfileId: user.customerProfile!.id,
          pickupAddress: data.pickupAddress,
          pickupLat: data.pickupLat,
          pickupLng: data.pickupLng,
          dropAddress: data.dropAddress,
          dropLat: data.dropLat,
          dropLng: data.dropLng,
          distanceKm: parseFloat(distanceKm.toFixed(2)),
          estimatedTimeMins: timeMins,
          serviceType: data.serviceType,
          status: 'PAYMENT_PENDING',
          basePrice,
          distancePrice,
          totalAmount: finalAmount,
        }
      });

      // Create Initial Event
      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id,
          newStatus: 'PAYMENT_PENDING',
          actorId: customerId,
          actorRole: 'CUSTOMER',
          description: 'Order created and awaiting payment'
        }
      });

      // Create Payment Record (Pending)
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amount: finalAmount,
          currency: 'INR',
          status: 'PENDING',
          idempotencyKey: `pay_${data.idempotencyKey}`
        }
      });

      return newOrder;
    });

    return order;
  },

  async getCustomerOrders(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { customerProfile: true } });
    if (!user?.customerProfile) throw new Error('Profile not found');

    return prisma.order.findMany({
      where: { customerProfileId: user.customerProfile.id },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getOrderById(userId: string, orderId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { customerProfile: true } });
    if (!user?.customerProfile) throw new Error('Profile not found');

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        events: { orderBy: { createdAt: 'desc' } },
        payment: true,
        rider: true,
      }
    });

    if (!order) throw new Error('Order not found');
    if (order.customerProfileId !== user.customerProfile.id) throw new Error('Unauthorized access to order');

    return order;
  },

  async getAvailableOrders() {
    return prisma.order.findMany({
      where: { status: 'PAYMENT_PENDING', riderProfileId: null },
      orderBy: { createdAt: 'asc' },
    });
  },

  async acceptOrder(riderUserId: string, orderId: string) {
    const user = await prisma.user.findUnique({
      where: { id: riderUserId },
      include: { riderProfile: true }
    });
    if (!user?.riderProfile) throw new Error('Rider profile not found');

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');
    if (order.riderProfileId) throw new Error('Order already assigned to a rider');

    return prisma.$transaction(async (tx: any) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          riderProfileId: user.riderProfile!.id,
          status: 'RIDER_ASSIGNED'
        }
      });

      await tx.orderEvent.create({
        data: {
          orderId,
          previousStatus: order.status,
          newStatus: 'RIDER_ASSIGNED',
          actorId: riderUserId,
          actorRole: 'RIDER',
          description: `Rider ${user.riderProfile!.firstName} accepted the order.`
        }
      });

      // Fetch customer userId
      const customer = await tx.customerProfile.findUnique({ 
        where: { id: order.customerProfileId },
        select: { userId: true }
      });
      if (customer) {
        await tx.notification.create({
          data: {
            userId: customer.userId,
            title: 'Rider Assigned!',
            message: `Rider ${user.riderProfile!.firstName} is on the way to pick up your parcel.`
          }
        });
      }

      return updatedOrder;
    });
  },

  async updateOrderStatus(riderUserId: string, orderId: string, newStatus: string) {
    const user = await prisma.user.findUnique({
      where: { id: riderUserId },
      include: { riderProfile: true }
    });
    if (!user?.riderProfile) throw new Error('Rider profile not found');

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');
    if (order.riderProfileId !== user.riderProfile.id) throw new Error('Unauthorized access');

    return prisma.$transaction(async (tx: any) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus as any }
      });

      await tx.orderEvent.create({
        data: {
          orderId,
          previousStatus: order.status,
          newStatus: newStatus as any,
          actorId: riderUserId,
          actorRole: 'RIDER',
          description: `Order status updated to ${newStatus}`
        }
      });

      // If marked as DELIVERED, mark payment as PAID
      if (newStatus === 'DELIVERED') {
         await tx.payment.update({
           where: { orderId },
           data: { status: 'PAID' }
         });
      }

      // Notify customer
      const customer = await tx.customerProfile.findUnique({ 
        where: { id: order.customerProfileId },
        select: { userId: true }
      });
      if (customer) {
        await tx.notification.create({
          data: {
            userId: customer.userId,
            title: 'Order Update',
            message: `Your order is now ${newStatus}.`
          }
        });
      }

      return updatedOrder;
    });
  },
  
  async submitReview(orderId: string, customerId: string, rating: number, feedback?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');
    if (order.customerProfileId !== customerId) throw new Error('Unauthorized');
    if (order.status !== 'DELIVERED') throw new Error('Can only rate delivered orders');
    if (!order.riderProfileId) throw new Error('No rider assigned to this order');

    return {
      orderId,
      customerProfileId: customerId,
      riderProfileId: order.riderProfileId,
      rating,
      feedback
    };
  }
};
