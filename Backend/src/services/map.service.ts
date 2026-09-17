import { Client } from '@googlemaps/google-maps-services-js';
import { env } from '../config/env';

const client = new Client({});

/**
 * Built-in fallback database of popular locations for testing and offline resilience
 */
const KNOWN_LOCATIONS = [
  {
    placeId: 'loc_banjara_hills',
    description: 'Banjara Hills, Hyderabad, Telangana, India',
    mainText: 'Banjara Hills',
    secondaryText: 'Hyderabad, Telangana, India',
    lat: 17.4156,
    lng: 78.4357,
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500034',
    country: 'India',
  },
  {
    placeId: 'loc_hitech_city',
    description: 'Hitech City, Hyderabad, Telangana, India',
    mainText: 'Hitech City',
    secondaryText: 'Hyderabad, Telangana, India',
    lat: 17.4435,
    lng: 78.3772,
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500081',
    country: 'India',
  },
  {
    placeId: 'loc_jubilee_hills',
    description: 'Jubilee Hills, Hyderabad, Telangana, India',
    mainText: 'Jubilee Hills',
    secondaryText: 'Hyderabad, Telangana, India',
    lat: 17.4319,
    lng: 78.4073,
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500033',
    country: 'India',
  },
  {
    placeId: 'loc_gachibowli',
    description: 'Gachibowli, Hyderabad, Telangana, India',
    mainText: 'Gachibowli',
    secondaryText: 'Hyderabad, Telangana, India',
    lat: 17.4401,
    lng: 78.3489,
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500032',
    country: 'India',
  },
  {
    placeId: 'loc_madhapur',
    description: 'Madhapur, Hyderabad, Telangana, India',
    mainText: 'Madhapur',
    secondaryText: 'Hyderabad, Telangana, India',
    lat: 17.4483,
    lng: 78.3915,
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500081',
    country: 'India',
  },
  {
    placeId: 'loc_kondapur',
    description: 'Kondapur, Hyderabad, Telangana, India',
    mainText: 'Kondapur',
    secondaryText: 'Hyderabad, Telangana, India',
    lat: 17.4699,
    lng: 78.3578,
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500084',
    country: 'India',
  },
  {
    placeId: 'loc_secunderabad',
    description: 'Secunderabad Railway Station, Secunderabad, Telangana, India',
    mainText: 'Secunderabad',
    secondaryText: 'Telangana, India',
    lat: 17.4399,
    lng: 78.5017,
    city: 'Secunderabad',
    state: 'Telangana',
    postalCode: '500003',
    country: 'India',
  },
  {
    placeId: 'loc_charminar',
    description: 'Charminar, Old City, Hyderabad, Telangana, India',
    mainText: 'Charminar',
    secondaryText: 'Hyderabad, Telangana, India',
    lat: 17.3616,
    lng: 78.4747,
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500002',
    country: 'India',
  },
  {
    placeId: 'loc_koramangala_blr',
    description: 'Koramangala, Bengaluru, Karnataka, India',
    mainText: 'Koramangala',
    secondaryText: 'Bengaluru, Karnataka, India',
    lat: 12.9352,
    lng: 77.6245,
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560034',
    country: 'India',
  },
  {
    placeId: 'loc_indiranagar_blr',
    description: 'Indiranagar, Bengaluru, Karnataka, India',
    mainText: 'Indiranagar',
    secondaryText: 'Bengaluru, Karnataka, India',
    lat: 12.9784,
    lng: 77.6408,
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    country: 'India',
  },
  {
    placeId: 'loc_t_nagar_chn',
    description: 'T. Nagar, Chennai, Tamil Nadu, India',
    mainText: 'T. Nagar',
    secondaryText: 'Chennai, Tamil Nadu, India',
    lat: 13.0418,
    lng: 80.2341,
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600017',
    country: 'India',
  },
  {
    placeId: 'loc_connaught_place_del',
    description: 'Connaught Place, New Delhi, Delhi, India',
    mainText: 'Connaught Place',
    secondaryText: 'New Delhi, Delhi, India',
    lat: 28.6315,
    lng: 77.2167,
    city: 'New Delhi',
    state: 'Delhi',
    postalCode: '110001',
    country: 'India',
  },
];

/**
 * Calculates geodesic distance via Haversine formula and estimates urban road ETA.
 */
function calculateHaversineDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
) {
  const R = 6371; // Earth radius in km
  const dLat = ((destLat - originLat) * Math.PI) / 180;
  const dLon = ((destLng - originLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((originLat * Math.PI) / 180) *
      Math.cos((destLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistanceKm = R * c;

  // Account for urban road winding factor (~1.35x crow-flies distance)
  const distanceKm = Math.max(0.5, parseFloat((straightDistanceKm * 1.35).toFixed(2)));

  // Average city traffic speed ~25 km/h + 5 min dispatch/pickup buffer
  const timeMins = Math.max(10, Math.ceil((distanceKm / 25) * 60 + 5));

  return {
    distanceKm,
    distanceMeters: Math.round(distanceKm * 1000),
    distanceText: `${distanceKm} km`,
    timeMins,
    durationMinutes: timeMins,
    durationSeconds: timeMins * 60,
    durationText: `${timeMins} mins`,
  };
}

function hasValidApiKey(): boolean {
  return Boolean(
    env.GOOGLE_MAPS_API_KEY &&
      env.GOOGLE_MAPS_API_KEY !== 'mock-api-key' &&
      env.GOOGLE_MAPS_API_KEY !== 'mock-google-maps-key'
  );
}

export const MapService = {
  /**
   * Places Autocomplete: Returns suggested places matching query
   */
  async getPlaceAutocomplete(input: string) {
    if (!input || input.trim().length < 2) {
      return [];
    }

    const cleanInput = input.trim();

    if (hasValidApiKey()) {
      try {
        const response = await client.placeAutocomplete({
          params: {
            input: cleanInput,
            key: env.GOOGLE_MAPS_API_KEY!,
            components: ['country:in'],
          },
        });

        if (response.data.status === 'OK' && response.data.predictions) {
          return response.data.predictions.map((p) => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting?.main_text || p.description,
            secondaryText: p.structured_formatting?.secondary_text || '',
          }));
        }
      } catch (err: any) {
        console.warn('[MapService] Google Places Autocomplete error, falling back:', err.message);
      }
    }

    // Resilient Fallback Matching
    const lower = cleanInput.toLowerCase();
    const matches = KNOWN_LOCATIONS.filter(
      (loc) =>
        loc.description.toLowerCase().includes(lower) ||
        loc.mainText.toLowerCase().includes(lower) ||
        loc.city.toLowerCase().includes(lower)
    );

    if (matches.length > 0) {
      return matches.map((m) => ({
        placeId: m.placeId,
        description: m.description,
        mainText: m.mainText,
        secondaryText: m.secondaryText,
      }));
    }

    // Default dynamic fallback if no match found
    return [
      {
        placeId: `gen_${Date.now()}`,
        description: `${cleanInput}, Hyderabad, Telangana, India`,
        mainText: cleanInput,
        secondaryText: 'Hyderabad, Telangana, India',
      },
    ];
  },

  /**
   * Place Details: Returns full coordinates & components for a given placeId
   */
  async getPlaceDetails(placeId: string) {
    if (hasValidApiKey()) {
      try {
        const response = await client.placeDetails({
          params: {
            place_id: placeId,
            key: env.GOOGLE_MAPS_API_KEY!,
            fields: ['formatted_address', 'geometry', 'address_components'],
          },
        });

        const result = response.data.result;
        if (result && result.geometry?.location) {
          const lat = result.geometry.location.lat;
          const lng = result.geometry.location.lng;
          const address = result.formatted_address || '';

          let city = 'Hyderabad';
          let state = 'Telangana';
          let postalCode = '500081';
          let country = 'India';

          result.address_components?.forEach((comp) => {
            const types = comp.types as string[];
            if (types.includes('locality')) city = comp.long_name;
            if (types.includes('administrative_area_level_1')) state = comp.long_name;
            if (types.includes('postal_code')) postalCode = comp.long_name;
            if (types.includes('country')) country = comp.long_name;
          });

          return {
            placeId,
            address,
            formattedAddress: address,
            streetAddress: address.split(',')[0] || address,
            lat,
            lng,
            city,
            state,
            postalCode,
            country,
          };
        }
      } catch (err: any) {
        console.warn('[MapService] Place Details error, falling back:', err.message);
      }
    }

    // Fallback search
    const found = KNOWN_LOCATIONS.find((loc) => loc.placeId === placeId);
    if (found) {
      return {
        placeId: found.placeId,
        address: found.description,
        formattedAddress: found.description,
        streetAddress: found.mainText,
        lat: found.lat,
        lng: found.lng,
        city: found.city,
        state: found.state,
        postalCode: found.postalCode,
        country: found.country,
      };
    }

    // Generic fallback
    return {
      placeId,
      address: 'Banjara Hills, Hyderabad, Telangana, India',
      formattedAddress: 'Banjara Hills, Hyderabad, Telangana, India',
      streetAddress: 'Banjara Hills',
      lat: 17.4156,
      lng: 78.4357,
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500034',
      country: 'India',
    };
  },

  /**
   * Geocode Address string to coordinates
   */
  async geocodeAddress(address: string) {
    if (hasValidApiKey()) {
      try {
        const response = await client.geocode({
          params: {
            address,
            key: env.GOOGLE_MAPS_API_KEY!,
          },
        });

        const result = response.data.results?.[0];
        if (result && result.geometry?.location) {
          const lat = result.geometry.location.lat;
          const lng = result.geometry.location.lng;

          let city = 'Hyderabad';
          let state = 'Telangana';
          let postalCode = '500081';
          let country = 'India';

          result.address_components?.forEach((comp) => {
            const types = comp.types as string[];
            if (types.includes('locality')) city = comp.long_name;
            if (types.includes('administrative_area_level_1')) state = comp.long_name;
            if (types.includes('postal_code')) postalCode = comp.long_name;
            if (types.includes('country')) country = comp.long_name;
          });

          return {
            address: result.formatted_address,
            formattedAddress: result.formatted_address,
            streetAddress: address.split(',')[0] || address,
            lat,
            lng,
            city,
            state,
            postalCode,
            country,
            placeId: result.place_id,
          };
        }
      } catch (err: any) {
        console.warn('[MapService] Geocode error, falling back:', err.message);
      }
    }

    // Fallback matching
    const lower = address.toLowerCase();
    const match = KNOWN_LOCATIONS.find((loc) => lower.includes(loc.mainText.toLowerCase()));
    if (match) {
      return {
        address: match.description,
        formattedAddress: match.description,
        streetAddress: match.mainText,
        lat: match.lat,
        lng: match.lng,
        city: match.city,
        state: match.state,
        postalCode: match.postalCode,
        country: match.country,
        placeId: match.placeId,
      };
    }

    return {
      address,
      formattedAddress: address,
      streetAddress: address.split(',')[0] || address,
      lat: 17.4156,
      lng: 78.4357,
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500034',
      country: 'India',
      placeId: 'loc_fallback',
    };
  },

  /**
   * Reverse Geocode coordinates to human readable address
   */
  async reverseGeocode(lat: number, lng: number) {
    if (hasValidApiKey()) {
      try {
        const response = await client.reverseGeocode({
          params: {
            latlng: { lat, lng },
            key: env.GOOGLE_MAPS_API_KEY!,
          },
        });

        const result = response.data.results?.[0];
        if (result) {
          let city = 'Hyderabad';
          let state = 'Telangana';
          let postalCode = '500081';
          let country = 'India';

          result.address_components?.forEach((comp) => {
            const types = comp.types as string[];
            if (types.includes('locality')) city = comp.long_name;
            if (types.includes('administrative_area_level_1')) state = comp.long_name;
            if (types.includes('postal_code')) postalCode = comp.long_name;
            if (types.includes('country')) country = comp.long_name;
          });

          return {
            address: result.formatted_address,
            formattedAddress: result.formatted_address,
            streetAddress: result.formatted_address.split(',')[0] || result.formatted_address,
            lat,
            lng,
            city,
            state,
            postalCode,
            country,
            placeId: result.place_id,
          };
        }
      } catch (err: any) {
        console.warn('[MapService] Reverse Geocode error, falling back:', err.message);
      }
    }

    // Find nearest known location in fallback DB
    let closest = KNOWN_LOCATIONS[0];
    let minDistance = Infinity;

    for (const loc of KNOWN_LOCATIONS) {
      const d = calculateHaversineDistance(lat, lng, loc.lat, loc.lng).distanceKm;
      if (d < minDistance) {
        minDistance = d;
        closest = loc;
      }
    }

    return {
      address: closest.description,
      formattedAddress: closest.description,
      streetAddress: closest.mainText,
      lat,
      lng,
      city: closest.city,
      state: closest.state,
      postalCode: closest.postalCode,
      country: closest.country,
      placeId: closest.placeId,
    };
  },

  /**
   * Calculate Distance and ETA between two locations
   */
  async calculateDistanceAndETA(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ) {
    if (!hasValidApiKey()) {
      return calculateHaversineDistance(originLat, originLng, destLat, destLng);
    }

    try {
      const response = await client.distancematrix({
        params: {
          origins: [{ lat: originLat, lng: originLng }],
          destinations: [{ lat: destLat, lng: destLng }],
          key: env.GOOGLE_MAPS_API_KEY!,
        },
      });

      const element = response.data.rows?.[0]?.elements?.[0];

      if (element && element.status === 'OK') {
        const distanceKm = parseFloat((element.distance.value / 1000).toFixed(2));
        const timeMins = Math.ceil(element.duration.value / 60);
        return {
          distanceKm,
          distanceMeters: element.distance.value,
          distanceText: element.distance.text || `${distanceKm} km`,
          timeMins,
          durationMinutes: timeMins,
          durationSeconds: element.duration.value,
          durationText: element.duration.text || `${timeMins} mins`,
        };
      }

      return calculateHaversineDistance(originLat, originLng, destLat, destLng);
    } catch (error: any) {
      console.warn('[MapService] Google Maps Matrix API error, using Haversine calculation fallback:', error?.message || error);
      return calculateHaversineDistance(originLat, originLng, destLat, destLng);
    }
  },
};

export default MapService;
