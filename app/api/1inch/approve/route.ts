import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_URL = 'https://api.1inch.dev';
const API_KEY = process.env.ONEINCH_API_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId') || '1';
  const tokenAddress = searchParams.get('tokenAddress');
  const amount = searchParams.get('amount');

  if (!tokenAddress) {
    return NextResponse.json(
      { error: 'Missing required parameter: tokenAddress' },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      tokenAddress,
      ...(amount && { amount }),
    });

    const response = await fetch(
      `${ONEINCH_API_URL}/swap/v6.0/${chainId}/approve/transaction?${params}`,
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
    console.error('Error fetching approve transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approve transaction' },
      { status: 500 }
    );
  }
}
