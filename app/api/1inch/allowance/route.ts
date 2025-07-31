import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_URL = 'https://api.1inch.dev';
const API_KEY = process.env.ONEINCH_API_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId') || '1';
  const tokenAddress = searchParams.get('tokenAddress');
  const walletAddress = searchParams.get('walletAddress');

  if (!tokenAddress || !walletAddress) {
    return NextResponse.json(
      { error: 'Missing required parameters: tokenAddress, walletAddress' },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      tokenAddress,
      walletAddress,
    });

    const response = await fetch(
      `${ONEINCH_API_URL}/swap/v6.0/${chainId}/approve/allowance?${params}`,
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
    console.error('Error fetching allowance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allowance' },
      { status: 500 }
    );
  }
}
