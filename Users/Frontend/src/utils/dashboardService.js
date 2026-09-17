import api from './api';

export const dashboardService = {
  /**
   * Fetch complete aggregate Home Dashboard data
   */
  async getHomeDashboard() {
    const response = await api.get('/customers/home-dashboard');
    return response.data?.data;
  },

  /**
   * Fetch customer notifications
   */
  async getNotifications() {
    const response = await api.get('/notifications');
    return response.data?.data || [];
  },

  /**
   * Mark a single notification as read
   */
  async markNotificationAsRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data?.data;
  },

  /**
   * Mark all customer notifications as read
   */
  async markAllNotificationsAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data?.data;
  },

  /**
   * Fetch active promotional banners
   */
  async getBanners() {
    try {
      const response = await api.get('/banners');
      return response.data?.data || [];
    } catch (err) {
      console.warn('[dashboardService] Error fetching banners:', err);
      return [];
    }
  },
};

export default dashboardService;
