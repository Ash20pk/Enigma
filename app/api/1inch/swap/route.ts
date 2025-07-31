import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_URL = 'https://api.1inch.dev';
const API_KEY = process.env.ONEINCH_API_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId') || '1';
  const src = searchParams.get('src');
  const dst = searchParams.get('dst');
  const amount = searchParams.get('amount');
  const from = searchParams.get('from');
  const slippage = searchParams.get('slippage') || '1';

  if (!src || !dst || !amount || !from) {
    return NextResponse.json(
      { error: 'Missing required parameters: src, dst, amount, from' },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      src,
      dst,
      amount,
      from,
      slippage,
      includeTokensInfo: 'true',
      includeProtocols: 'true',
      includeGas: 'true',
    });

    const response = await fetch(
      `${ONEINCH_API_URL}/swap/v6.0/${chainId}/swap?${params}`,
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
    console.error('Error fetching swap:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swap' },
      { status: 500 }
    );
  }
}
