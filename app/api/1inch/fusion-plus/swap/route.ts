import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_URL = 'https://api.1inch.dev';
const API_KEY = process.env.ONEINCH_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      srcChainId,
      dstChainId,
      src,
      dst,
      amount,
      from,
      receiver,
      preset = 'fast',
      permit,
      interactions
    } = body;

    if (!srcChainId || !dstChainId || !src || !dst || !amount || !from) {
      return NextResponse.json(
        { error: 'Missing required parameters: srcChainId, dstChainId, src, dst, amount, from' },
        { status: 400 }
      );
    }

    const requestBody = {
      srcChainId,
      dstChainId,
      src,
      dst,
      amount,
      from,
      receiver: receiver || from,
      preset,
      ...(permit && { permit }),
      ...(interactions && { interactions }),
    };

    const response = await fetch(
      `${ONEINCH_API_URL}/fusion-plus/relayer/v1.0/order/submit`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'accept': 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error submitting Fusion+ cross-chain order:', error);
    return NextResponse.json(
      { error: 'Failed to submit Fusion+ cross-chain order' },
      { status: 500 }
    );
  }
}
