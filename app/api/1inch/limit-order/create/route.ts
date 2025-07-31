import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_URL = 'https://api.1inch.dev';
const API_KEY = process.env.ONEINCH_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      chainId = '1',
      makerAsset,
      takerAsset,
      makingAmount,
      takingAmount,
      maker,
      receiver,
      allowedSender,
      predicate,
      permit,
      interactions,
      salt,
      extension
    } = body;

    if (!makerAsset || !takerAsset || !makingAmount || !takingAmount || !maker) {
      return NextResponse.json(
        { error: 'Missing required parameters: makerAsset, takerAsset, makingAmount, takingAmount, maker' },
        { status: 400 }
      );
    }

    const requestBody = {
      makerAsset,
      takerAsset,
      makingAmount,
      takingAmount,
      maker,
      ...(receiver && { receiver }),
      ...(allowedSender && { allowedSender }),
      ...(predicate && { predicate }),
      ...(permit && { permit }),
      ...(interactions && { interactions }),
      ...(salt && { salt }),
      ...(extension && { extension }),
    };

    const response = await fetch(
      `${ONEINCH_API_URL}/orderbook/v4.0/${chainId}/order`,
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
    console.error('Error creating limit order:', error);
    return NextResponse.json(
      { error: 'Failed to create limit order' },
      { status: 500 }
    );
  }
}
