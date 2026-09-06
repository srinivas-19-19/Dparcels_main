import { MapService } from '../../services/map.service';

export const PricingService = {
  calculatePrice(distanceKm: number): { basePrice: number; distancePrice: number; totalAmount: number } {
    const BASE_KM = 3;
    const BASE_PRICE = 39;
    const PER_KM_RATE = 10;

    let totalAmount = BASE_PRICE;
    let distancePrice = 0;

    if (distanceKm > BASE_KM) {
      const extraKm = Math.ceil(distanceKm - BASE_KM);
      distancePrice = extraKm * PER_KM_RATE;
      totalAmount += distancePrice;
    }

    return {
      basePrice: BASE_PRICE,
      distancePrice,
      totalAmount,
    };
  },

  async estimateDelivery(pickupLat: number, pickupLng: number, dropLat: number, dropLng: number, serviceType: string) {
    const { distanceKm, timeMins } = await MapService.calculateDistanceAndETA(pickupLat, pickupLng, dropLat, dropLng);
    
    let { basePrice, distancePrice, totalAmount } = this.calculatePrice(distanceKm);

    if (serviceType === 'EXPRESS') {
       totalAmount = Math.ceil(totalAmount * 1.5);
    }

    return {
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      estimatedTimeMins: timeMins,
      basePrice,
      distancePrice,
      totalAmount,
      serviceType
    };
  }
};
