import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_URL = 'https://api.1inch.dev';
const API_KEY = process.env.ONEINCH_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      chainId = '1',
      src,
      dst,
      amount,
      from,
      receiver,
      preset = 'fast',
      source,
      permit,
      interactions
    } = body;

    if (!src || !dst || !amount || !from) {
      return NextResponse.json(
        { error: 'Missing required parameters: src, dst, amount, from' },
        { status: 400 }
      );
    }

    const requestBody = {
      src,
      dst,
      amount,
      from,
      receiver: receiver || from,
      preset,
      ...(source && { source }),
      ...(permit && { permit }),
      ...(interactions && { interactions }),
    };

    const response = await fetch(
      `${ONEINCH_API_URL}/fusion/relayer/v1.0/${chainId}/order/submit`,
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
    console.error('Error submitting Fusion order:', error);
    return NextResponse.json(
      { error: 'Failed to submit Fusion order' },
      { status: 500 }
    );
  }
}
