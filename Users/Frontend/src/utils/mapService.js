import api from './api';

export const mapService = {
  /**
   * Places Autocomplete via Backend Google Maps API
   */
  async autocomplete(input) {
    if (!input || input.trim().length < 2) return [];
    try {
      const response = await api.get('/maps/autocomplete', {
        params: { input: input.trim() },
      });
      return response.data?.data || [];
    } catch (err) {
      console.warn('[mapService] Autocomplete error:', err);
      return [];
    }
  },

  /**
   * Place Details (coordinates & components) from Google Place ID
   */
  async getPlaceDetails(placeId) {
    const response = await api.get('/maps/place-details', {
      params: { placeId },
    });
    return response.data?.data;
  },

  /**
   * Geocode human address string to coordinates
   */
  async geocode(address) {
    const response = await api.get('/maps/geocode', {
      params: { address },
    });
    return response.data?.data;
  },

  /**
   * Reverse Geocode coordinates to human readable address
   */
  async reverseGeocode(lat, lng) {
    try {
      const response = await api.get('/maps/reverse-geocode', {
        params: { lat, lng },
      });
      return response.data?.data;
    } catch (err) {
      console.warn('[mapService] Reverse geocode error:', err);
      return null;
    }
  },

  /**
   * Calculate Road Distance & ETA between coordinates
   */
  async getDistanceAndETA(originLat, originLng, destLat, destLng) {
    const response = await api.get('/maps/distance', {
      params: { originLat, originLng, destLat, destLng },
    });
    return response.data?.data;
  },
};

export default mapService;
