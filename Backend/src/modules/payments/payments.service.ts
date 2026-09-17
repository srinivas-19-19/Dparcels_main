import prisma from '../../utils/prisma';
import { getIO } from '../../utils/socket';

export interface ConfirmPaymentInput {
  paymentMethod?: 'RIDER_QR' | 'CASH';
  utrNumber?: string | null;
  notes?: string | null;
}

export const PaymentsService = {
  /**
   * Get payment & rider QR details for a specific order.
   * Authorized for the customer who created the order, assigned rider, or admin.
   */
  async getOrderPaymentQr(userId: string, role: string, orderIdOrTracking: string) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderIdOrTracking },
          { trackingId: orderIdOrTracking },
        ],
      },
      include: {
        payment: true,
        customer: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        rider: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            phone: true,
            vehicleType: true,
            vehicleNumber: true,
            rating: true,
            paymentQrUrl: true,
            upiId: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Strict multi-tenant isolation & role check
    if (role === 'CUSTOMER' && order.customer.userId !== userId) {
      throw new Error('Unauthorized access to order payment details');
    }

    if (role === 'RIDER' && order.rider?.userId !== userId) {
      throw new Error('Unauthorized: You are not assigned to this order');
    }

    // Generate UPI URI if rider has UPI ID configured
    let upiPayUri: string | null = null;
    let dynamicQrUrl: string | null = null;

    if (order.rider?.upiId) {
      const riderName = `${order.rider.firstName} ${order.rider.lastName || ''}`.trim();
      upiPayUri = `upi://pay?pa=${encodeURIComponent(order.rider.upiId)}&pn=${encodeURIComponent(riderName)}&am=${order.totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`DParcels Order ${order.trackingId}`)}`;
      dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiPayUri)}`;
    }

    // Use uploaded QR if present, otherwise fallback to dynamic UPI QR
    const effectiveQrUrl = order.rider?.paymentQrUrl || dynamicQrUrl;

    return {
      orderId: order.id,
      trackingId: order.trackingId,
      orderStatus: order.status,
      totalAmount: order.totalAmount,
      basePrice: order.basePrice,
      distancePrice: order.distancePrice,
      distanceKm: order.distanceKm,
      isGatewayRequired: false,
      payment: order.payment
        ? {
            id: order.payment.id,
            amount: order.payment.amount,
            currency: order.payment.currency,
            status: order.payment.status,
            paymentMethod: order.payment.paymentMethod || 'MANUAL_RIDER',
            updatedAt: order.payment.updatedAt,
          }
        : null,
      rider: order.rider
        ? {
            id: order.rider.id,
            name: `${order.rider.firstName} ${order.rider.lastName || ''}`.trim(),
            phone: order.rider.phone,
            vehicleType: order.rider.vehicleType,
            vehicleNumber: order.rider.vehicleNumber,
            rating: order.rider.rating,
            paymentQrUrl: order.rider.paymentQrUrl,
            effectiveQrUrl,
            upiId: order.rider.upiId,
          }
        : null,
      upiPayUri,
      instructions:
        'All payments are collected manually by the rider. Scan the rider QR code using any UPI app (Google Pay, PhonePe, Paytm, etc.) or pay direct cash. The rider confirms payment upon collection.',
    };
  },

  /**
   * Rider manually confirms collection of payment from customer.
   */
  async confirmManualPayment(riderUserId: string, orderIdOrTracking: string, payload: ConfirmPaymentInput) {
    const user = await prisma.user.findUnique({
      where: { id: riderUserId },
      include: { riderProfile: true },
    });

    if (!user || !user.riderProfile) {
      throw new Error('Rider profile not found');
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderIdOrTracking },
          { trackingId: orderIdOrTracking },
        ],
      },
      include: {
        payment: true,
        customer: true,
        rider: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.riderProfileId !== user.riderProfile.id) {
      throw new Error('Unauthorized: You are not the assigned rider for this order');
    }

    if (order.payment?.status === 'PAID') {
      throw new Error('Payment has already been confirmed for this order');
    }

    const paymentMethod = payload.paymentMethod || 'RIDER_QR';
    const methodDescription = paymentMethod === 'CASH' ? 'Cash' : 'UPI QR';

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update or create Payment record
      const payment = await tx.payment.upsert({
        where: { orderId: order.id },
        update: {
          status: 'PAID',
          paymentMethod,
          providerId: payload.utrNumber || null,
        },
        create: {
          orderId: order.id,
          amount: order.totalAmount,
          currency: 'INR',
          status: 'PAID',
          paymentMethod,
          providerId: payload.utrNumber || null,
        },
      });

      // 2. Log OrderEvent
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          previousStatus: order.status,
          newStatus: order.status,
          actorId: riderUserId,
          actorRole: 'RIDER',
          description: `Rider ${user.riderProfile!.firstName} confirmed receipt of ₹${order.totalAmount} via ${methodDescription}${payload.utrNumber ? ` (Ref: ${payload.utrNumber})` : ''}`,
          metadata: {
            paymentMethod,
            utrNumber: payload.utrNumber || null,
            notes: payload.notes || null,
          },
        },
      });

      // 3. Send in-app notification to customer
      if (order.customer?.userId) {
        await tx.notification.create({
          data: {
            userId: order.customer.userId,
            title: 'Payment Confirmed! 🎉',
            body: `Rider ${user.riderProfile!.firstName} has confirmed receipt of ₹${order.totalAmount} for order #${order.trackingId}.`,
            type: 'PAYMENT',
          },
        });
      }

      return payment;
    });

    // Broadcast real-time payment confirmation
    try {
      const io = getIO();
      const paymentPayload = {
        orderId: order.id,
        trackingId: order.trackingId,
        paymentStatus: 'PAID',
        amount: order.totalAmount,
        paymentMethod,
        confirmedByRider: user.riderProfile.firstName,
        timestamp: new Date().toISOString(),
      };

      if (order.customer?.userId) {
        io.to(order.customer.userId).emit('payment_confirmed', paymentPayload);
      }
      io.to(`order_${order.id}`).emit('payment_confirmed', paymentPayload);
    } catch (socketErr: any) {
      console.warn('[PaymentsService] Socket emission warning:', socketErr?.message || socketErr);
    }

    return updated;
  },

  /**
   * Get payment details by order ID
   */
  async getPaymentByOrderId(userId: string, role: string, orderId: string) {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            customer: true,
            rider: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (role === 'CUSTOMER' && payment.order.customer.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (role === 'RIDER' && payment.order.rider?.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return payment;
  },
};

export default PaymentsService;
