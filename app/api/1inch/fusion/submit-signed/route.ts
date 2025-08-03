import { NextRequest, NextResponse } from 'next/server';
import { fusionService } from '@/lib/fusion';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order, signature, quoteId, chainId = 1 } = body;

    // Validate required parameters
    if (!order || !signature || !quoteId) {
      return NextResponse.json(
        { error: 'Missing required parameters: order, signature, quoteId' },
        { status: 400 }
      );
    }

    console.log('Submitting signed Fusion order:', {
      quoteId,
      chainId,
      hasSignature: !!signature,
      hasOrder: !!order,
    });

    // Submit the signed order to the Fusion resolver network
    const result = await fusionService.submitSignedOrder(order, signature, quoteId, chainId);

    return NextResponse.json({
      success: true,
      orderHash: result.orderHash,
      status: 'submitted',
      message: 'Order submitted to Fusion resolver network',
    });

  } catch (error: any) {
    console.error('Error in submit-signed API:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to submit signed order',
        details: error.response?.data || null,
      },
      { status: 500 }
    );
  }
}
