import { Client } from '@googlemaps/google-maps-services-js';
import { env } from '../config/env';

const client = new Client({});

export const MapService = {
  async calculateDistanceAndETA(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ) {
    try {
      const response = await client.distancematrix({
        params: {
          origins: [{ lat: originLat, lng: originLng }],
          destinations: [{ lat: destLat, lng: destLng }],
          key: env.GOOGLE_MAPS_API_KEY,
        },
      });

      const element = response.data.rows[0].elements[0];

      if (element.status !== 'OK') {
        throw new Error(`Google Maps Distance Matrix Error: ${element.status}`);
      }

      const distanceKm = element.distance.value / 1000;
      const timeMins = Math.ceil(element.duration.value / 60);

      return { distanceKm, timeMins };
    } catch (error) {
      console.error('[MapService] Error calculating distance:', error);
      throw new Error('Failed to calculate distance');
    }
  },
};
