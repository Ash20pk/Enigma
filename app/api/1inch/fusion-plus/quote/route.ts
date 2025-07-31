import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_URL = 'https://api.1inch.dev';
const API_KEY = process.env.ONEINCH_API_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const srcChainId = searchParams.get('srcChainId');
  const dstChainId = searchParams.get('dstChainId');
  const src = searchParams.get('src');
  const dst = searchParams.get('dst');
  const amount = searchParams.get('amount');
  const from = searchParams.get('from');

  if (!srcChainId || !dstChainId || !src || !dst || !amount || !from) {
    return NextResponse.json(
      { error: 'Missing required parameters: srcChainId, dstChainId, src, dst, amount, from' },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      srcChainId,
      dstChainId,
      src,
      dst,
      amount,
      from,
      enableEstimate: 'true',
      includeTokensInfo: 'true',
    });

    const response = await fetch(
      `${ONEINCH_API_URL}/fusion-plus/quoter/v1.0/quote/receive?${params}`,
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
    console.error('Error fetching Fusion+ quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Fusion+ cross-chain quote' },
      { status: 500 }
    );
  }
}
