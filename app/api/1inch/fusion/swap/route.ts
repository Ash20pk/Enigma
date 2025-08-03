import { NextRequest, NextResponse } from 'next/server';
import { fusionService } from '@/lib/fusion';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      chainId = 1,
      src,
      dst,
      amount,
      from,
      receiver,
      permit,
      dstChainId
    } = body;

    if (!src || !dst || !amount || !from) {
      return NextResponse.json(
        { error: 'Missing required parameters: src, dst, amount, from' },
        { status: 400 }
      );
    }

    // Create the order
    const orderResponse = await fusionService.createOrder({
      fromTokenAddress: src,
      toTokenAddress: dst,
      amount,
      walletAddress: from,
      receiver: receiver || from,
      permit,
      srcChainId: chainId,
      dstChainId,
    });

    // Submit the order
    const orderHash = await fusionService.submitOrder(
      orderResponse.order,
      orderResponse.quoteId,
      chainId
    );

    return NextResponse.json({
      orderHash,
      order: orderResponse.order,
      quoteId: orderResponse.quoteId,
    });
  } catch (error: unknown) {
    console.error('Error submitting Fusion order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit Fusion order' },
      { status: 500 }
    );
  }
}
