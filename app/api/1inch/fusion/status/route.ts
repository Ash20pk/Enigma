import { NextRequest, NextResponse } from 'next/server';
import { fusionService } from '@/lib/fusion';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderHash = searchParams.get('orderHash');
  const chainId = parseInt(searchParams.get('chainId') || '1');

  if (!orderHash) {
    return NextResponse.json(
      { error: 'Missing required parameter: orderHash' },
      { status: 400 }
    );
  }

  try {
    const status = await fusionService.getOrderStatus(orderHash, chainId);
    return NextResponse.json(status);
  } catch (error: unknown) {
    console.error('Error fetching order status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch order status' },
      { status: 500 }
    );
  }
}