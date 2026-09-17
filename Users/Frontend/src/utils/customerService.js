import api from './api';

export const customerService = {
  /**
   * Fetch authenticated customer's profile
   */
  async getProfile() {
    const response = await api.get('/customers/me');
    return response.data?.data;
  },

  /**
   * Update authenticated customer's profile
   * @param {Object} data - { name, firstName, lastName, phone, preferredLanguage, theme }
   */
  async updateProfile(data) {
    const response = await api.patch('/customers/me', data);
    return response.data?.data;
  },

  /**
   * Upload avatar to Supabase Storage via backend
   * @param {File} file
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/customers/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data;
  },

  /**
   * Delete customer avatar from Supabase Storage
   */
  async deleteAvatar() {
    const response = await api.delete('/customers/me/avatar');
    return response.data?.data;
  },
};

export default customerService;
