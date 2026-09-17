import prisma from '../../utils/prisma';
import { CreateAddressInput, UpdateAddressInput } from './addresses.schema';

export class AddressServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AddressServiceError';
    this.statusCode = statusCode;
  }
}

export const AddressesService = {
  /**
   * Helper to retrieve or ensure customer profile exists for user
   */
  async getCustomerProfile(userId: string) {
    let profile = await prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.customerProfile.create({
        data: {
          userId,
          firstName: 'Customer',
          lastName: '',
          preferredLanguage: 'en',
          theme: 'dark',
        },
      });
    }

    return profile;
  },

  /**
   * Get all saved addresses for the authenticated customer
   */
  async getAddresses(userId: string) {
    const profile = await this.getCustomerProfile(userId);

    const addresses = await prisma.address.findMany({
      where: { customerProfileId: profile.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses;
  },

  /**
   * Get a specific address by ID with tenant isolation check
   */
  async getAddressById(userId: string, id: string) {
    const profile = await this.getCustomerProfile(userId);

    const address = await prisma.address.findFirst({
      where: {
        id,
        customerProfileId: profile.id,
      },
    });

    if (!address) {
      throw new AddressServiceError('Address not found', 404);
    }

    return address;
  },

  /**
   * Save a new address for the customer
   */
  async createAddress(userId: string, data: CreateAddressInput) {
    const profile = await this.getCustomerProfile(userId);

    const existingCount = await prisma.address.count({
      where: { customerProfileId: profile.id },
    });

    // If it's the customer's first address or requested as default, make it default
    const shouldBeDefault = existingCount === 0 || Boolean(data.isDefault);

    if (shouldBeDefault && existingCount > 0) {
      await prisma.address.updateMany({
        where: { customerProfileId: profile.id },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        customerProfileId: profile.id,
        label: data.label.trim(),
        streetAddress: data.streetAddress.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        postalCode: data.postalCode.trim(),
        country: data.country ? data.country.trim() : 'India',
        latitude: data.latitude,
        longitude: data.longitude,
        providerPlaceId: data.providerPlaceId || null,
        isDefault: shouldBeDefault,
      },
    });

    return newAddress;
  },

  /**
   * Update an existing address with tenant isolation
   */
  async updateAddress(userId: string, id: string, data: UpdateAddressInput) {
    const profile = await this.getCustomerProfile(userId);

    // Verify ownership
    await this.getAddressById(userId, id);

    if (data.isDefault === true) {
      await prisma.address.updateMany({
        where: { customerProfileId: profile.id },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (data.label !== undefined) updateData.label = data.label.trim();
    if (data.streetAddress !== undefined) updateData.streetAddress = data.streetAddress.trim();
    if (data.city !== undefined) updateData.city = data.city.trim();
    if (data.state !== undefined) updateData.state = data.state.trim();
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode.trim();
    if (data.country !== undefined) updateData.country = data.country.trim();
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.providerPlaceId !== undefined) updateData.providerPlaceId = data.providerPlaceId;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    const updated = await prisma.address.update({
      where: { id },
      data: updateData,
    });

    return updated;
  },

  /**
   * Delete an address with tenant isolation
   */
  async deleteAddress(userId: string, id: string) {
    const profile = await this.getCustomerProfile(userId);
    const existing = await this.getAddressById(userId, id);

    await prisma.address.delete({
      where: { id },
    });

    // If the deleted address was default, promote the newest remaining address
    if (existing.isDefault) {
      const remaining = await prisma.address.findFirst({
        where: { customerProfileId: profile.id },
        orderBy: { createdAt: 'desc' },
      });

      if (remaining) {
        await prisma.address.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }

    return { id, message: 'Address deleted successfully' };
  },

  /**
   * Set a specific address as default
   */
  async setDefaultAddress(userId: string, id: string) {
    const profile = await this.getCustomerProfile(userId);

    // Verify ownership
    await this.getAddressById(userId, id);

    await prisma.address.updateMany({
      where: { customerProfileId: profile.id },
      data: { isDefault: false },
    });

    const updated = await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    return updated;
  },
};

export default AddressesService;
