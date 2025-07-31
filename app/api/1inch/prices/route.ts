import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_URL = 'https://api.1inch.dev';
const API_KEY = process.env.ONEINCH_API_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId') || '1';
  const addresses = searchParams.get('addresses');
  const currency = searchParams.get('currency') || 'USD';

  if (!addresses) {
    return NextResponse.json(
      { error: 'Missing required parameter: addresses' },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      addresses,
      currency,
    });

    const response = await fetch(
      `${ONEINCH_API_URL}/price/v1.1/${chainId}?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}
