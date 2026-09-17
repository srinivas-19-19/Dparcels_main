import prisma from '../../utils/prisma';
import { PricingService } from '../pricing/pricing.service';
import { MapService } from '../../services/map.service';
import { getIO } from '../../utils/socket';

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

    const pickupLat = Number(data.pickupLat);
    const pickupLng = Number(data.pickupLng);
    const dropAddress = data.dropAddress || data.dropoffAddress;
    const dropLat = Number(data.dropLat ?? data.dropoffLat);
    const dropLng = Number(data.dropLng ?? data.dropoffLng);

    // 3. Re-calculate price on backend securely
    const { distanceKm, timeMins } = await MapService.calculateDistanceAndETA(
      pickupLat, pickupLng, dropLat, dropLng
    );
    const { basePrice, distancePrice, totalAmount } = PricingService.calculatePrice(distanceKm);
    const finalAmount = totalAmount;

    const trackingId = generateTrackingId();

    // 4. Create Order + OrderEvent in transaction
    const order = await prisma.$transaction(async (tx: any) => {
      const newOrder = await tx.order.create({
        data: {
          idempotencyKey: data.idempotencyKey,
          trackingId,
          customerProfileId: user.customerProfile!.id,
          pickupAddress: data.pickupAddress,
          pickupLat,
          pickupLng,
          dropAddress,
          dropLat,
          dropLng,
          distanceKm: parseFloat(distanceKm.toFixed(2)),
          estimatedTimeMins: timeMins,
          serviceType: data.serviceType || 'STANDARD',
          packageCategory: data.packageCategory || data.serviceType || 'custom',
          storeName: data.storeName || null,
          items: data.items ? (Array.isArray(data.items) ? data.items : [data.items]) : null,
          instructions: data.instructions || null,
          status: 'ASSIGNING',
          basePrice,
          distancePrice,
          totalAmount: finalAmount,
        },
        include: {
          rider: true,
          events: true,
        },
      });

      // Create Initial Event
      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id,
          newStatus: 'ASSIGNING',
          actorId: customerId,
          actorRole: 'CUSTOMER',
          description: data.instructions
            ? `Order created. Instructions: ${data.instructions}`
            : 'Order created and assigning to nearby delivery partners',
        },
      });

      // Create Payment Record (Pending)
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amount: finalAmount,
          currency: 'INR',
          status: 'PENDING',
          idempotencyKey: `pay_${data.idempotencyKey}`,
        },
      });

      // Create Customer In-App Notification
      await tx.notification.create({
        data: {
          userId: customerId,
          title: 'Order Placed Successfully',
          body: `Your order #${trackingId} has been confirmed (₹${finalAmount}). Finding nearby delivery partner...`,
          type: 'ORDER',
          isRead: false,
        },
      });

      return newOrder;
    });

    // 5. Emit real-time socket broadcasts
    try {
      const io = getIO();
      const orderBroadcast = {
        id: order.id,
        trackingId: order.trackingId,
        pickupAddress: order.pickupAddress,
        pickupLocation: order.pickupAddress,
        pickupLat: order.pickupLat,
        pickupLng: order.pickupLng,
        dropAddress: order.dropAddress,
        dropLocation: order.dropAddress,
        dropLat: order.dropLat,
        dropLng: order.dropLng,
        distanceKm: order.distanceKm,
        estimatedTimeMins: order.estimatedTimeMins,
        serviceType: order.serviceType,
        packageCategory: order.packageCategory,
        storeName: order.storeName,
        items: order.items,
        instructions: order.instructions,
        category: order.packageCategory || order.serviceType,
        totalAmount: order.totalAmount,
        totalPrice: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      };

      // Notify nearby riders
      io.to('riders').emit('new_order_available', orderBroadcast);

      // Notify customer private room
      io.to(customerId).emit('order_created', orderBroadcast);
    } catch (socketErr: any) {
      console.warn('[OrdersService] Socket emission warning:', socketErr?.message || socketErr);
    }

    return order;
  },

  async getCustomerOrders(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { customerProfile: true } });
    if (!user?.customerProfile) throw new Error('Profile not found');

    return prisma.order.findMany({
      where: { customerProfileId: user.customerProfile.id },
      include: {
        rider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            rating: true,
            vehicleType: true,
            vehicleNumber: true,
            paymentQrUrl: true,
            upiId: true,
          },
        },
        payment: true,
        events: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getOrderById(userId: string, orderIdOrTracking: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { customerProfile: true } });
    if (!user?.customerProfile) throw new Error('Profile not found');

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderIdOrTracking },
          { trackingId: orderIdOrTracking },
        ],
      },
      include: {
        events: { orderBy: { createdAt: 'desc' } },
        payment: true,
        rider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            rating: true,
            vehicleType: true,
            vehicleNumber: true,
            paymentQrUrl: true,
            upiId: true,
          },
        },
      },
    });

    if (!order) throw new Error('Order not found');
    if (order.customerProfileId !== user.customerProfile.id) {
      throw new Error('Unauthorized access to order');
    }

    return order;
  },

  async cancelOrder(userId: string, orderIdOrTracking: string, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { customerProfile: true } });
    if (!user?.customerProfile) throw new Error('Profile not found');

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderIdOrTracking },
          { trackingId: orderIdOrTracking },
        ],
      },
    });

    if (!order) throw new Error('Order not found');
    if (order.customerProfileId !== user.customerProfile.id) {
      throw new Error('Unauthorized access to order');
    }

    const CANCELLABLE_STATUSES = [
      'DRAFT',
      'PAYMENT_PENDING',
      'CONFIRMED',
      'ASSIGNING',
      'RIDER_ASSIGNED',
      'ACCEPTED',
    ];

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw new Error(`Order cannot be cancelled in its current state (${order.status})`);
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const cancelledOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
        include: { rider: true, events: true },
      });

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          previousStatus: order.status,
          newStatus: 'CANCELLED',
          actorId: userId,
          actorRole: 'CUSTOMER',
          description: reason || 'Order cancelled by customer',
        },
      });

      await tx.notification.create({
        data: {
          userId,
          title: 'Order Cancelled',
          body: `Order #${order.trackingId} has been successfully cancelled.`,
          type: 'ORDER',
          isRead: false,
        },
      });

      return cancelledOrder;
    });

    try {
      const io = getIO();
      const statusPayload = {
        orderId: updated.id,
        trackingId: updated.trackingId,
        status: 'CANCELLED',
        reason: reason || 'Cancelled by customer',
        timestamp: new Date().toISOString(),
      };

      io.to(userId).emit('order_status_updated', statusPayload);
      io.to('riders').emit('order_cancelled', { orderId: updated.id, trackingId: updated.trackingId });
    } catch (socketErr: any) {
      console.warn('[OrdersService] Socket emission warning on cancel:', socketErr?.message || socketErr);
    }

    return updated;
  },

  async getAvailableOrders() {
    return prisma.order.findMany({
      where: {
        status: { in: ['PAYMENT_PENDING', 'CONFIRMED', 'ASSIGNING'] },
        riderProfileId: null,
      },
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

    // Fetch customer userId
    const customer = await prisma.customerProfile.findUnique({ 
      where: { id: order.customerProfileId },
      select: { userId: true }
    });

    const updatedOrder = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          riderProfileId: user.riderProfile!.id,
          status: 'ACCEPTED'
        }
      });

      await tx.orderEvent.create({
        data: {
          orderId,
          previousStatus: order.status,
          newStatus: 'ACCEPTED',
          actorId: riderUserId,
          actorRole: 'RIDER',
          description: `Rider ${user.riderProfile!.firstName} accepted the order.`
        }
      });

      if (customer) {
        await tx.notification.create({
          data: {
            userId: customer.userId,
            title: 'Rider Assigned!',
            body: `Rider ${user.riderProfile!.firstName} accepted your order and is heading to pickup.`,
            type: 'ORDER'
          }
        });
      }

      return updated;
    });

    // Emit order_status_updated to customer's private room and order room
    try {
      const io = getIO();
      const statusPayload = {
        orderId: updatedOrder.id,
        trackingId: updatedOrder.trackingId,
        status: 'ACCEPTED',
        rider: {
          id: user.riderProfile!.id,
          firstName: user.riderProfile!.firstName,
          lastName: user.riderProfile!.lastName,
          phone: user.riderProfile!.phone,
          vehicleType: user.riderProfile!.vehicleType,
          vehicleNumber: user.riderProfile!.vehicleNumber,
          rating: user.riderProfile!.rating
        },
        timestamp: new Date().toISOString()
      };

      if (customer?.userId) {
        io.to(customer.userId).emit('order_status_updated', statusPayload);
        io.to(customer.userId).emit('order_status_update', statusPayload);
      }
      io.to(`order_${orderId}`).emit('order_status_updated', statusPayload);
      io.to('riders').emit('order_taken', { orderId: updatedOrder.id });
    } catch (socketErr: any) {
      console.warn('[OrdersService] Socket emission error for order_status_updated:', socketErr?.message || socketErr);
    }

    return updatedOrder;
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

    // State machine transition validation
    const VALID_TRANSITIONS: Record<string, string[]> = {
      ACCEPTED: ['ARRIVED_PICKUP'],
      RIDER_ASSIGNED: ['ACCEPTED', 'ARRIVED_PICKUP'],
      ARRIVED_PICKUP: ['PICKED_UP'],
      PICKED_UP: ['DELIVERED', 'IN_TRANSIT'],
      IN_TRANSIT: ['DELIVERED', 'OUT_FOR_DELIVERY'],
      OUT_FOR_DELIVERY: ['DELIVERED'],
    };

    const allowedNext = VALID_TRANSITIONS[order.status] || [];
    if (!allowedNext.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${order.status} to ${newStatus}. Allowed next: ${allowedNext.join(', ') || 'None'}`
      );
    }

    const customer = await prisma.customerProfile.findUnique({ 
      where: { id: order.customerProfileId },
      select: { userId: true }
    });

    const updatedOrder = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.order.update({
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
          description: `Rider ${user.riderProfile!.firstName} updated status to ${newStatus}`
        }
      });

      // If marked as DELIVERED, mark payment as PAID
      if (newStatus === 'DELIVERED') {
        await tx.payment.updateMany({
          where: { orderId },
          data: { status: 'PAID' }
        });
      }

      // Notify customer
      if (customer) {
        await tx.notification.create({
          data: {
            userId: customer.userId,
            title: 'Order Status Update',
            body: `Your order is now ${newStatus.replace('_', ' ')}.`,
            type: 'ORDER'
          }
        });
      }

      return updated;
    });

    // Emit order_status_updated to customer private room and order room
    try {
      const io = getIO();
      const statusPayload = {
        orderId: updatedOrder.id,
        trackingId: updatedOrder.trackingId,
        status: newStatus,
        rider: {
          id: user.riderProfile!.id,
          firstName: user.riderProfile!.firstName,
          lastName: user.riderProfile!.lastName,
          phone: user.riderProfile!.phone,
          vehicleType: user.riderProfile!.vehicleType,
          vehicleNumber: user.riderProfile!.vehicleNumber,
          rating: user.riderProfile!.rating
        },
        timestamp: new Date().toISOString()
      };

      if (customer?.userId) {
        io.to(customer.userId).emit('order_status_updated', statusPayload);
        io.to(customer.userId).emit('order_status_update', statusPayload);
      }
      io.to(`order_${orderId}`).emit('order_status_updated', statusPayload);
      io.to(`order_${orderId}`).emit('order_status_update', statusPayload);
    } catch (socketErr: any) {
      console.warn('[OrdersService] Socket emission error in updateOrderStatus:', socketErr?.message || socketErr);
    }

    return updatedOrder;
  },
  
  async submitReview(orderId: string, userId: string, rating: number, feedback?: string) {
    // Resolve userId → customerProfile.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true },
    });
    if (!user?.customerProfile) throw new Error('Customer profile not found');
    const customerProfileId = user.customerProfile.id;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');
    if (order.customerProfileId !== customerProfileId) throw new Error('Unauthorized');
    if (order.status !== 'DELIVERED') throw new Error('Can only rate delivered orders');
    if (!order.riderProfileId) throw new Error('No rider assigned to this order');

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({ where: { orderId } });
    if (existingReview) throw new Error('Order has already been reviewed');

    const review = await prisma.$transaction(async (tx: any) => {
      const newReview = await tx.review.create({
        data: {
          orderId,
          customerId: customerProfileId,
          riderId: order.riderProfileId!,
          rating,
          feedback: feedback || null,
        },
      });

      // Recalculate rider average rating
      const allReviews = await tx.review.findMany({
        where: { riderId: order.riderProfileId! },
        select: { rating: true },
      });
      const avgRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;

      await tx.riderProfile.update({
        where: { id: order.riderProfileId! },
        data: { rating: parseFloat(avgRating.toFixed(1)) },
      });

      return newReview;
    });

    return review;
  }
};

