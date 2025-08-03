import { NextRequest, NextResponse } from 'next/server';
import { fusionService } from '@/lib/fusion';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainId = parseInt(searchParams.get('chainId') || '1');
  const src = searchParams.get('src');
  const dst = searchParams.get('dst');
  const amount = searchParams.get('amount');
  const from = searchParams.get('from');
  const dstChainId = searchParams.get('dstChainId');

  if (!src || !dst || !amount || !from) {
    return NextResponse.json(
      { error: 'Missing required parameters: src, dst, amount, from' },
      { status: 400 }
    );
  }

  try {
    const quote = await fusionService.getQuote({
      fromTokenAddress: src,
      toTokenAddress: dst,
      amount,
      walletAddress: from,
      srcChainId: chainId,
      dstChainId: dstChainId ? parseInt(dstChainId) : undefined,
    });

    return NextResponse.json(quote);
  } catch (error: unknown) {
    console.error('Error fetching Fusion quote:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch Fusion quote' },
      { status: 500 }
    );
  }
}