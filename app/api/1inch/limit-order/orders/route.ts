import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_URL = 'https://api.1inch.dev';
const API_KEY = process.env.ONEINCH_API_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId') || '1';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '100';
  const statuses = searchParams.get('statuses');
  const makerAsset = searchParams.get('makerAsset');
  const takerAsset = searchParams.get('takerAsset');
  const maker = searchParams.get('maker');
  const taker = searchParams.get('taker');

  try {
    const params = new URLSearchParams({
      page,
      limit,
      ...(statuses && { statuses }),
      ...(makerAsset && { makerAsset }),
      ...(takerAsset && { takerAsset }),
      ...(maker && { maker }),
      ...(taker && { taker }),
    });

    const response = await fetch(
      `${ONEINCH_API_URL}/orderbook/v4.0/${chainId}/order/all?${params}`,
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
    console.error('Error fetching limit orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch limit orders' },
      { status: 500 }
    );
  }
}
