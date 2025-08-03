import { NextRequest, NextResponse } from 'next/server';
import { fusionService } from '@/lib/fusion';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      chainId = 1,
      fromTokenAddress,
      toTokenAddress,
      amount,
      walletAddress,
      receiver,
      permit,
      dstChainId,
      // Legacy parameter names for backward compatibility
      src,
      dst,
      from
    } = body;

    // Use new parameter names or fall back to legacy ones
    const srcToken = fromTokenAddress || src;
    const dstToken = toTokenAddress || dst;
    const wallet = walletAddress || from;

    if (!srcToken || !dstToken || !amount || !wallet) {
      return NextResponse.json(
        { error: 'Missing required parameters: fromTokenAddress, toTokenAddress, amount, walletAddress' },
        { status: 400 }
      );
    }

    // Create the order
    const orderResponse = await fusionService.createOrder({
      fromTokenAddress: srcToken,
      toTokenAddress: dstToken,
      amount,
      walletAddress: wallet,
      receiver: receiver || wallet,
      permit,
      srcChainId: chainId,
      dstChainId,
    });

    // Return the order for frontend signing (don't submit yet)
    console.log('Order created successfully, returning for signature');
    
    // Convert BigInt values to strings for JSON serialization
    const serializableOrder = JSON.parse(JSON.stringify(orderResponse.order, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    return NextResponse.json({
      success: true,
      order: serializableOrder,
      quoteId: orderResponse.quoteId,
      orderHash: '', // Will be set after successful submission
      message: 'Order created successfully, ready for signing',
    });
  } catch (error: unknown) {
    console.error('Error submitting Fusion order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit Fusion order' },
      { status: 500 }
    );
  }
}
