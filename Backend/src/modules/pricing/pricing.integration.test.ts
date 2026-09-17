import express from 'express';
import http from 'http';
import pricingRoutes from './pricing.routes';
import { PricingService } from './pricing.service';

async function runPricingIntegrationTests() {
  console.log('\n==================================================');
  console.log('🧪 DPARCELS FARE ESTIMATION & PRICING SUITE');
  console.log('Rule: ₹39 for first 3 km + ₹10 for each extra 1 km (Slab/Ceil)');
  console.log('==================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, description: string) {
    totalCount++;
    if (condition) {
      console.log(`  ✅ PASS [${totalCount}]: ${description}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL [${totalCount}]: ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    }
  }

  // ----------------------------------------------------
  // 1. UNIT TIER CALCULATIONS VIA PricingService.calculatePrice
  // ----------------------------------------------------
  console.log('--- 1. Pure Pricing Service Tier Calculations ---');

  // Test 1: Zero km
  const price0 = PricingService.calculatePrice(0);
  assert(price0.basePrice === 39, '0 km: basePrice is 39');
  assert(price0.extraKm === 0, '0 km: extraKm is 0');
  assert(price0.distancePrice === 0, '0 km: distancePrice is 0');
  assert(price0.totalAmount === 39, '0 km: totalAmount is 39');

  // Test 2: Short delivery (1.5 km - well under 3km)
  const price1_5 = PricingService.calculatePrice(1.5);
  assert(price1_5.basePrice === 39, '1.5 km: basePrice is 39');
  assert(price1_5.extraKm === 0, '1.5 km: extraKm is 0');
  assert(price1_5.distancePrice === 0, '1.5 km: distancePrice is 0');
  assert(price1_5.totalAmount === 39, '1.5 km: totalAmount is 39');

  // Test 3: Exactly 3.0 km (boundary condition)
  const price3_0 = PricingService.calculatePrice(3.0);
  assert(price3_0.basePrice === 39, '3.0 km: basePrice is 39');
  assert(price3_0.extraKm === 0, '3.0 km: extraKm is 0');
  assert(price3_0.distancePrice === 0, '3.0 km: distancePrice is 0');
  assert(price3_0.totalAmount === 39, '3.0 km: totalAmount is 39');

  // Test 4: 3.1 km (just over 3km -> 1 extra km started)
  const price3_1 = PricingService.calculatePrice(3.1);
  assert(price3_1.basePrice === 39, '3.1 km: basePrice is 39');
  assert(price3_1.extraKm === 1, '3.1 km: extraKm is 1');
  assert(price3_1.distancePrice === 10, '3.1 km: distancePrice is 10 (1 x 10)');
  assert(price3_1.totalAmount === 49, '3.1 km: totalAmount is 49 (39 + 10)');

  // Test 5: Exactly 4.0 km (end of 1st extra km slab)
  const price4_0 = PricingService.calculatePrice(4.0);
  assert(price4_0.basePrice === 39, '4.0 km: basePrice is 39');
  assert(price4_0.extraKm === 1, '4.0 km: extraKm is 1');
  assert(price4_0.distancePrice === 10, '4.0 km: distancePrice is 10');
  assert(price4_0.totalAmount === 49, '4.0 km: totalAmount is 49');

  // Test 6: 4.5 km (user example -> rounds to 2 extra km)
  const price4_5 = PricingService.calculatePrice(4.5);
  assert(price4_5.basePrice === 39, '4.5 km: basePrice is 39');
  assert(price4_5.extraKm === 2, '4.5 km: extraKm is 2');
  assert(price4_5.distancePrice === 20, '4.5 km: distancePrice is 20 (2 x 10)');
  assert(price4_5.totalAmount === 59, '4.5 km: totalAmount is 59 (39 + 20)');

  // Test 7: Exactly 5.0 km (end of 2nd extra km slab)
  const price5_0 = PricingService.calculatePrice(5.0);
  assert(price5_0.extraKm === 2, '5.0 km: extraKm is 2');
  assert(price5_0.distancePrice === 20, '5.0 km: distancePrice is 20');
  assert(price5_0.totalAmount === 59, '5.0 km: totalAmount is 59');

  // Test 8: 8.2 km (8.2 - 3 = 5.2 -> ceil is 6 extra km)
  const price8_2 = PricingService.calculatePrice(8.2);
  assert(price8_2.extraKm === 6, '8.2 km: extraKm is 6');
  assert(price8_2.distancePrice === 60, '8.2 km: distancePrice is 60 (6 x 10)');
  assert(price8_2.totalAmount === 99, '8.2 km: totalAmount is 99 (39 + 60)');

  // Test 9: 10.0 km (10 - 3 = 7 extra km)
  const price10 = PricingService.calculatePrice(10.0);
  assert(price10.extraKm === 7, '10.0 km: extraKm is 7');
  assert(price10.distancePrice === 70, '10.0 km: distancePrice is 70');
  assert(price10.totalAmount === 109, '10.0 km: totalAmount is 109');

  // Test 10: Negative distance gracefully treated as 0
  const priceNeg = PricingService.calculatePrice(-5);
  assert(priceNeg.totalAmount === 39, 'Negative distance safely falls back to basePrice 39');

  // ----------------------------------------------------
  // 2. HTTP ENDPOINT TESTS VIA POST /api/v1/pricing/estimate
  // ----------------------------------------------------
  console.log('\n--- 2. HTTP Pricing Estimation Endpoint ---');

  const app = express();
  app.use(express.json());
  app.use('/api/v1/pricing', pricingRoutes);

  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal test error',
    });
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // Test 11: Missing body rejected with 400
    const emptyRes = await fetch(`${baseUrl}/api/v1/pricing/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(emptyRes.status === 400, 'POST /pricing/estimate without payload rejected with 400');

    // Test 12: Invalid latitude rejected with 400
    const badLatRes = await fetch(`${baseUrl}/api/v1/pricing/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickupLat: 195, // out of range
        pickupLng: 78.4357,
        dropLat: 17.4435,
        dropLng: 78.3772,
      }),
    });
    assert(badLatRes.status === 400, 'POST /pricing/estimate with invalid latitude rejected with 400');

    // Test 13: Standard delivery estimation
    // Banjara Hills (17.4156, 78.4357) to Jubilee Hills (17.4319, 78.4073) ~4km
    const stdRes = await fetch(`${baseUrl}/api/v1/pricing/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickupLat: 17.4156,
        pickupLng: 78.4357,
        dropLat: 17.4319,
        dropLng: 78.4073,
        serviceType: 'STANDARD',
      }),
    });
    const stdData = await stdRes.json();
    assert(stdRes.status === 200, 'POST /pricing/estimate returns 200');
    assert(stdData.success === true, 'Response success is true');
    assert(stdData.data.basePrice === 39, 'basePrice is 39');
    assert(typeof stdData.data.distanceKm === 'number', 'distanceKm is numeric');
    assert(typeof stdData.data.estimatedTimeMins === 'number', 'estimatedTimeMins is numeric');
    assert(typeof stdData.data.totalAmount === 'number', 'totalAmount is numeric');
    assert(
      stdData.data.totalAmount === stdData.data.basePrice + stdData.data.distancePrice,
      'totalAmount equals basePrice + distancePrice'
    );

    // Test 14: Uniform flat pricing for EXPRESS / Medicine (No hidden surge)
    const expRes = await fetch(`${baseUrl}/api/v1/pricing/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickupLat: 17.4156,
        pickupLng: 78.4357,
        dropLat: 17.4319,
        dropLng: 78.4073,
        serviceType: 'EXPRESS',
      }),
    });
    const expData = await expRes.json();
    assert(expRes.status === 200, 'POST /pricing/estimate for EXPRESS returns 200');
    assert(
      expData.data.totalAmount === stdData.data.totalAmount,
      'EXPRESS service receives same uniform flat pricing (no arbitrary 1.5x surge)'
    );

    // Test 15: Response includes transparent rateRule description
    assert(
      stdData.data.rateRule === '₹39 for first 3 km + ₹10 for each extra 1 km',
      'Returns transparent rateRule description'
    );
  } finally {
    server.close();
  }

  console.log('\n==================================================');
  console.log(`🎉 ALL ${passedCount}/${totalCount} PRICING INTEGRATION TESTS PASSED!`);
  console.log('==================================================\n');
}

runPricingIntegrationTests().catch((err) => {
  console.error('\n❌ PRICING INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
