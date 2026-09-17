import api from './api';

export const addressService = {
  /**
   * Get all saved addresses for authenticated customer
   */
  async getAddresses() {
    const response = await api.get('/addresses');
    return response.data?.data || [];
  },

  /**
   * Get a specific address by ID
   */
  async getAddressById(id) {
    const response = await api.get(`/addresses/${id}`);
    return response.data?.data;
  },

  /**
   * Save a new address
   */
  async createAddress(data) {
    const response = await api.post('/addresses', data);
    return response.data?.data;
  },

  /**
   * Update an existing address
   */
  async updateAddress(id, data) {
    const response = await api.patch(`/addresses/${id}`, data);
    return response.data?.data;
  },

  /**
   * Delete an address
   */
  async deleteAddress(id) {
    const response = await api.delete(`/addresses/${id}`);
    return response.data?.data;
  },

  /**
   * Set address as primary default
   */
  async setDefaultAddress(id) {
    const response = await api.patch(`/addresses/${id}/default`);
    return response.data?.data;
  },
};

export default addressService;
