#!/usr/bin/env node

/**
 * Test script to verify the Fusion signing flow works correctly
 */

const { prepareFusionOrderForSigning } = require('./lib/fusion-signing');

// Mock order data from API response
const mockOrderResponse = {
  "success": true,
  "order": {
    "settlementExtensionContract": {"val": "0x2ad5004c60e16e54d5007c80ce329adde5b51ef5"},
    "fusionExtension": {
      "address": {"val": "0x2ad5004c60e16e54d5007c80ce329adde5b51ef5"},
      "auctionDetails": {
        "startTime": "1754230657",
        "duration": "180",
        "initialRateBump": "1576203",
        "points": [{"delay": 180, "coefficient": 939509}],
        "gasCost": {"gasPriceEstimate": "290", "gasBumpEstimate": "939509"}
      }
    },
    "inner": {
      "maker": {"val": "0x3531491d207c734e288ee2bc18085c62c4a1e3cf"},
      "receiver": {"val": "0x0000000000000000000000000000000000000000"},
      "makerAsset": {"val": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},
      "takerAsset": {"val": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"},
      "makingAmount": "1000000000000000",
      "takingAmount": "3001789",
      "makerTraits": {"value": {"value": "62419173104490761595518734107549925657652999688165707272301585248257444937728"}},
      "_salt": "99011850231338861723625077908873573781728400023531532468239409344930415038714"
    }
  },
  "quoteId": "6b62128b-d180-429f-9037-47ed419e58ba"
};

console.log('🧪 Testing Fusion signing flow...\n');

try {
  // Test order preparation
  console.log('1️⃣ Testing order preparation...');
  const orderForSigning = prepareFusionOrderForSigning(mockOrderResponse.order);
  
  console.log('✅ Order prepared successfully!');
  console.log('📋 Order for signing:', JSON.stringify(orderForSigning, null, 2));
  
  // Validate required fields
  const requiredFields = ['salt', 'maker', 'receiver', 'makerAsset', 'takerAsset', 'makingAmount', 'takingAmount', 'makerTraits'];
  const missingFields = requiredFields.filter(field => !orderForSigning[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  console.log('✅ All required fields present!');
  console.log('\n🎉 Signing flow test completed successfully!');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
