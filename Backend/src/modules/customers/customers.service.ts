import prisma from '../../utils/prisma';
import supabaseStorageService from '../../services/storage/supabaseStorage.service';
import { UpdateCustomerProfileInput } from './customers.schema';

export class CustomerServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'CustomerServiceError';
    this.statusCode = statusCode;
  }
}

export const CustomersService = {
  /**
   * Get customer profile by authenticated user's ID
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        customerProfile: true,
      },
    });

    if (!user) {
      throw new CustomerServiceError('Customer not found', 404);
    }

    if (user.status !== 'ACTIVE') {
      throw new CustomerServiceError(`Account is ${user.status}`, 403);
    }

    // Ensure customerProfile exists; if not (rare legacy edge case), create one
    let profile = user.customerProfile;
    if (!profile) {
      profile = await prisma.customerProfile.create({
        data: {
          userId: user.id,
          firstName: 'Customer',
          lastName: '',
          preferredLanguage: 'en',
          theme: 'dark',
        },
      });
    }

    return {
      ...profile,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  },

  /**
   * Update customer profile by authenticated user's ID
   */
  async updateProfile(userId: string, data: UpdateCustomerProfileInput) {
    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true },
    });

    if (!user) {
      throw new CustomerServiceError('Customer not found', 404);
    }

    if (user.status !== 'ACTIVE') {
      throw new CustomerServiceError(`Account is ${user.status}`, 403);
    }

    // Prepare update fields
    const updateData: any = {};

    if (data.name !== undefined) {
      const parts = data.name.trim().split(/\s+/);
      updateData.firstName = parts[0] || 'Customer';
      updateData.lastName = parts.slice(1).join(' ') || '';
    }

    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName.trim();
    }

    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName.trim();
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone ? data.phone.trim() : null;
    }

    if (data.profileImage !== undefined) {
      updateData.profileImage = data.profileImage;
    }

    if (data.preferredLanguage !== undefined) {
      updateData.preferredLanguage = data.preferredLanguage;
    }

    if (data.theme !== undefined) {
      updateData.theme = data.theme;
    }

    // Upsert customer profile
    const updatedProfile = await prisma.customerProfile.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        firstName: updateData.firstName || 'Customer',
        lastName: updateData.lastName || '',
        phone: updateData.phone || null,
        profileImage: updateData.profileImage || null,
        preferredLanguage: updateData.preferredLanguage || 'en',
        theme: updateData.theme || 'dark',
      },
    });

    return {
      ...updatedProfile,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  },

  /**
   * Upload customer avatar to Supabase Storage and update profileImage
   * Follows strict rollback and old avatar cleanup patterns.
   */
  async uploadAndSetAvatar(userId: string, buffer: Buffer, mimeType: string) {
    const current = await this.getProfile(userId);
    const oldAvatarUrl = current.profileImage;

    // 1. Upload new image to Supabase Storage
    const uploadResult = await supabaseStorageService.uploadAvatar(userId, buffer, mimeType);

    // 2. Update PostgreSQL profileImage
    let updatedProfile: any;
    try {
      updatedProfile = await prisma.customerProfile.update({
        where: { userId },
        data: { profileImage: uploadResult.publicUrl },
      });
    } catch (dbError: any) {
      // ROLLBACK: Delete newly uploaded file from Supabase if DB update failed
      console.error('[CustomersService] DB update failed after avatar upload, rolling back Supabase file:', dbError);
      await supabaseStorageService.deleteAvatar(uploadResult.path).catch((cleanupErr) => {
        console.warn('[CustomersService] Rollback cleanup warning:', cleanupErr);
      });
      throw new CustomerServiceError('Failed to save avatar to database', 500);
    }

    // 3. CLEANUP: Delete old avatar from Supabase if replacement succeeded
    if (oldAvatarUrl && oldAvatarUrl !== uploadResult.publicUrl) {
      supabaseStorageService.deleteAvatar(oldAvatarUrl).catch((err) => {
        console.warn('[CustomersService] Failed to cleanup previous avatar from Supabase:', err);
      });
    }

    return {
      ...updatedProfile,
      email: current.email,
      role: current.role,
      status: current.status,
    };
  },

  /**
   * Delete customer avatar from Supabase Storage and clear DB value
   */
  async deleteAvatar(userId: string) {
    const current = await this.getProfile(userId);
    const oldAvatarUrl = current.profileImage;

    if (oldAvatarUrl) {
      await supabaseStorageService.deleteAvatar(oldAvatarUrl).catch((err) => {
        console.warn('[CustomersService] Delete avatar warning:', err);
      });
    }

    const updatedProfile = await prisma.customerProfile.update({
      where: { userId },
      data: { profileImage: null },
    });

    return {
      ...updatedProfile,
      email: current.email,
      role: current.role,
      status: current.status,
    };
  },

  /**
   * Aggregate Home Dashboard data for authenticated customer
   */
  async getHomeDashboard(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: {
          include: {
            addresses: {
              orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' },
              ],
            },
          },
        },
      },
    });

    if (!user || !user.customerProfile) {
      throw new CustomerServiceError('Customer profile not found', 404);
    }

    const customerProfileId = user.customerProfile.id;

    // Active order statuses
    const activeStatuses = [
      'PAYMENT_PENDING',
      'CONFIRMED',
      'ASSIGNING',
      'RIDER_ASSIGNED',
      'ACCEPTED',
      'ARRIVED_PICKUP',
      'PICKED_UP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
    ];

    const activeOrders = await prisma.order.findMany({
      where: {
        customerProfileId,
        status: { in: activeStatuses as any },
      },
      include: {
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
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    const activeOrder = activeOrders[0] || null;

    // Order and notification stats
    const [totalOrders, unreadNotificationsCount] = await Promise.all([
      prisma.order.count({ where: { customerProfileId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    // Primary default or latest address
    const defaultAddress =
      user.customerProfile.addresses.find((a) => a.isDefault) ||
      user.customerProfile.addresses[0] ||
      null;

    // Active CMS banners from database
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Promotional coupon offers
    const coupons = [
      {
        code: 'DPARCEL20',
        description: 'Flat 20% OFF on your next delivery',
        discountType: 'PERCENTAGE',
        discountValue: 20,
      },
      {
        code: 'FASTMED',
        description: 'Free Delivery on Pharmacy orders over ₹200',
        discountType: 'FREE_DELIVERY',
        discountValue: 100,
      },
      {
        code: 'GROCERY50',
        description: '₹50 OFF on Supermarket & Mart errands',
        discountType: 'FLAT',
        discountValue: 50,
      },
    ];

    return {
      customer: {
        id: user.customerProfile.id,
        userId: user.id,
        firstName: user.customerProfile.firstName,
        lastName: user.customerProfile.lastName,
        fullName: [user.customerProfile.firstName, user.customerProfile.lastName].filter(Boolean).join(' '),
        email: user.email,
        phone: user.customerProfile.phone,
        profileImage: user.customerProfile.profileImage,
        preferredLanguage: user.customerProfile.preferredLanguage,
        theme: user.customerProfile.theme,
        rating: user.customerProfile.rating,
      },
      activeOrder,
      defaultAddress,
      stats: {
        totalOrders,
        activeOrdersCount: activeOrder ? 1 : 0,
        unreadNotificationsCount,
      },
      banners,
      coupons,
    };
  },
};

export default CustomersService;
