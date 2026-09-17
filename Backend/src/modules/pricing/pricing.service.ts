import { MapService } from '../../services/map.service';

export interface PriceCalculation {
  basePrice: number;
  baseKm: number;
  distancePrice: number;
  extraKm: number;
  perKmRate: number;
  totalAmount: number;
  rateRule: string;
}

export const PricingService = {
  /**
   * Calculates delivery fare:
   * - First 3 km: ₹39 flat base fare
   * - Beyond 3 km: ₹10 for every extra started 1 km (ceil billing)
   * Applies uniformly across all service types.
   */
  calculatePrice(distanceKm: number): PriceCalculation {
    const BASE_KM = 3;
    const BASE_PRICE = 39;
    const PER_KM_RATE = 10;

    const sanitizedDistance = Math.max(0, Number(distanceKm) || 0);

    let distancePrice = 0;
    let extraKm = 0;

    if (sanitizedDistance > BASE_KM) {
      extraKm = Math.ceil(sanitizedDistance - BASE_KM);
      distancePrice = extraKm * PER_KM_RATE;
    }

    const totalAmount = BASE_PRICE + distancePrice;

    return {
      basePrice: BASE_PRICE,
      baseKm: BASE_KM,
      distancePrice,
      extraKm,
      perKmRate: PER_KM_RATE,
      totalAmount,
      rateRule: '₹39 for first 3 km + ₹10 for each extra 1 km',
    };
  },

  async estimateDelivery(
    pickupLat: number,
    pickupLng: number,
    dropLat: number,
    dropLng: number,
    serviceType?: string
  ) {
    const { distanceKm, timeMins } = await MapService.calculateDistanceAndETA(
      pickupLat,
      pickupLng,
      dropLat,
      dropLng
    );

    const priceDetails = this.calculatePrice(distanceKm);

    return {
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      estimatedTimeMins: timeMins,
      ...priceDetails,
      serviceType: serviceType || 'STANDARD',
    };
  },
};

